'use client';

import { AvatarCanvas } from "@/components/AvatarCanvas";
import { useEffect, useState, useRef } from "react";

// --- 型定義 (変更なし) ---
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
  const effectRan = useRef(false);

  // --- 初期化処理 (変更なし) ---
  useEffect(() => {
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
          
          const questionText = decodeURIComponent(response.headers.get('X-Question-Text') || "質問の取得に失敗しました。");
          setChatHistory([{ role: 'ai', content: questionText }]);

          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          initialAudioRef.current = new Audio(audioUrl);
          initialAudioRef.current.onended = () => setIsTalking(false);
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
    return () => { effectRan.current = true; };
  }, []);

  // --- 面接開始処理 (変更なし) ---
  const handleStartInterview = () => {
    if (initialAudioRef.current) {
      setInterviewStarted(true);
      setIsTalking(true);
      initialAudioRef.current.play();
    }
  };

  // --- 音声認識を開始する関数 ---
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
    // ★ 手動停止のため、continuousはtrueに設定
    recognition.continuous = true; 
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = '';
      // 認識結果を連結していく
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(prev => prev + transcript);
    };

    // stop()が呼ばれた時 or 無音で自動停止した時に発火
    recognition.onend = () => {
      setIsRecording(false);
      // 最後のトランスクリプトを送信
      setCurrentTranscript(prev => {
        if (prev.trim()) {
          sendToBackend(prev.trim());
        }
        return '';
      });
    };
    
    recognition.start();
  };

  // ★★★ 手動制御のポイント 1: 録音を停止する関数 ★★★
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // stop()を呼ぶと、上のrecognition.onendイベントが自動で発火します
    }
  };

  // --- バックエンド送信処理 ---
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

      if (!response.ok) throw new Error(`API Error: ${await response.text()}`);

      // ★ 手動制御のポイント 2: バックエンドから次の質問テキストを受け取る
      const nextQuestionText = decodeURIComponent(response.headers.get('X-Question-Text') || "次の質問を準備中です...");
      const aiMessage: ChatMessage = { role: 'ai', content: nextQuestionText };
      setChatHistory(prev => [...prev, aiMessage]);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setIsTalking(true);
      audio.play();
      audio.onended = () => setIsTalking(false);

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
              {isLoading && !interviewStarted ? "準備しています..." : 
               isLoading ? "応答を待っています..." :
               latestAiQuestion || "下のボタンから面接を開始してください。"}
            </p>
          </div>
        </div>

        {!interviewStarted ? (
          <div className="flex flex-col gap-4 my-8">
            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 disabled:bg-slate-500"
            >
              面接を開始する
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 my-8">
            <h3 className="text-xl font-semibold text-gray-300 mb-3">あなたの回答</h3>
            {isRecording && (
              <div className="w-full text-center p-4 bg-slate-600 rounded-lg text-white">
                <p>録音中です...</p>
                <p className="text-sm text-gray-400 mt-2">{currentTranscript}</p>
              </div>
            )}
            
            {/* ★★★ 手動制御のポイント 3: 録音状態に応じてボタンを切り替える ★★★ */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isLoading || isTalking}
                className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 disabled:bg-slate-500"
              >
                🎤 音声で回答する
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full p-4 bg-red-600 rounded-lg text-white text-lg font-bold hover:bg-red-700"
              >
                ■ 録音を停止する
              </button>
            )}
          </div>
        )}
        <div />
      </div>
    </main>
  );
}