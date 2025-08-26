// src/app/history/page.tsx
import Link from "next/link";
import { auth } from '@clerk/nextjs/server';
import redis from '@/lib/redis';
import { redirect } from 'next/navigation';

export const metadata = {
  title: "FranFran | 過去結果",
};

// 型定義
type ChatMessage = {
  role: 'ai' | 'user';
  content: string;
};
type Session = { 
  id: string; 
  finished: boolean;
  history: ChatMessage[];
  startTime: number;
  endTime?: number;
};
type HistoryItem = {
  id: string;
  date: string;
  duration: string;
  answerCount: number;
};

// Helper function to format duration
function formatDuration(start: number, end: number | undefined): string {
  if (!end) return 'N/A';
  const durationSeconds = Math.round((end - start) / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}分${seconds}秒`;
}

export default async function HistoryPage() {
  
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  
  const sessionIds = await redis.lrange(`user:${userId}:sessions`, 0, -1);
  if (sessionIds.length === 0) {
    return (
      <main className="min-h-screen bg-white text-center p-10">
        <p>まだ面接の履歴がありません。</p>
        <Link href="/" className="text-teal-600 hover:underline mt-4 inline-block">
          最初の面接を始める
        </Link>
      </main>
    );
  }
  
  const sessionKeys = sessionIds.map(id => `interview:${id}`);
  const sessionsData = await redis.mget(...sessionKeys);

  
  const items: HistoryItem[] = sessionsData
    .map(sessionString => sessionString ? (JSON.parse(sessionString) as Session) : null)
    .filter((s): s is Session => s !== null && s.finished)
    .map(s => ({
      id: s.id,
      date: new Date(s.startTime).toLocaleString('ja-JP'),
      duration: formatDuration(s.startTime, s.endTime),
      answerCount: s.history.filter(h => h.role === 'user').length,
    }))
    .reverse();

  
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center">
        <h1 className="text-2xl font-bold text-yellow-500">
          過去の面接結果
        </h1>
        <div className="ml-auto">
          <Link
            href="/"
            className="rounded px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white transition-colors"
          >
            ← スタートに戻る
          </Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">履歴一覧</h2>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2">実施日</th>
                  <th className="px-4 py-2">面接時間</th>
                  <th className="px-4 py-2">回答数</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="px-4 py-2">{h.date}</td>
                    <td className="px-4 py-2">{h.duration}</td>
                    <td className="px-4 py-2">{h.answerCount}</td>
                    <td className="px-4 py-2 text-right">
                      <Link 
                        href={`/history/${h.id}`}
                        className="rounded px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs transition-colors"
                      >
                        会話記録を見る
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}