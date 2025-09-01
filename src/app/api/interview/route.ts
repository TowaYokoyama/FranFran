// =================================================================================
// AI面接 APIエンドポイント
// ---------------------------------------------------------------------------------
// このAPIは、AIとの対話形式の面接を実現します。
// フロントエンドからのリクエストに応じて、面接の開始、回答の処理、次の質問の生成、
// そして音声データの返却まで、面接のセッション全体を管理します。
// =================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@clerk/nextjs/server';

// VercelのEdge Runtimeではなく、Node.jsのランタイムで実行することを明示。
// これにより、`crypto`のようなNode.jsの標準モジュールが利用可能になる。
export const runtime = 'nodejs';

import redis from '../../../lib/redis';

// --- 外部サービス・設定値の定義 ---

// VoiceVox（音声合成エンジン）のAPI URLを環境変数から取得
const VOICEVOX_API_URL = process.env.VOICEVOX_API_URL;
if (!VOICEVOX_API_URL) {
  // 環境変数が設定されていない場合は、サーバー起動時にエラーを投げて処理を停止させる
  throw new Error("VOICEVOX_API_URL is not defined");
}

// --- 型定義 ---

// 質問と回答のペアを表現する型
type QA = { qId: string; qText: string; aText: string };

// 一回の面接セッション全体の状態を管理する型
type Session = {
  id: string; // セッションの一意なID
  questionCount: number; // 現在の質問数
  finished: boolean; // 面接が終了したかどうか
  endTime?: number; // 終了時刻 (Unixタイムスタンプ)

  // 面接の初期設定
  maxQuestions: number; // 最大質問数
  timeLimitMinutes: number; // 制限時間（分）
  startTime: number; // 開始時刻 (Unixタイムスタンプ)

  // 面接の進行状態を管理する動的なプロパティ
  history: QA[]; // 質問と回答の履歴
  lastAskedId?: string; // 最後にした質問のID
  conceptAsked: boolean; // 技術コンセプトに関する質問をしたか
  languageKey?: string | null; // ユーザーの回答から検知した主要なプログラミング言語
  teamSeen: boolean; // 回答に「チーム」関連の単語が登場したか
  askedTeamRole: boolean; // チームでの役割に関する質問をしたか
  backgroundAsked: boolean; // プロジェクトの背景に関する質問をしたか
  mainIndex: number; // 主要な質問リストのどこまで進んだか
};

// --- 質問テキストの定義 ---
// 面接で使われる各質問の文言を定数として定義

const INTRO_MESSAGE = '本日面接を担当する小林です。よろしくお願いいたします。';
const FIRST_Q = '自己紹介をお願いします。';
// 自己紹介の次に必ず聞く開発経験の質問
const DEV_EXP_Q = '開発経験を教えて頂ければと思います。どの言語・フレームワークで、どんなプロジェクトをやりましたか？';

// ユーザーの回答から検知した言語に応じて、技術的なコンセプトを問う質問
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

// --- 文字列処理・キーワード検知のためのユーティリティ関数群 ---

/**
 * ひらがなをカタカナに変換する関数
 * @param str 変換対象の文字列
 * @returns カタカナに変換された文字列
 */
function toKatakana(str: string): string {
  return (str ?? '')
    .normalize('NFKC')
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

/**
 * 回答に "Java" が含まれるか判定する関数（"JavaScript" との混同を避ける）
 * @param input 判定対象の文字列
 */
function mentionsJava(input: string | undefined | null): boolean {
  const text = (input ?? '').trim();
  if (/java/i.test(text)) return true; // 英語の「Java」
  const kata = toKatakana(text);
  // 「ジャバ/ジャヴァ」の直後に任意空白(や中黒)＋「スクリプト」が続く場合は除外
  return /(ジャ(?:バ|ヴァ))(?!\s*[・ｰー-]?\s*スクリプト)/.test(kata);
}


/**
 * 回答に「チーム」関連のキーワードが含まれるか判定する関数
 * @param text 判定対象の文字列
 */
function mentionsTeam(text: string | undefined | null): boolean {
  const t = (text ?? '').toLowerCase();
  const kata = toKatakana(t);
  return /team/.test(t) || /チーム/.test(kata) || /共同|担当|役割|スクラム|モブ|ペアプロ/.test(kata);
}

/**
 * 回答のテキストから主要なプログラミング言語を検知する関数
 * @param answer ユーザーの回答テキスト
 * @returns 検知した言語のキー（小文字）、見つからなければ null
 */
function detectLanguageKey(answer: string): string | null {
  const kata = toKatakana(answer ?? '');

  // React / Next
  if (/react(\.js)?\b/i.test(answer) || /next(\.js)?\b/i.test(answer)) return 'react';

  // Java（ただしJavaScriptは除外）
  if (mentionsJava(answer)) return 'java';

  // TypeScript / JavaScript / Node
  if (/typescript/i.test(answer) || /タイプスクリプト/.test(kata)) return 'typescript';
  if (/javascript/i.test(answer) || /js(?!W)/i.test(answer)) return 'javascript';
  if (/node(\.js)?\b/i.test(answer)) return 'node';

  // Python
  if (/python/i.test(answer) || /パイソン/.test(kata)) return 'python';

  // Go
  if (/golang/i.test(answer) || /go(?!W)/i.test(answer) || /go言語/.test(kata)) return 'go';

  // Ruby
  if (/ruby/i.test(answer) || /ルビー/.test(kata)) return 'ruby';

  // Rust
  if (/rust/i.test(answer) || /ラスト/.test(kata)) return 'rust';

  // Swift / Kotlin
  if (/swift/i.test(answer)) return 'swift';
  if (/kotlin/i.test(answer)) return 'kotlin';

  // Vue / Angular
  if (/vue(\.js)?\b/i.test(answer)) return 'vue';
  if (/angular/i.test(answer)) return 'angular';

  // C/C++（C++優先）
  if (/c++\b|cpp/i.test(answer) || /シープラスプラス/.test(kata)) return 'cpp';
  if (/c言語/.test(kata) || /c(?!W)/i.test(answer)) return 'c';

  // PHP
  if (/php/i.test(answer) || /ピーエイチピー/.test(kata)) return 'php';

  // SQL
  if (/sql/i.test(answer) || /エスキューエル/.test(kata)) return 'sql';

  return null;
}

/**
 * 言語キーに対応するコンセプト質問のテキストを返す関数
 * @param lang 言語キー
 */
function conceptQuestionFor(lang: string | null): string | null {
  if (!lang) return null;
  const key = lang as keyof typeof CONCEPT_Q;
  return CONCEPT_Q[key] ?? null;
}

/**
 * 言語キーを整形された表示名（例: "javascript" -> "JavaScript"）に変換する関数
 * @param lang 言語キー
 */
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

// --- 面接の進行ロジック ---

// 主要な質問の定義順（この順番で質問が進行する）
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

/**
 * 現在のセッション状態と直前の回答内容に基づき、次にすべき質問を決定するステートマシン
 * @param session 現在の面接セッションオブジェクト
 * @param lastAnswer ユーザーの直前の回答
 * @returns 次の質問のID、テキスト、および面接終了フラグ
 */
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

/**
 * 指定されたテキストをVoiceVoxエンジンに送り、音声データ（Blob）を生成する関数
 * @param textToSpeak 音声に変換したいテキスト
 * @returns 音声データ（.wav形式のBlob）
 */
async function synthesizeSpeech(textToSpeak: string): Promise<Blob> {
  const speakerId = 13; // VoiceVoxのキャラクターID（例: 青山龍星）
  
  // 1. audio_query: テキストから音声合成用のクエリを作成
  const audioQueryResponse = await fetch(
    `${VOICEVOX_API_URL}/audio_query?text=${encodeURIComponent(textToSpeak)}&speaker=${speakerId}`,
    { method: 'POST' },
  );
  if (!audioQueryResponse.ok) throw new Error('VOICEVOX audio_query failed');
  const audioQuery = await audioQueryResponse.json();

  // 2. synthesis: 作成したクエリを元に、実際の音声波形データを合成
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


// --- APIルートハンドラ ---

/**
 * 面接APIのメイン処理 (POSTリクエストを処理)
 * @param req Next.jsのリクエストオブジェクト
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストボディから各種データをパース
    const body = await req.json();
    const stage = String(body?.stage ?? ''); // 'init' (面接開始) or 'answer' (回答)
    const sessionId = body?.sessionId ? String(body.sessionId) : undefined;
    const answer = typeof body?.answer === 'string' ? body.answer : undefined;
    const settings = body?.settings as { questions: number; minutes: number } | undefined;

    let textToSpeak = ''; // これから話すセリフ
    let newSessionId = ''; // 新しく発行したセッションID
    let isFinished = false; // 面接が終了したか
    let qId = ''; // これからする質問のID

    // ==================================
    // 1. 面接開始 (stage === 'init')
    // ==================================
    if (stage === 'init') {
      if (!settings) {
        return NextResponse.json({ error: 'settings are required for init' }, { status: 400 });
      }

      // 新しいセッションIDを生成
      const id = randomUUID();
      // 新しいセッションオブジェクトを作成
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
        // 設定をセッションに保存
        maxQuestions: settings.questions,
        timeLimitMinutes: settings.minutes,
        startTime: Date.now(),
      };
      
      // セッション情報をRedisに保存
      await redis.set(`interview:${id}`, JSON.stringify(s));

      // ログインユーザー情報を取得し、そのユーザーのセッションリストに今回のIDを追加
      const { userId } = await auth();
      if (userId) {
        await redis.lpush(`user:${userId}:sessions`, id);
      }

      // 最初の挨拶と質問を合成
      textToSpeak = `${INTRO_MESSAGE} それでは、${FIRST_Q}`;
      newSessionId = id;
      qId = 'FIRST';
    
    // ==================================
    // 2. 回答処理 (stage === 'answer')
    // ==================================
    } else {
      // Redisから現在のセッションデータを取得
      const sessionData = sessionId ? await redis.get(`interview:${sessionId}`) : null;
      const s: Session | null = sessionData ? JSON.parse(sessionData) : null;

      // セッションが見つからない、または終了済みの場合はエラー
      if (!s) return NextResponse.json({ error: 'invalid sessionId' }, { status: 400 });
      if (s.finished) return NextResponse.json({ error: 'session finished' }, { status: 400 });

      if (stage === 'answer') {
        // --- 終了条件（時間 or 質問数）をチェック ---
        const now = Date.now();
        const timeElapsedMinutes = (now - s.startTime) / (1000 * 60);
        let endReason: string | null = null;
        if (timeElapsedMinutes >= s.timeLimitMinutes) {
          endReason = `設定された${s.timeLimitMinutes}分の制限時間に達しました。`;
        }
        if (s.questionCount >= s.maxQuestions) {
          endReason = `設定された${s.maxQuestions}問の質問数に達しました。`;
        }

        if (endReason) {
          // 終了条件に達した場合
          textToSpeak = `${endReason} ${FINAL_MESSAGE}`;
          qId = 'FINAL';
          s.finished = true;
          s.endTime = Date.now();
          isFinished = true;
          await redis.set(`interview:${sessionId}`, JSON.stringify(s));
        } else {
          // --- 通常の質問応答フロー ---
          if (!answer) return NextResponse.json({ error: 'answer is required' }, { status: 400 });

          // 回答を履歴に保存
          if (s.lastAskedId) {
            s.history.push({
              qId: s.lastAskedId,
              qText: questionTextFromId(s.lastAskedId, s.languageKey),
              aText: answer,
            });
          }

          // ステートマシンを呼び出して次の質問を決定
          const next = nextQuestion(s, answer);
          textToSpeak = next.text;
          qId = next.qId;
          s.lastAskedId = next.qId;
          s.questionCount++;

          // もし次の質問が最後なら、終了フラグを立てる
          if (next.final) {
            s.finished = true;
            s.endTime = Date.now();
            isFinished = true;
          }

          // 変更されたセッション情報をRedisに保存
          await redis.set(`interview:${sessionId}`, JSON.stringify(s));
        }
      } else {
        // 'init', 'answer' 以外の不正なstageの場合はエラー
        return NextResponse.json({ error: 'unknown stage' }, { status: 400 });
      }
    }

    // --- 音声合成とレスポンス返却 ---

    // 決定したセリフを音声データに変換
    const audioBlob = await synthesizeSpeech(textToSpeak);

    // レスポンスヘッダーに、セッションIDや質問IDなどの付加情報を詰める
    const headers: Record<string, string> = {
      'Content-Type': 'audio/wav',
      'X-Question-Id': qId,
      'X-Question-Text': encodeURIComponent(textToSpeak),
      'X-Finished': String(isFinished),
    };
    const sid = newSessionId || sessionId;
    if (sid) headers['X-Session-Id'] = sid;

    // 音声データをレスポンスボディとして、ヘッダーとともにフロントエンドに返却
    const response = new NextResponse(audioBlob, {
      status: 200,
      headers,
    });
    return response;

  } catch (error) {
    // API全体で予期せぬエラーが発生した場合の処理
    console.error('API Error in /api/interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * 補助関数: 質問IDから質問の原文を復元する（履歴保存用）
 * @param qId 質問ID
 * @param lang 言語キー
 * @returns 質問のテキスト
 */
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