'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// このページに渡されるパラメータの型定義
type ReviewPageProps = {
  params: {
    sessionId: string;
  };
};

/**
 * AIによるレビューを表示するページ
 */
export default function ReviewPage({ params }: ReviewPageProps) {
  const { sessionId } = params;
  const [review, setReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getReview = async () => {
      try {
        // 1. まず面接履歴を取得する
        const historyResponse = await fetch(`/api/history/${sessionId}`);
        if (!historyResponse.ok) {
          throw new Error('面接履歴の取得に失敗しました。');
        }
        const historyData = await historyResponse.json();

        if (!historyData.history || historyData.history.length === 0) {
          throw new Error('レビュー対象の履歴データがありません。');
        }

        // 2. 取得した履歴を基に、AIレビューをリクエストする
        const reviewResponse = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: historyData.history }),
        });

        if (!reviewResponse.ok) {
          throw new Error('AIレビューの生成に失敗しました。');
        }
        const reviewData = await reviewResponse.json();
        setReview(reviewData.review);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getReview();
  }, [sessionId]);

  return (
    <div className="max-w-3xl mx-auto my-10 p-6 bg-slate-900 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">AIによるレビュー</h1>
        <Link href={`/history/${sessionId}`}>
          <div className="text-slate-400 hover:text-white transition-colors text-sm">
            &larr; 結果概要に戻る
          </div>
        </Link>
      </div>

      {isLoading && (
        <div className="text-center text-slate-300">
          <p>AIがレビューを生成中です...</p>
          <p>（10秒ほどかかる場合があります）</p>
        </div>
      )}

      {error && <p className="text-center text-red-400">エラー: {error}</p>}

      {!isLoading && !error && (
        <div className="whitespace-pre-wrap bg-slate-800/50 p-6 rounded-lg text-slate-200 leading-relaxed">
          {review || "レビューを生成できませんでした。"}
        </div>
      )}
    </div>
  );
}
