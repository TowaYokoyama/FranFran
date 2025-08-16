// app/page.tsx
"use client";

import { useState } from "react";
import { interviewData, getResult, InterviewQuestion } from "./interview-data";
import { AvatarCanvas } from "@/componetns/AvatarCanvas";


export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const currentQuestion: InterviewQuestion = interviewData[currentQuestionIndex];
  const finalResult = getResult(score);

  const handleAnswerClick = (selectedScore: number) => {
    setScore(score + selectedScore);

    if (currentQuestionIndex < interviewData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const restartInterview = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
      <div className="w-full max-w-2xl h-[60vh] md:h-[50vh] bg-black rounded-t-lg">
        {/* 3Dアバター表示領域 */}
        <AvatarCanvas />
      </div>
      <div className="w-full max-w-2xl p-6 bg-gray-800 rounded-b-lg shadow-lg">
        {!isFinished ? (
          // 面接中の表示
          <div>
            <p className="text-xl mb-6 text-center h-16">
              {currentQuestion.question}
            </p>
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(option.score)}
                  className="w-full p-4 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // 結果表示
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">面接終了！</h2>
            <div className="bg-gray-700 p-6 rounded-lg">
              <p className="text-lg mb-2">総合評価</p>
              <p className="text-6xl font-extrabold text-blue-400 mb-4">{finalResult.rank}</p>
              <p className="text-lg">{finalResult.feedback}</p>
            </div>
            <button
              onClick={restartInterview}
              className="mt-6 w-full p-4 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors duration-200"
            >
              もう一度挑戦する
            </button>
          </div>
        )}
      </div>
    </main>
  );
}