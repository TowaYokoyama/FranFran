'use client';


export const InterviewResults = () => {
  
  // 各ボタンの仮のクリックハンドラ
  const handleSave = () => alert("結果を保存しました（仮）");
  const handleBackToSettings = () => alert("設定画面に戻ります（仮）");
  const handleRetry = () => window.location.reload(); // ページをリロードして再挑戦

  return (
    <div className="w-full bg-slate-700 p-6 rounded-lg shadow-lg text-gray-200 flex flex-col gap-6 animate-fade-in">
      
      {/* 総合点数 */}
      <div className="text-center">
        <p className="text-lg text-teal-300 ">評価</p>
        <p className="text-5xl font-bold text-yellow-500">A</p>
      </div>

      {/* コメント */}
      <div>
        <p className="text-lg text-teal-300 mb-2">コメント</p>
        <p className="p-4 bg-slate-600 rounded">
          開発経験について、具体的なプロジェクト名を挙げて説明できており素晴らしいです。オブジェクト指向の基本的な概念も理解されているようです。
        </p>
      </div>

      {/* Q&Aの要約 */}
      <div>
        <p className="text-lg text-teal-300 mb-2">(仮) Q&Aの要約</p>
        <div className="p-4 bg-slate-600 rounded text-sm space-y-2">
            <p><strong>Q:</strong> 開発経験を教えてください。</p>
            <p><strong>A:</strong> JavaとSpring Bootを... (要約)</p>
            <p><strong>Q:</strong> オブジェクト指向とは？</p>
            <p><strong>A:</strong> カプセル化、継承、ポリモーフィズム... (要約)</p>
        </div>
      </div>

      {/* ボタン */}
      <div className="grid grid-cols-3 gap-4 text-center text-white font-bold">
        <button 
          onClick={handleSave}
          className="p-3 bg-slate-500 rounded hover:bg-slate-400 transition-colors"
        >
          保存して<br/>過去結果へ
        </button>
        <button 
          onClick={handleBackToSettings}
          className="p-3 bg-slate-500 rounded hover:bg-slate-400 transition-colors"
        >
          設定画面に<br/>戻る
        </button>
        <button 
          onClick={handleRetry}
          className="p-3 bg-teal-600 rounded hover:bg-teal-500 transition-colors"
        >
          同条件で<br/>再練習
        </button>
      </div>

    </div>
  );
};
