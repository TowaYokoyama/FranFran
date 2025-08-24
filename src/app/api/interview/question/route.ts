export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type Session = { id: string; question: string; answer?: string; finished: boolean };


const g = globalThis as any;
const SESSIONS: Map<string, Session> = g.__SESSIONS ?? new Map<string, Session>();
if (!g.__SESSIONS) g.__SESSIONS = SESSIONS;


const json = (data: unknown, init: ResponseInit = {}) =>
  new NextResponse(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });

// --- 固定の質問（2問で終了／評価なし） ---
const FIRST_Q =
  "開発経験を教えて頂ければと思います。どの言語・フレームワークで、どんなプロジェクトをやりましたか？";
const FOLLOWUP_JAVA =
  "オブジェクト指向についての説明とかできますでしょうか？";
const FOLLOWUP_OTHER =
  "HTTP と REST の違いを端的に説明し、実装上の注意点を1つ挙げてください。";

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, { status: 400 });
  }

  const stage = String(body?.stage ?? "");
  const sessionId = body?.sessionId ? String(body.sessionId) : undefined;
  const answer = typeof body?.answer === "string" ? body.answer : undefined;

  // 1) セッション開始 → 1問目を返す
  if (stage === "init") {
    const id = randomUUID();
    const s: Session = { id, question: FIRST_Q, finished: false };
    SESSIONS.set(id, s);
    return json({ sessionId: id, question: s.question });
  }

  // 以降は session 必須
  const s = sessionId ? SESSIONS.get(sessionId) : null;
  if (!s) return json({ error: "invalid sessionId" }, { status: 400 });
  if (s.finished) return json({ error: "session finished" }, { status: 400 });

  // 2) 回答を受け取り → 分岐して追撃（ここで終了）
  if (stage === "answer") {
    if (!answer) {
      return json({ error: "answer is required" }, { status: 400 });
    }
    s.answer = answer;

    const isJava = /\bjava\b/i.test(answer);
    const followUp = isJava ? FOLLOWUP_JAVA : FOLLOWUP_OTHER;

    s.finished = true; // 2問で終了
    return json({ followUp, finished: true });
  }

  if (stage === "dump") {
    return json({
      sessionId: s.id,
      question: s.question,
      answer: s.answer ?? null,
      finished: s.finished,
    });
  }

  return json({ error: "unknown stage" }, { status: 400 });
}
