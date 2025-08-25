
import { NextRequest, NextResponse } from 'next/server';
import redis from '../../../../lib/redis';

// このランタイム指定により、Node.jsのAPIが利用可能になります
export const runtime = 'nodejs';

// 型定義: フロントエンドで利用するセッションの型
// interview/route.tsのSession型と合わせる
type Session = {
  id: string;
  finished: boolean;
  history: { qText: string; aText: string }[];
  // 他にも必要なフィールドがあれば追加
};

/**
 * GET /api/history/[sessionId]
 * 特定のセッションIDの面接履歴をRedisから取得して返すエンドポイント
 */
export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Redisから該当するセッションIDのデータを取得
    const sessionData = await redis.get(`interview:${sessionId}`);

    if (!sessionData) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // 取得したJSON文字列をパースしてクライアントに返す
    const session: Session = JSON.parse(sessionData);

    return NextResponse.json(session);

  } catch (error) {
    console.error(`Error fetching session ${params.sessionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
