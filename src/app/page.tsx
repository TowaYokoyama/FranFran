// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { AvatarCanvas } from "@/components/AvatarCanvas";
import { InterviewResults } from "@/components/InterviewResults";

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
  const [questions, setQuestions] = useState(5);
  const [minutes, setMinutes] = useState(10);

  const handleStartClick = () => {
    onStartInterview({ questions, minutes });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <Image src="/logo.svg" alt="もくもく面接" width={28} height={28} />
          <span className="text-xl font-extrabold text-yellow-400 tracking-wide">
            もくもく面接
          </span>
          <div className="ml-auto">
            <SignedIn>
              <UserButton afterSignOutUrl="/start" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main card */}
      <div className="mx-auto flex-1 w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold">スタート</h1>
            <p className="mt-1 text-sm text-slate-300">
              質問数と時間を決めて、「面接を開始」を押してください。
            </p>

            {/* ログイン後表示 */}
            <SignedIn>
              {/* Controls */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-sm">質問数</span>
                  <input
                    placeholder="数"
                    type="number"
                    min={1}
                    max={20}
                    value={questions}
                    onChange={(e) =>
                      setQuestions(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm">制限時間（分）</span>
                  <input
                    placeholder="時間"
                    type="number"
                    min={1}
                    max={60}
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </label>
              </div>

              {/* CTAs（内部遷移：view=interview に切替） */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartClick}
                  className="rounded bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 transition-colors"
                >
                  面接を開始
                </button>

                <div className="flex-1" />
                <Link
                  href="/history"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 hover:bg-slate-700 transition-colors"
                >
                  過去結果ページ
                </Link>
              </div>
            </SignedIn>

            {/* ログイン前表示 */}
            <SignedOut>
              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">ログイン / 新規登録</span>
                  <SignUpButton mode="modal">
                    <button className="rounded-md bg-teal-600 px-3 py-1.5 text-white hover:bg-teal-500 transition-colors">
                      新規登録
                    </button>
                  </SignUpButton>
                </div>
                <SignIn
                  appearance={{
                    elements: {
                      formButtonPrimary: "bg-teal-600 hover:bg-teal-700",
                      card: "shadow-xl rounded-xl",
                    },
                  }}
                  afterSignInUrl="/" // ログイン後はこのページへ戻る
                  signUpUrl="/sign-up"
                  routing="hash"
                />
              </div>
            </SignedOut>

            {/* How-to accordion */}
            <details className="mt-8 group">
              <summary className="cursor-pointer select-none list-none rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3 font-medium hover:bg-slate-800/80">
                使い方（クリックで展開）
              </summary>
              <div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>質問数と制限時間を設定します。</li>
                  <li>「面接を開始」を押すと面接が始まります。</li>
                  <li>
                    終了後は「過去結果ページ」で履歴とフィードバックを確認できます。
                  </li>
                </ol>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 px-6 sm:px-8 py-4 text-xs text-slate-400">
            © {new Date().getFullYear()} もくもく面接
          </div>
        </div>
      </div>
    </main>
  );
}

/** ▼ 面接UI（録音・TTS ロジック入り） */
function InterviewUI({
  settings,
}: {
  settings: { questions: number; minutes: number };
}) {
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

  // 確定テキスト/暫定テキスト
  const finalTextRef = useRef<string>("");
  const interimTextRef = useRef<string>("");

  // アンマウント時に録音停止
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
        body: JSON.stringify({ stage: "init" }),
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

  // 録音開始
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

  // 録音停止
  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  // 回答送信
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

  // 最新のAIメッセージ
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
          <InterviewResults sessionId={sessionId} />
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
                    : isFinished
                    ? "面接は終了です。お疲れ様でした。"
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
    questions: 5,
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
