'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 型定義: 質問と回答のペア
type QA = {
  qText: string; // 質問文
  aText: string; // 回答文
};

// 型定義: 面接結果のデータ構造
type InterviewResultData = {
  message: string;
  sessionId: string;
  history: QA[]; // 質問と回答の履歴
};

// このコンポーネントに渡されるプロパティの型定義
type InterviewResultsProps = {
  sessionId: string | null; // 親コンポーネントから渡されるセッションID
};

/**
 * 面接結果を表示し、AIによるレビューをリクエストする機能を持つコンポーネント
 */
export const InterviewResults = ({ sessionId }: InterviewResultsProps) => {
  // --- State管理 ---
  // 面接結果データ
  const [results, setResults] = useState<InterviewResultData | null>(null);
  // AIレビューのテキスト
  const [review, setReview] = useState<string | null>(null);
  // 結果取得中のローディング状態
  const [isLoading, setIsLoading] = useState(true);
  // レビュー生成中のローディング状態
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // --- データ取得処理 ---
  useEffect(() => {
    // セッションIDがない場合は処理を中断
    if (!sessionId) {
      setError("セッションIDが無効です。");
      setIsLoading(false);
      return;
    }

    // サーバーから面接結果を取得する非同期関数
    const fetchResults = async () => {
      try {
        setIsLoading(true);

        // TODO: 将来的には、ここでsessionIdを使って実際のAPIを呼び出す
        // const response = await fetch(`/api/results?sessionId=${sessionId}`);
        // const data = await response.json();
        // setResults(data);

        // --- 以下はダミーデータの非同期処理です ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        setResults({
          message: "面接お疲れ様でした！",
          sessionId: sessionId,
          history: [
            { qText: "自己紹介をお願いします。", aText: "はい、〇〇大学の〇〇です。趣味は読書で、特に技術書を読むのが好きです。" },
            { qText: "開発経験を教えて頂ければと思います。", aText: "はい、学生時代にReactとTypeScriptを使って、TODOアプリを開発しました。状態管理にはReduxを…" },
            { qText: "あなたの強みを教えてください。", aText: "私の強みは、粘り強く問題解決に取り組める点です。" },
          ],
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
  }, [sessionId]); // sessionIdが変更されたら、このeffectを再実行する

  // --- イベントハンドラ ---
  /**
   * 「AIにフィードバックを依頼する」ボタンがクリックされたときの処理
   */
  const handleRequestReview = async () => {
    if (!results?.history) {
      alert("レビュー対象の面接履歴がありません。");
      return;
    }

    setIsReviewLoading(true);
    setReview(null); // 既存のレビューをクリア

    try {
      // 作成したAIレビューAPIを呼び出す
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: results.history }),
      });

      if (!response.ok) {
        throw new Error('APIからの応答が不正です。');
      }

      const data = await response.json();
      setReview(data.review);

    } catch (err) {
      console.error(err);
      alert("レビューの取得に失敗しました。");
    } finally {
      setIsReviewLoading(false);
    }
  };

  // --- レンダリング ---

  // 結果取得中のローディング表示
  if (isLoading) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold text-teal-300 mb-4">面接結果を生成中...</h3>
        <p>しばらくお待ちください。</p>
      </div>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <div className="text-center bg-red-900/80 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-2">エラー</h3>
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  // メインコンテンツの表示
  return (
    <div>
      {/* --- ヘッダーセクション --- */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-teal-300 border-b-2 border-teal-500 pb-2">
          AI面接 結果
        </h2>
        <Link href="/history"
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors"
        >
          履歴一覧に戻る
        </Link>
      </div>

      {/* --- 質疑応答の履歴セクション --- */}
      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">質疑応答</h3>
        <div className="space-y-4">
          {results?.history?.map((qa, index) => (
            <div key={index} className="border-b border-slate-700 pb-2">
              <p className="font-semibold text-slate-300">Q: {qa.qText}</p>
              <p className="text-slate-200 mt-1">A: {qa.aText}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- AIレビューセクション --- */}
      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">AIによるフィードバック</h3>
        {!review && !isReviewLoading && (
          <button
            onClick={handleRequestReview}
            className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-500 transition-all duration-200 shadow-lg"
          >
            AIにフィードバックを依頼する
          </button>
        )}
        {isReviewLoading && (
          <div className="text-center text-slate-300">
            <p>AIがレビューを生成中です...</p>
            <p>（10秒ほどかかる場合があります）</p>
          </div>
        )}
        {review && (
          <div className="whitespace-pre-wrap bg-slate-900/70 p-4 rounded-md text-slate-200 leading-relaxed">
            {review}
          </div>
        )}
      </div>
    </div>
  );
};
