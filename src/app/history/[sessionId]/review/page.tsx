'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

// このページに渡されるパラメータの型定義
type ReviewPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

// Simple Markdown-like renderer component
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="prose prose-invert prose-slate">
      {lines.map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold text-yellow-300 mt-6 mb-2">{line.substring(4)}</h3>;
        } else if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-yellow-400 mt-8 mb-4 border-b border-slate-600 pb-2">{line.substring(3)}</h2>;
        } else if (line.startsWith('#### ')) {
          return <h4 key={index} className="text-lg font-semibold text-teal-300 mt-4 mb-2">{line.substring(5)}</h4>;
        } else if (line.trim() === '') {
          return <br key={index} />;
        } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
          return <p key={index} className="ml-4">{line}</p>;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index}><strong className="font-bold">{line.substring(2, line.length - 2)}</strong></p>;
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
};


/**
 * AIによるレビューを表示するページ
 */
export default function ReviewPage({ params }: ReviewPageProps) {
  const { sessionId } = use(params);
  const [review, setReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getReview = async () => {
      try {
        const historyResponse = await fetch(`/api/history/${sessionId}`, { cache: 'no-store' });
        if (!historyResponse.ok) {
          throw new Error('面接履歴の取得に失敗しました。');
        }
        const historyData = await historyResponse.json();

        if (!historyData.history || historyData.history.length === 0) {
          throw new Error('レビュー対象の履歴データがありません。');
        }

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
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto my-10 p-4 sm:p-6 bg-slate-800 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-2xl font-bold text-yellow-400">AIによるレビュー</h1>
          <Link href={`/history/${sessionId}`}>
            <div className="text-slate-400 hover:text-white transition-colors text-sm">
              &larr; 結果概要に戻る
            </div>
          </Link>
        </div>

        {isLoading && (
          <div className="text-center text-slate-300 py-10">
            <p>AIがレビューを生成中です...</p>
            <p>（10秒ほどかかる場合があります）</p>
          </div>
        )}

        {error && <p className="text-center text-red-400 py-10">エラー: {error}</p>}

        {!isLoading && !error && (
          <div className="bg-slate-800/50 p-6 rounded-lg text-slate-200 leading-relaxed">
            {review ? <SimpleMarkdown content={review} /> : "レビューを生成できませんでした。"}
          </div>
        )}
      </div>
    </div>
  );
}
