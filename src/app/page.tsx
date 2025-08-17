// app/page.tsx

"use client";

import { AvatarCanvas } from "@/componetns/AvatarCanvas";
// import { useState } from "react"; // レイアウト調整中は一旦コメントアウト
import { interviewData/*, getResult*/ } from "./interview-data";


export default function Home() {
  // レイアウト調整のため、質問の状態管理を一時的に無効化します
  // const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // const [score, setScore] = useState(0);
  // const [isFinished, setIsFinished] = useState(false);
  
  // 常に最初の質問データを表示するように固定します
  const currentQuestion = interviewData[0];
  const isFinished = false; // 常に面接中の表示にする

  // const handleAnswerClick = (selectedScore: number) => {
  //   setScore(score + selectedScore);
  //   if (currentQuestionIndex < interviewData.length - 1) {
  //     setCurrentQuestionIndex(currentQuestionIndex + 1);
  //   } else {
  //     setIsFinished(true);
  //   }
  // };

  // const restartInterview = () => {
  //   setCurrentQuestionIndex(0);
  //   setScore(0);
  //   setIsFinished(false);
  // };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="w-full max-w-3xl aspect-[4/3] relative bg-black">
        <div className="absolute inset-0">
          <AvatarCanvas />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
          {!isFinished ? (
            <>
              <div className="bg-black bg-opacity-70 border-2 border-blue-400 rounded-lg p-4 mb-4 shadow-lg">
                <p className="text-xl text-white">
                  {currentQuestion.question}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 pointer-events-auto">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    // onClick={() => handleAnswerClick(option.score)} // 一時的に無効化
                    className="w-full p-4 bg-blue-600 bg-opacity-80 border border-blue-400 rounded-lg text-white text-lg hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // 結果表示部分はレイアウト調整中は表示されません
            <></>
          )}
        </div>
      </div>
    </main>
  );
}
