// src/app/history/[sessionId]/page.tsx
import redis from '@/lib/redis';
import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 型定義
type ChatMessage = {
  role: 'ai' | 'user';
  content: string;
};
type Session = { 
  id: string; 
  history: ChatMessage[];
};

type PageProps = {
  params: {
    sessionId: string;
  }
}

async function getSessionData(sessionId: string): Promise<Session | null> {
  // ★ 修正点1: auth()の呼び出しにawaitを追加
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  
  const sessionDataString = await redis.get(`session:${sessionId}`);
  if (!sessionDataString) {
    return null;
  }

  // ★ 修正点2: 文字列をパースしてオブジェクトとして返す
  try {
    const session: Session = JSON.parse(sessionDataString);
    return session;
  } catch (e) {
    console.error("Failed to parse session JSON:", e);
    return null;
  }
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const session = await getSessionData(params.sessionId);

  if (!session) {
    return (
        <main className="min-h-screen bg-white text-center p-10">
          <p>セッションが見つからないか、アクセス権がありません。</p>
          <Link href="/history" className="text-teal-600 hover:underline mt-4 inline-block">
            履歴一覧に戻る
          </Link>
        </main>
      );
  }

  
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center sticky top-0">
        <h1 className="text-2xl font-bold text-yellow-500">
          面接記録 詳細
        </h1>
        <div className="ml-auto">
          <Link
            href="/history"
            className="rounded px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white transition-colors"
          >
            ← 履歴一覧に戻る
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {session.history.map((chat, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-4 ${chat.role === 'user' ? 'justify-end' : ''}`}
          >
            {chat.role === 'ai' && (
              <>
             <Image
            src="/ai-face.png" // ← public フォルダに置いた画像パスに変更
            alt="AI"
           width={40}
           height={40}
            className="object-cover"
            />
                <div className="bg-white p-4 rounded-lg shadow-sm border max-w-xl">
                  <p className="text-slate-800 whitespace-pre-wrap">{chat.content}</p>
                </div>
              </>
            )}
            {chat.role === 'user' && (
              <>
                <div className="bg-yellow-100 p-4 rounded-lg shadow-sm border border-yellow-200 max-w-xl">
                  <p className="text-slate-800 whitespace-pre-wrap">{chat.content}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold shrink-0">You</div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}