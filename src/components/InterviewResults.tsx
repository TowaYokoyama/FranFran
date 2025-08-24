'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type InterviewResultsProps = {
  sessionId: string | null;
};

export const InterviewResults = ({ sessionId }: InterviewResultsProps) => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("セッションIDが無効です。");
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);
       
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResults({
          message: "お疲れ様でした！面接結果を確認しましょう。",
          sessionId: sessionId,
        });
        
      } catch (err) {
        setError("結果の取得に失敗しました。");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="text-center flex flex-col items-center justify-center h-full">
        <h3 className="text-xl font-bold text-teal-300 mb-4">面接結果を生成中...</h3>
        <p>しばらくお待ちください。</p>
        {/* スピナーなどをここに追加しても良い */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center bg-red-900 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-2">エラー</h3>
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold text-teal-300 mb-4">
        面接終了！
      </h2>
      
      {/* はなまるの絵文字を表示 */}
      <p className="text-8xl mb-6">💮</p>
      
      <p className="text-slate-300 mb-8">
        {results?.message || "練習しただけで偉いで"}
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* 結果詳細ページへのリンクボタン */}
        <Link
          href={`/history/${sessionId}`}
          className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 transition-colors text-center"
        >
          結果詳細を見るで
        </Link>
        
        {/* スタート画面に戻るボタン */}
        <Link
          href="/start"
          className="w-full p-4 bg-slate-600 rounded-lg text-white text-lg font-bold hover:bg-slate-700 transition-colors text-center"
        >
          スタート画面に戻るで
        </Link>
      </div>
    </div>
  );

};