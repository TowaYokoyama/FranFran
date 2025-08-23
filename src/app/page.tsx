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
  onerror?: (event: any) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializingRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // 追加：確定テキスト・暫定テキストの保持用
  const finalTextRef = useRef<string>('');   // isFinal の分だけ蓄積
  const interimTextRef = useRef<string>(''); // 暫定は毎回置き換え

  // アンマウント時に録音を止める
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  const handleStartInterview = async () => {
    if (isInitializingRef.current) return;

    try {
      isInitializingRef.current = true;
      setInterviewStarted(true);
      setIsLoading(true);

      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: "init" }),
      });
      if (!response.ok) throw new Error('API Error');

      const questionText = decodeURIComponent(response.headers.get('X-Question-Text') || "");
      const newSessionId = response.headers.get('X-Session-Id');

      setChatHistory([{ role: 'ai', content: questionText }]);
      if (newSessionId) setSessionId(newSessionId);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsTalking(false);
      setIsTalking(true);
      audio.play();
    } catch (error) {
      console.error("Failed to start interview:", error);
      setChatHistory([{ role: 'ai', content: '申し訳ありません、開始に失敗しました。' }]);
    } finally {
      setIsLoading(false);
      // 開始は一度きり想定のためフラグ解除は省略
    }
  };

  // --- 録音開始（暫定は上書き・確定だけ蓄積） ---
  const startRecording = () => {
    setIsRecording(true);
    // 表示とバッファを初期化
    setCurrentTranscript('');
    finalTextRef.current = '';
    interimTextRef.current = '';

    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      alert("お使いのブラウザは音声認識に対応していません。");
      setIsRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let addedFinal = '';
      let newInterim = '';

      // 過去分が含まれることがあるので resultIndex から処理
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t: string = res[0].transcript;
        if (res.isFinal) {
          addedFinal += t;     // 確定は蓄積
        } else {
          newInterim = t;      // 暫定は置き換え
        }
      }

      if (addedFinal) finalTextRef.current += addedFinal;
      interimTextRef.current = newInterim;

      // 画面表示は毎回「上書き」
      const combined = (finalTextRef.current + interimTextRef.current)
        .replace(/\s+/g, ' ')
        .trim();
      setCurrentTranscript(combined);
    };

    recognition.onend = () => {
      setIsRecording(false);

      // 最終テキスト（確定＋最後の暫定）を送信
      const finalToSend = (finalTextRef.current + interimTextRef.current).trim();
      // バッファと表示をクリア
      finalTextRef.current = '';
      interimTextRef.current = '';
      setCurrentTranscript('');

      if (finalToSend) {
        sendToBackend(finalToSend);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('SpeechRecognition error:', e);
    };

    recognition.start();
  };

  // --- 録音停止 ---
  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  // --- バックエンドへ送信 ---
  const sendToBackend = async (message: string) => {
    if (isSubmittingRef.current) return;
    if (!sessionId) {
      alert("セッションIDがありません。");
      return;
    }

    try {
      isSubmittingRef.current = true;
      const userMessage: ChatMessage = { role: 'user', content: message };
      setChatHistory(prev => [...prev, userMessage]);
      setIsLoading(true);

      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: "answer",
          sessionId: sessionId,
          answer: message,
          // サーバ側を拡張したら final: true を付けて送る
          // final: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${JSON.stringify(errorData)}`);
      }

      const nextQuestionText = decodeURIComponent(response.headers.get('X-Question-Text') || "");
      const finished = response.headers.get('X-Finished') === 'true';
      setChatHistory(prev => [...prev, { role: 'ai', content: nextQuestionText }]);
      setIsFinished(finished);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsTalking(false);
      setIsTalking(true);
      audio.play();
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'ai', content: '申し訳ありません、エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // 最新のAIメッセージを取得（findLastがない環境でも動くように）
  const latestAiQuestion = (() => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'ai') return chatHistory[i].content;
    }
    return undefined;
  })();

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
              {!interviewStarted ? "下のボタンを押して面接を開始してください。" :
                isLoading ? "応答を待っています..." :
                  isFinished ? "面接は終了です。お疲れ様でした。" :
                    latestAiQuestion || "..."}
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

            {!isFinished && !isRecording ? (
              <button
                onClick={startRecording}
                disabled={isLoading || isTalking}
                className="w-full p-4 bg-teal-600 rounded-lg text-white text-lg font-bold hover:bg-teal-700 disabled:bg-slate-500"
              >
                🎤 音声で回答する
              </button>
            ) : null}

            {!isFinished && isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full p-4 bg-red-600 rounded-lg text-white text-lg font-bold hover:bg-red-700"
              >
                ■ 録音を停止する
              </button>
            ) : null}
          </div>
        )}

        <div />
      </div>
    </main>
  );
}
