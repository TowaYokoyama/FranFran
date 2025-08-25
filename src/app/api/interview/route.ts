import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Node ランタイム（Edge だと Node モジュールが使えないため）
export const runtime = 'nodejs';

// --- VOICEVOX & セッション管理の準備 ---
const VOICEVOX_API_URL = 'http://voicevox:50021';

type QA = { qId: string; qText: string; aText: string };
type Session = {
  id: string;
  questionCount: number;
  finished: boolean;

  // 追加の会話状態
  history: QA[];
  lastAskedId?: string;
  conceptAsked: boolean; // 言語別の概念質問を出したか
  languageKey?: string | null; // 検知した主要言語
  teamSeen: boolean; // 回答の中に「チーム」系の語が出たか
  askedTeamRole: boolean; // チーム役割の質問をすでに聞いたか
  backgroundAsked: boolean; // 背景質問を聞いたか
  mainIndex: number; // メインシーケンスの進行位置
};

const g = globalThis as any;
const SESSIONS: Map<string, Session> = g.__SESSIONS ?? new Map<string, Session>();
if (!g.__SESSIONS) g.__SESSIONS = SESSIONS;

// --- イントロ & 固定の質問テキスト ---
const INTRO_MESSAGE = '本日面接を担当する小林です。よろしくお願いいたします。';
const FIRST_Q = '自己紹介をお願いします。';
// 自己紹介の次に必ず聞く開発経験の質問
const DEV_EXP_Q = '開発経験を教えて頂ければと思います。どの言語・フレームワークで、どんなプロジェクトをやりましたか？';

// 言語別の概念質問（検知できた言語があれば、その言語に応じて出す）
const CONCEPT_Q = {
  java: 'オブジェクト指向についての説明とかできますでしょうか？',
  react:
    'Reactの仮想DOMと再レンダリングの仕組みを簡潔に説明し、パフォーマンス最適化の具体例を1つ挙げてください。',
  javascript:
    'JavaScriptのイベントループと非同期処理（microtask / macrotask）の違いを端的に説明してください。',
  typescript:
  
    'TypeScriptを導入する利点を型システムの観点から1つ挙げ、簡単な具体例を示してください。',
  python: 'PythonのGIL（グローバルインタプリタロック）とは何か、並行処理へ与える影響を説明してください。',
  go: 'Goのgoroutineとchannelの基本を説明し、典型的な使い所を1つ挙げてください。',
  ruby: 'Ruby（Rails）のMVCとバリデーション／コールバックの役割を簡潔に説明してください。',
  rust: 'Rustの所有権と借用の概念を端的に説明してください。',
  node: 'Node.jsのノンブロッキングI/Oモデルについて説明し、ブロッキングを避ける実装上の注意を1つ挙げてください。',
  sql: 'データベース正規化（第1〜第3正規形）の要点を簡潔に説明し、インデックス設計の注意点を1つ挙げてください。',
  swift: 'SwiftのOptionalと安全なアンラップ（if let / guard let）について説明してください。',
  kotlin: 'Kotlinのnull安全とデータクラスの利点を説明してください。',
  vue: 'Vueのリアクティブシステム（ref/reactive）の仕組みを説明してください。',
  angular: 'Angularの依存性注入（DI）の仕組みを簡潔に説明してください。',
} as const;

const BACKGROUND_Q = 'それを開発しようと思った背景を、さらに詳しく教えてください。';

// 条件（チーム言及あり）で出す
const TEAM_ROLE_Q = '先ほどチームでの開発に触れていましたが、チーム開発でのあなたの役割を教えてください。';

// 以降のメインシーケンス
const WHY_LANGUAGE_Q = (lang?: string | null) =>
  lang
    ? `なぜその開発言語（${displayName(lang)}）を選定したのですか？技術的な理由や制約も含めて教えてください。`
    : 'なぜその技術選定にしたのですか？技術的な理由や制約も含めて教えてください。';

const OTHER_FAVORITES_Q = '他に好きな言語や得意な言語があれば教えてください。';

const DIFF_LANG_Q =
  '使ったことのある言語の違い（型付け・並行処理・エコシステムなど）を、具体例を交えて説明してください。';

const GENAI_Q =
  '開発で生成AIを使いましたか？また、日頃の開発で生成AIをどのように活用しているか教えてください。';

const STRENGTH_Q = 'それでは、視点を変えてあなたの強みを教えてください。';

const CAREER_Q = 'エンジニアとしてのキャリアビジョンを教えてください。';
const AT_COMPANY_Q = '弊社に入ったら、どのような取り組みをしたいですか？';

const ANY_QUESTIONS_Q = 'こちらからの質問は以上です。何か質問があればお答えします。何かありますか？';

const FINAL_MESSAGE = 'ありがとうございました。以上で面接は終了です。お疲れ様でした。';

// --- テキスト正規化 & 検知ユーティリティ ---
function toKatakana(str: string): string {
  return (str ?? '')
    .normalize('NFKC')
    .replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

function mentionsJava(input: string | undefined | null): boolean {
  const text = (input ?? '').trim();
  if (/\bjava\b/i.test(text)) return true; // 英語の「Java」
  const kata = toKatakana(text);
  // 「ジャバ/ジャヴァ」の直後に任意空白(や中黒)＋「スクリプト」が続く場合は除外
  return /(ジャ(?:バ|ヴァ))(?!\s*[・ｰー-]?\s*スクリプト)/.test(kata);
}


function mentionsTeam(text: string | undefined | null): boolean {
  const t = (text ?? '').toLowerCase();
  const kata = toKatakana(t);
  return /team/.test(t) || /チーム/.test(kata) || /共同|担当|役割|スクラム|モブ|ペアプロ/.test(kata);
}

// 言語検知（優先順位つき）
function detectLanguageKey(answer: string): string | null {
  const kata = toKatakana(answer ?? '');

  // React / Next
  if (/\breact(\.js)?\b/i.test(answer) || /\bnext(\.js)?\b/i.test(answer)) return 'react';

  // Java（ただしJavaScriptは除外）
  if (mentionsJava(answer)) return 'java';

  // TypeScript / JavaScript / Node
  if (/\btypescript\b/i.test(answer) || /タイプスクリプト/.test(kata)) return 'typescript';
  if (/\bjavascript\b/i.test(answer) || /\bjs\b(?!\w)/i.test(answer)) return 'javascript';
  if (/\bnode(\.js)?\b/i.test(answer)) return 'node';

  // Python
  if (/\bpython\b/i.test(answer) || /パイソン/.test(kata)) return 'python';

  // Go
  if (/\bgolang\b/i.test(answer) || /\bgo\b(?!\w)/i.test(answer) || /go言語/.test(kata)) return 'go';

  // Ruby
  if (/\bruby\b/i.test(answer) || /ルビー/.test(kata)) return 'ruby';

  // Rust
  if (/\brust\b/i.test(answer) || /ラスト/.test(kata)) return 'rust';

  // Swift / Kotlin
  if (/\bswift\b/i.test(answer)) return 'swift';
  if (/\bkotlin\b/i.test(answer)) return 'kotlin';

  // Vue / Angular
  if (/\bvue(\.js)?\b/i.test(answer)) return 'vue';
  if (/\bangular\b/i.test(answer)) return 'angular';

  // C/C++（C++優先）
  if (/\bc\+\+\b|\bcpp\b/i.test(answer) || /シープラスプラス/.test(kata)) return 'cpp';
  if (/\bc言語\b/.test(kata) || /\bc(?!\w)/i.test(answer)) return 'c';

  // PHP
  if (/\bphp\b/i.test(answer) || /ピーエイチピー/.test(kata)) return 'php';

  // SQL
  if (/\bsql\b/i.test(answer) || /エスキューエル/.test(kata)) return 'sql';

  return null;
}

function conceptQuestionFor(lang: string | null): string | null {
  if (!lang) return null;
  const key = lang as keyof typeof CONCEPT_Q;
  return CONCEPT_Q[key] ?? null;
}

function displayName(lang: string): string {
  const map: Record<string, string> = {
    java: 'Java',
    react: 'React',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    go: 'Go',
    ruby: 'Ruby',
    rust: 'Rust',
    node: 'Node.js',
    sql: 'SQL',
    swift: 'Swift',
    kotlin: 'Kotlin',
    vue: 'Vue',
    angular: 'Angular',
    c: 'C',
    cpp: 'C++',
    php: 'PHP',
  };
  return map[lang] ?? lang;
}

// メインシーケンスのID列（TEAM_ROLE は条件付き）
const MAIN_SEQ: string[] = [
  'TEAM_ROLE',
  'WHY_LANGUAGE',
  'OTHER_FAVORITES',
  'DIFF_LANG',
  'GENAI',
  'STRENGTH',
  'CAREER',
  'AT_COMPANY',
  'ANY_QUESTIONS',
];

// 次の質問を決めるステートマシン（仕様どおりのフロー）
function nextQuestion(
  session: Session,
  lastAnswer?: string,
): { qId: string; text: string; final?: boolean } {
  // 直前回答からフラグ更新
  if (lastAnswer && mentionsTeam(lastAnswer)) {
    session.teamSeen = true;
  }

  // 1) 自己紹介の次は必ず「開発経験」
  if (session.questionCount === 1) {
    return { qId: 'DEV_EXP', text: DEV_EXP_Q };
  }

  // 2) 開発経験の回答後：言語検知して 概念質問 or 背景質問
  if (session.questionCount === 2) {
    const lang = detectLanguageKey(lastAnswer ?? '');
    session.languageKey = lang;
    const concept = conceptQuestionFor(lang);
    if (concept) {
      session.conceptAsked = true;
      return { qId: 'CONCEPT', text: concept };
    } else {
      session.backgroundAsked = true;
      return { qId: 'BACKGROUND', text: BACKGROUND_Q };
    }
  }

  // 3) 概念質問の直後は背景質問へ（まだ出していなければ）
  if (session.conceptAsked && !session.backgroundAsked) {
    session.backgroundAsked = true;
    return { qId: 'BACKGROUND', text: BACKGROUND_Q };
  }

  // 4) 以降はメインシーケンス
  while (session.mainIndex < MAIN_SEQ.length) {
    const step = MAIN_SEQ[session.mainIndex];

    if (step === 'TEAM_ROLE') {
      session.mainIndex++;
      if (session.teamSeen && !session.askedTeamRole) {
        session.askedTeamRole = true;
        return { qId: 'TEAM_ROLE', text: TEAM_ROLE_Q };
      }
      // チーム言及が無い場合はスキップ
      continue;
    }

    if (step === 'WHY_LANGUAGE') {
      session.mainIndex++;
      return { qId: 'WHY_LANGUAGE', text: WHY_LANGUAGE_Q(session.languageKey) };
    }

    if (step === 'OTHER_FAVORITES') {
      session.mainIndex++;
      return { qId: 'OTHER_FAVORITES', text: OTHER_FAVORITES_Q };
    }

    if (step === 'DIFF_LANG') {
      session.mainIndex++;
      return { qId: 'DIFF_LANG', text: DIFF_LANG_Q };
    }

    if (step === 'GENAI') {
      session.mainIndex++;
      return { qId: 'GENAI', text: GENAI_Q };
    }

    if (step === 'STRENGTH') {
      session.mainIndex++;
      return { qId: 'STRENGTH', text: STRENGTH_Q };
    }

    if (step === 'CAREER') {
      session.mainIndex++;
      return { qId: 'CAREER', text: CAREER_Q };
    }

    if (step === 'AT_COMPANY') {
      session.mainIndex++;
      return { qId: 'AT_COMPANY', text: AT_COMPANY_Q };
    }

    if (step === 'ANY_QUESTIONS') {
      session.mainIndex++;
      return { qId: 'ANY_QUESTIONS', text: ANY_QUESTIONS_Q };
    }
  }

  // 5) 「何か質問ありますか？」への回答後は終了メッセージ
  if (session.lastAskedId === 'ANY_QUESTIONS') {
    return { qId: 'FINAL', text: FINAL_MESSAGE, final: true };
  }

  // フェイルセーフ
  return { qId: 'FINAL', text: FINAL_MESSAGE, final: true };
}

// 音声合成
async function synthesizeSpeech(textToSpeak: string): Promise<Blob> {
  const speakerId = 13; // 青山龍星
  const audioQueryResponse = await fetch(
    `${VOICEVOX_API_URL}/audio_query?text=${encodeURIComponent(textToSpeak)}&speaker=${speakerId}`,
    { method: 'POST' },
  );
  if (!audioQueryResponse.ok) throw new Error('VOICEVOX audio_query failed');
  const audioQuery = await audioQueryResponse.json();

  const synthesisResponse = await fetch(
    `${VOICEVOX_API_URL}/synthesis?speaker=${speakerId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioQuery),
    },
  );
  if (!synthesisResponse.ok) throw new Error('VOICEVOX synthesis failed');
  return synthesisResponse.blob();
}

// ルート
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stage = String(body?.stage ?? '');
    const sessionId = body?.sessionId ? String(body.sessionId) : undefined;
    const answer = typeof body?.answer === 'string' ? body.answer : undefined;

    let textToSpeak = '';
    let newSessionId = '';
    let isFinished = false;
    let qId = '';

    if (stage === 'init') {
      const id = randomUUID();
      const s: Session = {
        id,
        questionCount: 1, // FIRST_Qを発話済みとしてカウント1から開始
        finished: false,
        history: [],
        lastAskedId: 'FIRST',
        conceptAsked: false,
        languageKey: null,
        teamSeen: false,
        askedTeamRole: false,
        backgroundAsked: false,
        mainIndex: 0,
      };
      SESSIONS.set(id, s);

      // 挨拶＋最初の質問をまとめて読み上げ
      textToSpeak = `${INTRO_MESSAGE} それでは、${FIRST_Q}`;
      newSessionId = id;
      qId = 'FIRST';
    } else {
      const s = sessionId ? SESSIONS.get(sessionId) : null;
      if (!s) return NextResponse.json({ error: 'invalid sessionId' }, { status: 400 });
      if (s.finished) return NextResponse.json({ error: 'session finished' }, { status: 400 });

      if (stage === 'answer') {
        if (!answer) return NextResponse.json({ error: 'answer is required' }, { status: 400 });

        // 直前の質問に対する回答を履歴に積む
        if (s.lastAskedId) {
          s.history.push({
            qId: s.lastAskedId,
            qText: questionTextFromId(s.lastAskedId, s.languageKey),
            aText: answer,
          });
        }

        // 次の質問を決定
        const next = nextQuestion(s, answer);
        textToSpeak = next.text;
        qId = next.qId;
        s.lastAskedId = next.qId;
        s.questionCount++;

        if (next.final) {
          s.finished = true;
          isFinished = true;
        }
      } else {
        return NextResponse.json({ error: 'unknown stage' }, { status: 400 });
      }
    }

    const audioBlob = await synthesizeSpeech(textToSpeak);

    const headers: Record<string, string> = {
      'Content-Type': 'audio/wav',
      'X-Question-Id': qId,
      'X-Question-Text': encodeURIComponent(textToSpeak),
      'X-Finished': String(isFinished),
    };
    const sid = newSessionId || sessionId;
    if (sid) headers['X-Session-Id'] = sid;

    const response = new NextResponse(audioBlob, {
      status: 200,
      headers,
    });
    return response;
  } catch (error) {
    console.error('API Error in /api/interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 補助: lastAskedId から質問文を復元（履歴保存用）
function questionTextFromId(qId: string, lang?: string | null): string {
  switch (qId) {
    case 'FIRST':
      return FIRST_Q;
    case 'DEV_EXP':
      return DEV_EXP_Q;
    case 'CONCEPT':
      return conceptQuestionFor(lang ?? null) ?? '';
    case 'BACKGROUND':
      return BACKGROUND_Q;
    case 'TEAM_ROLE':
      return TEAM_ROLE_Q;
    case 'WHY_LANGUAGE':
      return WHY_LANGUAGE_Q(lang);
    case 'OTHER_FAVORITES':
      return OTHER_FAVORITES_Q;
    case 'DIFF_LANG':
      return DIFF_LANG_Q;
    case 'GENAI':
      return GENAI_Q;
    case 'STRENGTH':
      return STRENGTH_Q;
    case 'CAREER':
      return CAREER_Q;
    case 'AT_COMPANY':
      return AT_COMPANY_Q;
    case 'ANY_QUESTIONS':
      return ANY_QUESTIONS_Q;
    case 'FINAL':
      return FINAL_MESSAGE;
    default:
      return '';
  }
}
