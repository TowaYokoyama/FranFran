'use client';

import { AvatarCanvas } from "@/components/AvatarCanvas";
import { useEffect, useState, useRef } from "react";

// --- 型定義 ---
interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}
// --- ここまで ---

export default function Home() {
  const [isTalking, setIsTalking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const initialAudioRef = useRef<HTMLAudioElement | null>(null);

  // ★★★ 修正点 1: useEffectが2回実行されるのを防ぐためのフラグ ★★★
  const effectRan = useRef(false);

  // --- 初期化処理 ---
  useEffect(() => {
    // ★★★ 修正点 2: 開発モードでも一度しか実行されないようにする ★★★
    if (effectRan.current === false) {
      const prepareInitialQuestion = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "start" }),
          });

          if (!response.ok) throw new Error('API Error');

          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          initialAudioRef.current = new Audio(audioUrl);
          initialAudioRef.current.onended = () => {
            setIsTalking(false);
          };

          const initialQuestion = "こんにちは！AI面接へようこそ。準備ができたら下のボタンを押して開始してください。";
          setChatHistory([{ role: 'ai', content: initialQuestion }]);

        } catch (error) {
          console.error("Failed to fetch initial question:", error);
          const errorMessage: ChatMessage = { role: 'ai', content: '申し訳ありません、初期化に失敗しました。' };
          setChatHistory([errorMessage]);
        } finally {
          setIsLoading(false);
        }
      };

      prepareInitialQuestion();
    }

    // ★★★ 修正点 3: クリーンアップ関数でフラグを立てる ★★★
    return () => {
      effectRan.current = true;
    };
  }, []); // 空の依存配列は変更なし

  const handleStartInterview = () => {
    if (initialAudioRef.current) {
      setInterviewStarted(true);
      setIsTalking(true);
      initialAudioRef.current.play();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setCurrentTranscript('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声認識に対応していません。");
      setIsRecording(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setCurrentTranscript(prev => {
        if (prev.trim()) {
          sendToBackend(prev.trim());
        }
        return '';
      });
    };
    recognition.start();
  };

  const sendToBackend = async (message: string) => {
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setIsTalking(true);
      audio.play();
      audio.onended = () => {
        setIsTalking(false);
      };

      const aiMessage: ChatMessage = { role: 'ai', content: "(音声で質問しています...)" };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { role: 'ai', content: '申し訳ありません、エラーが発生しました。' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const latestAiQuestion = chatHistory.findLast(msg => msg.role === 'ai')?.content;

  return (
    <main className="flex flex-row h-screen bg-gray-900 text-white font-sans">
      <div className="w-2/3 h-full relative">
        <AvatarCanvas isTalking={isTalking} />
      </div>

      <div className="w-1/3 h-full bg-slate-800 p-8 flex flex-col justify-between border-l-2 border-slate-600">
        <div>
          <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b-2 border-teal-500 pb-2">
            AI面接
          </h2>
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg min-h-[120px]">
            <p className="text-lg text-gray-200 leading-relaxed">
              {isLoading ? "準備しています..." : latestAiQuestion || "..."}
            </p>
          </div>
        </div>

        {!interviewStarted ? (
          <div className="flex flex-col gap-4 my-8">
            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              面接を開始する
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 my-8">
            <h3 className="text-xl font-semibold text-gray-300 mb-3">あなたの回答</h3>
            {isRecording && (
              <div className="w-full text-center p-4 bg-slate-600 rounded-lg text-white">
                マイクで話してください...
                <p className="text-sm text-gray-400 mt-2">{currentTranscript}</p>
              </div>
            )}
            
            <button
              onClick={startRecording}
              disabled={isRecording || isLoading || isTalking}
              className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              🎤 音声で回答する
            </button>
          </div>
        )}
        <div />
      </div>
    </main>
  );
}