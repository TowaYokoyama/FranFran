
// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { AvatarCanvas } from "@/components/AvatarCanvas";

// ---- 型定義 ----
interface ChatMessage {
  role: "ai" | "user";
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
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}
// -----------------

/** ▼ ログイン後に最初に見せたい「スタート画面」 */
function StartShell({
  onStartInterview,
}: {
  onStartInterview: (settings: { questions: number; minutes: number }) => void;
}) {
  const [questions, setQuestions] = useState(12);
  const [minutes, setMinutes] = useState(10);

  const handleStartClick = () => {
    onStartInterview({ questions, minutes });
  };

  return (
    // 明るいテーマの背景
    <main className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* カードスタイルのメインコンテンツ */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg backdrop-blur-lg">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold
               text-gray-900 tracking-tight">
                もくもく面接
              </span>
              <div className="ml-auto">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>

            <p className="mt-4 text-lg text-gray-600">
              AIとの対話を通じて、あなたの強みを引き出す面接練習を始めましょう。
            </p>

            {/* ログイン後表示 */}
            <SignedIn>
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">面接設定</h2>
                {/* Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">質問数</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={questions}
                      onChange={(e) =>
                        setQuestions(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">制限時間（分）</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={minutes}
                      onChange={(e) =>
                        setMinutes(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </label>
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleStartClick}
                    className="w-full sm:w-auto flex-grow rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition-transform transform hover:scale-105 shadow-md"
                  >
                    面接を開始する
                  </button>
                  <Link
                    href="/history"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    過去の面接結果
                  </Link>
                </div>
              </div>
            </SignedIn>

            {/* ログイン前表示 */}
            <SignedOut>
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <h2 className="text-xl font-semibold text-gray-800">準備はいいですか？</h2>
                <p className="mt-2 text-gray-600">まずはログインまたは新規登録をしてください。</p>
                <div className="mt-6 flex justify-center gap-4">
                  <SignIn
                    appearance={{
                      elements: {
                        formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                        card: "shadow-none border border-gray-200",
                      },
                    }}
                    afterSignInUrl="/"
                    signUpUrl="/sign-up"
                  />
                </div>
              </div>
            </SignedOut>
          </div>
        </div>
        <footer className="text-center mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} もくもく面接. All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}


/** ▼ 面接UI */
function InterviewUI({
  settings,
}: {
  settings: { questions: number; minutes: number };
}) {
  const router = useRouter();
  const [isTalking, setIsTalking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializingRef = useRef(false);
  const isSubmittingRef = useRef(false);

  const finalTextRef = useRef<string>("");
  const interimTextRef = useRef<string>("");

  useEffect(() => {
    if (isFinished && sessionId) {
      router.push(`/history/${sessionId}`);
    }
  }, [isFinished, sessionId, router]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  const handleStartInterview = async () => {
    if (isInitializingRef.current) return;

    try {
      isInitializingRef.current = true;
      setInterviewStarted(true);
      setIsLoading(true);

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "init", settings: settings }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const questionText = decodeURIComponent(
        response.headers.get("X-Question-Text") || ""
      );
      const newSessionId = response.headers.get("X-Session-Id");

      setChatHistory([{ role: "ai", content: questionText }]);
      if (newSessionId) setSessionId(newSessionId);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsTalking(false);
      setIsTalking(true);
      audio.play();
    } catch (error) {
      console.error("Failed to start interview:", error);
      setChatHistory([
        { role: "ai", content: "申し訳ありません、開始に失敗しました。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setCurrentTranscript("");
    finalTextRef.current = "";
    interimTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("お使いのブラウザは音声認識に対応していません。");
      setIsRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let addedFinal = "";
      let newInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t: string = res[0].transcript;
        if (res.isFinal) addedFinal += t;
        else newInterim = t;
      }
      if (addedFinal) finalTextRef.current += addedFinal;
      interimTextRef.current = newInterim;

      const combined = (finalTextRef.current + interimTextRef.current)
        .replace(/\s+/g, " ")
        .trim();
      setCurrentTranscript(combined);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const finalToSend = (finalTextRef.current + interimTextRef.current).trim();
      finalTextRef.current = "";
      interimTextRef.current = "";
      setCurrentTranscript("");

      if (finalToSend) {
        sendToBackend(finalToSend);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e);
    };

    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  const sendToBackend = async (message: string) => {
    if (isSubmittingRef.current) return;
    if (!sessionId) {
      alert("セッションIDがありません。");
      return;
    }

    try {
      isSubmittingRef.current = true;
      const userMessage: ChatMessage = { role: "user", content: message };
      setChatHistory((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "answer",
          sessionId: sessionId,
          answer: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${JSON.stringify(errorData)}`);
      }

      const nextQuestionText = decodeURIComponent(
        response.headers.get("X-Question-Text") || ""
      );
      const finished = response.headers.get("X-Finished") === "true";
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: nextQuestionText },
      ]);
      setIsFinished(finished);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsTalking(false);
      setIsTalking(true);
      audio.play();
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: "申し訳ありません、エラーが発生しました。" },
      ]);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const latestAiQuestion = (() => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].role === "ai") return chatHistory[i].content;
    }
    return undefined;
  })();

  return (
    <main className="flex flex-row h-screen bg-gray-900 text-white font-sans">
      <div className="w-2/3 h-full relative">
        <AvatarCanvas isTalking={isTalking} />
      </div>

      <div className="w-1/3 h-full bg-slate-800 p-8 flex flex-col justify-between border-l-2 border-slate-600">
        {isFinished ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-teal-300 mb-4">面接終了</h3>
            <p>結果ページに移動します...</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b-2 border-teal-500 pb-2">
                AI面接
              </h2>
              <div className="bg-slate-700 p-6 rounded-lg shadow-lg min-h-[120px]">
                <p className="text-lg text-gray-200 leading-relaxed">
                  {!interviewStarted
                    ? "下のボタンを押して面接を開始してください。"
                    : isLoading
                    ? "応答を待っています..."
                    : latestAiQuestion || "..."}
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
                <h3 className="text-xl font-semibold text-gray-300 mb-3">
                  あなたの回答
                </h3>

                {isRecording && (
                  <div className="w-full text-center p-4 bg-slate-600 rounded-lg text-white">
                    <p>録音中です...</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {currentTranscript}
                    </p>
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
          </>
        )}
      </div>
    </main>
  );
}

/** ▼ ページ本体：最初は 'start' を表示。面接スタートで 'interview' に切替 */
export default function Page() {
  const [view, setView] = useState<"start" | "interview">("start");
  const [interviewSettings, setInterviewSettings] = useState({
    questions: 12,
    minutes: 10,
  });

  const handleStart = (settings: { questions: number; minutes: number }) => {
    setInterviewSettings(settings);
    setView("interview");
  };

  return (
    <>
      {view === "start" ? (
        <StartShell onStartInterview={handleStart} />
      ) : (
        <InterviewUI settings={interviewSettings} />
      )}
    </>
  );
}
