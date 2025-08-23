import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from "crypto";
import redis from '@/lib/redis'; // ★ Redisクライアントをインポート

// --- VOICEVOX & セッション管理の準備 ---
// ★ Docker Composeのサービス名 'voicevox' を使う
const VOICEVOX_API_URL = "http://voicevox:50021"; 

// ★ セッションの型定義 (会話履歴も保存できるように拡張)
type ChatMessage = {
  role: 'ai' | 'user';
  content: string;
};
type Session = { 
  id: string; 
  questionCount: number; 
  finished: boolean;
  history: ChatMessage[];
};

// --- 固定の質問 (変更なし) ---
const FIRST_Q = "開発経験を教えて頂ければと思います。どの言語・フレームワークで、どんなプロジェクトをやりましたか？";
const FOLLOWUP_JAVA = "オブジェクト指向についての説明とかできますでしょうか？";
const FOLLOWUP_OTHER = "HTTP と REST の違いを端的に説明し、実装上の注意点を1つ挙げてください。";
const FINAL_MESSAGE = "ありがとうございました。以上で面接は終了です。お疲れ様でした。";

// --- 音声合成関数 (変更なし) ---
async function synthesizeSpeech(textToSpeak: string): Promise<Blob> {
  const speakerId = 13; // 青山龍星
  const audioQueryResponse = await fetch(
    `${VOICEVOX_API_URL}/audio_query?text=${encodeURIComponent(textToSpeak)}&speaker=${speakerId}`,
    { method: 'POST' }
  );
  if (!audioQueryResponse.ok) throw new Error('VOICEVOX audio_query failed');
  const audioQuery = await audioQueryResponse.json();

  const synthesisResponse = await fetch(
    `${VOICEVOX_API_URL}/synthesis?speaker=${speakerId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audioQuery),
    }
  );
  if (!synthesisResponse.ok) throw new Error('VOICEVOX synthesis failed');
  return synthesisResponse.blob();
}

// --- POST処理 (Redisを使うように修正) ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stage = String(body?.stage ?? "");
    const sessionId = body?.sessionId ? String(body.sessionId) : undefined;
    const answer = typeof body?.answer === "string" ? body.answer : undefined;

    let textToSpeak = "";
    let newSessionId = "";
    let isFinished = false;

    if (stage === "init") {
      const id = randomUUID();
      textToSpeak = FIRST_Q;
      
      const newSession: Session = { 
        id, 
        questionCount: 1, 
        finished: false,
        history: [{ role: 'ai', content: textToSpeak }] 
      };

      // ★ Redisにセッションを保存 (有効期限を1時間に設定)
      await redis.set(`session:${id}`, JSON.stringify(newSession), 'EX', 3600);
      newSessionId = id;

    } else {
      if (!sessionId) {
        return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
      }
      
      // ★ Redisからセッションを取得
      const sessionData = await redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return NextResponse.json({ error: "invalid sessionId" }, { status: 400 });
      }
      
      const s: Session = JSON.parse(sessionData);

      if (s.finished) {
        return NextResponse.json({ error: "session finished" }, { status: 400 });
      }

      if (stage === "answer") {
        if (!answer) return NextResponse.json({ error: "answer is required" }, { status: 400 });

        s.history.push({ role: 'user', content: answer });
        
        if (s.questionCount === 1) {
          const isJava = /\bjava\b/i.test(answer);
          textToSpeak = isJava ? FOLLOWUP_JAVA : FOLLOWUP_OTHER;
          s.questionCount = 2;
        } else {
          textToSpeak = FINAL_MESSAGE;
          s.finished = true;
          isFinished = true;
        }
        
        s.history.push({ role: 'ai', content: textToSpeak });

        // ★ 更新したセッションをRedisに保存
        await redis.set(`session:${sessionId}`, JSON.stringify(s), 'EX', 3600);

      } else {
        return NextResponse.json({ error: "unknown stage" }, { status: 400 });
      }
    }

    const audioBlob = await synthesizeSpeech(textToSpeak);
    
    const response = new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'X-Question-Text': encodeURIComponent(textToSpeak),
        'X-Session-Id': newSessionId,
        'X-Finished': String(isFinished),
      },
    });
    return response;

  } catch (error) {
    console.error("API Error in /api/interview:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}