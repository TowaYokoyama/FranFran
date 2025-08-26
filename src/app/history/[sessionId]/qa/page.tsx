'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

// 型定義: 質問と回答のペア
type QA = {
  qText: string;
  aText: string;
};

// このページに渡されるパラメータの型定義
type QAPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

/**
 * 質疑応答の履歴を表示するページ
 */
export default function QAPage({ params }: QAPageProps) {
  const { sessionId } = use(params);
  const [history, setHistory] = useState<QA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history/${sessionId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('履歴の取得に失敗しました。');
        }
        const data = await response.json();
        setHistory(data.history || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto my-10 p-4 sm:p-6 bg-slate-800 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-2xl font-bold text-teal-300">質疑応答の履歴</h1>
          <Link href={`/history/${sessionId}`}>
            <div className="text-slate-400 hover:text-white transition-colors text-sm">
              &larr; 結果概要に戻る
            </div>
          </Link>
        </div>

        {isLoading && <p className="text-center text-slate-300 py-10">履歴を読み込んでいます...</p>}
        {error && <p className="text-center text-red-400 py-10">エラー: {error}</p>}

        {!isLoading && !error && (
          <div className="space-y-6 p-2">
            {history.length > 0 ? (
              history.map((qa, index) => (
                <div key={index}>
                  {/* AI Question Bubble */}
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-teal-300">AI</div>
                    <div className="bg-slate-700 rounded-lg p-4 max-w-[80%]">
                      <p className="text-slate-200 whitespace-pre-wrap">{qa.qText}</p>
                    </div>
                  </div>

                  {/* User Answer Bubble */}
                  <div className="flex items-start gap-3 justify-end mt-4">
                    <div className="bg-teal-600 rounded-lg p-4 max-w-[80%]">
                      <p className="text-white whitespace-pre-wrap">{qa.aText}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white">YOU</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-10">履歴データが見つかりませんでした。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
