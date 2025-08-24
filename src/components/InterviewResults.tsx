'use client';

import { useEffect, useState } from 'react';


type InterviewResultsProps = {
  sessionId: string | null;
};


export const InterviewResults = ({ sessionId }: InterviewResultsProps) => {
  const [results, setResults] = useState<any>(null); // 本来は結果の型を定義する
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
   
    if (!sessionId) {
      setError("セッションIDが無効です。");
      setIsLoading(false);
      return;
    }

    // 将来的に、sessionId を使ってサーバーから面接結果を取得するAPIを叩く
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        // 例: const response = await fetch(`/api/results?sessionId=${sessionId}`);
        // const data = await response.json();
        // setResults(data);
        
        // --- ここはダミーの非同期処理 ---
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResults({
          message: "面接お疲れ様でした！",
          sessionId: sessionId,
          // ...ここに実際の評価データなどが入る
        });
        // --- ダミー処理ここまで ---

      } catch (err) {
        setError("結果の取得に失敗しました。");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]); // sessionId が変更されたら再実行

  if (isLoading) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold text-teal-300 mb-4">面接結果を生成中...</h3>
        <p>しばらくお待ちください。</p>
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
    <div>
      <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b-2 border-teal-500 pb-2">
        AI面接 結果
      </h2>
      <div className="bg-slate-700 p-6 rounded-lg shadow-lg">
        <p className="text-lg text-gray-200 leading-relaxed">
          {results?.message || "結果の表示に失敗しました。"}
        </p>
        <p className="text-sm text-gray-400 mt-4">ユーザー名</p>
        {/* 将来的にはここに評価の詳細などを表示 */}
      </div>
    </div>
  );
};