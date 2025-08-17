// app/page.tsx

"use client";

import { AvatarCanvas } from "@/components/AvatarCanvas";



import { useState } from "react";
import { interviewData/*, getResult*/ } from "./interview-data";


export default function Home() {
 const [isTalking, setIsTalking] = useState(false);
 const [question, setQuestion] = useState("こんにちは、面接を始めましょう");
  
 const options = [
   "私の長所は、目標達成に向けた粘り強さです。",
    "チームの意見を調整し、まとめる調整力に自信があります。",
    "常に新しい技術を学ぶ探究心があります。",
 ]

 const toggleTalking = () => {
  setIsTalking(!isTalking);
 }

  return (
    <main className="flex flex-row h-screen bg-gray-900 text-white font-sans ">
      {/* 3Dキャンバスのコンテナ */}
         <div className="w-2/3  h-full relative">
       
          <AvatarCanvas isTalking={isTalking} />
        </div>

              {/* --- 右側: 会話UIエリア (全体の1/3) --- */}
      <div className="w-1/3 h-full bg-slate-800 p-8 flex flex-col justify-between border-l-2 border-slate-600">
        
        {/* 上部: 質問表示エリア */}
        <div>
          <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b-2 border-teal-500 pb-2">
            面接官からの質問
          </h2>
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg min-h-[120px]">
            <p className="text-lg text-gray-200 leading-relaxed">
              {question}
            </p>
          </div>
        </div>

        {/* 中央: 選択肢エリア */}
        <div className="flex flex-col gap-4 my-8">
          <h3 className="text-xl font-semibold text-gray-300 mb-3">あなたの回答</h3>
          {options.map((option, index) => (
            <button
              key={index}
              className="w-full text-left p-4 bg-slate-600 rounded-lg text-white text-base hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transform hover:scale-105"
            >
              {option}
            </button>
          ))}
        </div>
        
        {/* 下部: アニメーションテスト用ボタン */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-sm text-gray-500 mb-2 text-center">開発者用テストパネル</p>
          <button
            onClick={toggleTalking} // クリックでisTalkingの状態を切り替え
            className="w-full py-3 bg-indigo-600 rounded-lg text-white font-bold text-lg hover:bg-indigo-500 transition-colors duration-200"
          >
            {isTalking ? "口パクを停止" : "口パクを開始"}
          </button>
        </div>

      </div>
    </main>
  );
}
 