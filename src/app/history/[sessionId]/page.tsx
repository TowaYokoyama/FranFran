
import Link from 'next/link';

// このページに渡されるパラメータの型定義
type HistoryPageProps = {
  params: {
    sessionId: string;
  };
};

/**
 * 面接結果の概要ページ
 * 質疑応答ページとAIレビューページへのリンクを表示する
 */
export default function HistoryPage({ params }: HistoryPageProps) {
  const { sessionId } = params;

  return (
    <div className="max-w-3xl mx-auto my-10 p-6 bg-slate-900 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-white mb-2">面接結果</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 質疑応答ページへのリンクカード */}
        <Link href={`/history/${sessionId}/qa`}>
          <div className="block p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200 h-full">
            <h2 className="text-xl font-bold text-teal-300">質疑応答の履歴</h2>
            <p className="mt-2 text-slate-300">
              面接でのすべての質問とあなたの回答を確認できます。
            </p>
          </div>
        </Link>

        {/* AIレビューページへのリンクカード */}
        <Link href={`/history/${sessionId}/review`}>
          <div className="block p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200 h-full">
            <h2 className="text-xl font-bold text-yellow-400">AIによるレビュー</h2>
            <p className="mt-2 text-slate-300">
              AIがあなたの回答を分析し、改善のためのフィードバックを提供します。
            </p>
          </div>
        </Link>
      </div>

      <div className="text-center mt-10">
        <Link href="/history">
          <div className="text-slate-400 hover:text-white transition-colors">
            &larr; 履歴一覧に戻る
          </div>
        </Link>
      </div>
    </div>
  );
}
