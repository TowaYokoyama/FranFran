// app/page.tsx

"use client";

import { AvatarCanvas } from "@/components/AvatarCanvas";

import { useEffect, useState } from "react";
import { getResult, interviewData/*, getResult*/ } from "./interview-data";


export default function Home() {
 const [isTalking, setIsTalking] = useState(false);
 const [questionIndex, setQuestionIndex] = useState(0);
 const [isFinished, setIsFinished] = useState(false);
 const [totalScore, setTotalScore] = useState(0);

 const currentQuestion = interviewData[questionIndex];

 const finalResult = getResult(totalScore);
  

 useEffect(()=> {
  if(!isFinished){
    setIsTalking(true);
    const timer = setTimeout(()=> {
    },3000); //3sは話す
    return ()=>  clearTimeout(timer);
   }
 }, [questionIndex, isFinished]);

 const handleAnswerClick  = (score:number) => {
  setTotalScore(prevScore => prevScore + score);

 if(questionIndex < interviewData.length - 1){
  setQuestionIndex(questionIndex + 1);
 } else {
  setIsFinished(true);
  setIsTalking(false);
 }
};

  return (
    <main className="flex flex-row h-screen bg-gray-900 text-white font-sans">
      <div className="w-2/3 h-full relative">
        <AvatarCanvas isTalking={isTalking} />
      </div>

      <div className="w-1/3 h-full bg-slate-800 p-8 flex flex-col justify-between border-l-2 border-slate-600">
        {!isFinished ? (
          <>
            {/* 上部: 質問表示エリア */}
            <div>
              <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b-2 border-teal-500 pb-2">
                面接官からの質問 ({questionIndex + 1} / {interviewData.length})
              </h2>
              <div className="bg-slate-700 p-6 rounded-lg shadow-lg min-h-[120px]">
                <p className="text-lg text-gray-200 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* 中央: 選択肢エリア */}
            <div className="flex flex-col gap-4 my-8">
              <h3 className="text-xl font-semibold text-gray-300 mb-3">あなたの回答</h3>
              {currentQuestion.options.map((option:any) => (
                <button
                  key={option.text}
                  // ★★★ クリック時にスコアを渡すように変更 ★★★
                  onClick={() => handleAnswerClick(option.score)}
                  className="w-full text-left p-4 bg-slate-600 rounded-lg text-white text-base hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transform hover:scale-105"
                >
                  {option.text}
                </button>
              ))}
            </div>
            <div /> {/* スペース確保用 */}
          </>
        ) : (
          // --- 面接終了時の表示 ---
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-3xl font-bold text-teal-300 mb-6">面接終了</h2>
            <div className="bg-slate-700 p-8 rounded-lg shadow-lg w-full">
              <p className="text-lg text-gray-400 mb-2">あなたの評価は...</p>
              <p className="text-8xl font-black text-yellow-400 mb-4">{finalResult.rank}</p>
              <p className="text-md text-gray-200 leading-relaxed">{finalResult.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
