// app/page.tsx

// (1) このコンポーネントがブラウザ側で動作することを示すNext.jsのおまじないです。
"use client";

// (2) ReactからuseStateという、コンポーネントの状態を管理する機能をインポートします。
import { useState } from "react";
// (3) 先ほど作成した面接データと結果判定ロジックをインポートします。
import { interviewData, getResult } from "./interview-data";
import { AvatarCanvas } from "@/componetns/AvatarCanvas";
// (4) 3Dアバターと背景を表示するコンポーネントをインポートします。


// (5) Homeという名前のメインコンポーネントを定義します。
export default function Home() {
  // (6) useStateを使って、このコンポーネントが持つ「状態」を定義します。
  // (7) 現在何問目か、を管理する状態です。初期値は0（1問目）です。
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // (8) ユーザーの合計スコアを管理する状態です。初期値は0です。
  const [score, setScore] = useState(0);
  // (9) 面接が終了したかどうかを管理する状態です。初期値はfalse（終了していない）です。
  const [isFinished, setIsFinished] = useState(false);
  
  // (10) interviewDataの中から、現在の質問番号に対応する質問データを取得します。
  const currentQuestion = interviewData[currentQuestionIndex];
  // (11) 現在の合計スコアを元に、最終結果のデータを取得します。
  const finalResult = getResult(score);

  // (12) ユーザーが回答ボタンをクリックしたときに実行される関数です。
  const handleAnswerClick = (selectedScore: number) => {
    // (13) 現在のスコアに、選ばれた選択肢のスコアを加算します。
    setScore(score + selectedScore);

    // (14) もし現在の質問が最後の質問より前なら、
    if (currentQuestionIndex < interviewData.length - 1) {
      // (15) 次の質問に進むため、質問番号を1増やします。
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // (16) もし最後の質問だったら、面接終了フラグをtrueにします。
      setIsFinished(true);
    }
  };

  // (17) 「もう一度挑戦する」ボタンが押されたときに実行される関数です。
  const restartInterview = () => {
    // (18) 全ての状態を初期値に戻します。
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
  };

  // (19) returnの中身が、実際に画面に表示されるHTMLのようなものです（JSXと呼びます）。
  return (
    // (20) ページ全体の親要素です。画面全体に広がり、中央揃えになるようにスタイリングしています。
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      
      {/* (21) アバター表示エリアとUIエリアをまとめるコンテナです。 */}
      <div className="w-full max-w-3xl aspect-[4/3] relative">
        
        {/* (22) 3Dアバターと背景を表示するキャンバスコンポーネントを呼び出します。 */}
        <div className="absolute inset-0">
          <AvatarCanvas />
        </div>

        {/* (23) ゲーム風のUI（セリフや結果）を3Dキャンバスの上に重ねて表示するためのコンテナです。 */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          
          {/* (24) isFinishedがfalse（面接中）の場合に、この中の要素を表示します。 */}
          {!isFinished ? (
            // (25) 面接中のUIです。
            <>
              {/* (26) 面接官のセリフを表示する、ゲーム風の吹き出しボックスです。 */}
              <div className="bg-black bg-opacity-70 border-2 border-blue-400 rounded-lg p-4 mb-4 shadow-lg">
                <p className="text-xl text-white">
                  {currentQuestion.question}
                </p>
              </div>
              {/* (27) ユーザーの回答選択肢ボタンを並べるためのコンテナです。 */}
              <div className="grid grid-cols-1 gap-3">
                {/* (28) currentQuestionのoptions配列を元に、ボタンを繰り返し生成します。 */}
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index} // (29) Reactが各要素を区別するためのユニークなキーです。
                    onClick={() => handleAnswerClick(option.score)} // (30) ボタンがクリックされたらhandleAnswerClick関数を実行します。
                    // (31) ボタンのスタイリングです。
                    className="w-full p-4 bg-blue-600 bg-opacity-80 border border-blue-400 rounded-lg text-white text-lg hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {option.text} {/* (32) ボタンに表示するテキストです。 */}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // (33) isFinishedがtrue（面接終了後）の場合に、この中の要素を表示します。
            <div className="text-center bg-black bg-opacity-80 border-2 border-green-400 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2 text-green-300">面接終了！</h2>
              <p className="text-lg mb-2">総合評価</p>
              <p className="text-6xl font-extrabold text-yellow-300 mb-4">{finalResult.rank}</p>
              <p className="text-lg mb-6">{finalResult.feedback}</p>
              <button
                onClick={restartInterview} // (34) クリックされたらrestartInterview関数を実行します。
                className="w-full p-4 bg-green-600 rounded-lg text-white text-lg hover:bg-green-500 transition-colors duration-200"
              >
                もう一度挑戦する
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
