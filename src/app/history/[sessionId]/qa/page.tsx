'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 型定義: 質問と回答のペア
type QA = {
  qText: string;
  aText: string;
};

// このページに渡されるパラメータの型定義
type QAPageProps = {
  params: {
    sessionId: string;
  };
};

/**
 * 質疑応答の履歴を表示するページ
 */
export default function QAPage({ params }: QAPageProps) {
  const { sessionId } = params;
  const [history, setHistory] = useState<QA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history/${sessionId}`);
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
    <div className="max-w-3xl mx-auto my-10 p-6 bg-slate-900 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-teal-300">質疑応答の履歴</h1>
        <Link href={`/history/${sessionId}`}>
          <div className="text-slate-400 hover:text-white transition-colors text-sm">
            &larr; 結果概要に戻る
          </div>
        </Link>
      </div>

      {isLoading && <p className="text-center text-slate-300">履歴を読み込んでいます...</p>}
      {error && <p className="text-center text-red-400">エラー: {error}</p>}

      {!isLoading && !error && (
        <div className="space-y-6 bg-slate-800/50 p-6 rounded-lg">
          {history.length > 0 ? (
            history.map((qa, index) => (
              <div key={index} className="border-b border-slate-700 pb-4">
                <p className="font-semibold text-slate-300">Q{index + 1}: {qa.qText}</p>
                <p className="text-slate-200 mt-2 whitespace-pre-wrap">A: {qa.aText}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400">履歴データが見つかりませんでした。</p>
          )}
        </div>
      )}
    </div>
  );
}
