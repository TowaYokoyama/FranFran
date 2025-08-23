import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from "crypto";

// --- VOICEVOX & セッション管理の準備 ---
const VOICEVOX_API_URL = "http://localhost:50021";

type Session = { id: string; questionCount: number; finished: boolean };
const g = globalThis as any;
const SESSIONS: Map<string, Session> = g.__SESSIONS ?? new Map<string, Session>();
if (!g.__SESSIONS) g.__SESSIONS = SESSIONS;

// --- 固定の質問 ---
const FIRST_Q = "開発経験を教えて頂ければと思います。どの言語・フレームワークで、どんなプロジェクトをやりましたか？";
const FOLLOWUP_JAVA = "オブジェクト指向についての説明とかできますでしょうか？";
const FOLLOWUP_OTHER = "HTTP と REST の違いを端的に説明し、実装上の注意点を1つ挙げてください。";
const FINAL_MESSAGE = "ありがとうございました。以上で面接は終了です。お疲れ様でした。";

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
      SESSIONS.set(id, { id, questionCount: 1, finished: false });
      textToSpeak = FIRST_Q;
      newSessionId = id;
    } else {
      const s = sessionId ? SESSIONS.get(sessionId) : null;
      if (!s) return NextResponse.json({ error: "invalid sessionId" }, { status: 400 });
      if (s.finished) return NextResponse.json({ error: "session finished" }, { status: 400 });

      if (stage === "answer") {
        if (!answer) return NextResponse.json({ error: "answer is required" }, { status: 400 });
        
        
        if (s.questionCount === 1) {
          // 1問目の回答 -> 2問目を生成
          const isJava = /\bjava\b/i.test(answer);
          textToSpeak = isJava ? FOLLOWUP_JAVA : FOLLOWUP_OTHER;
          s.questionCount = 2; // 次は2問目
        } else {
          // 2問目の回答 -> 面接終了
          textToSpeak = FINAL_MESSAGE;
          s.finished = true;
          isFinished = true;
        }
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