'use client';

import { AvatarCanvas } from "@/components/AvatarCanvas";
import { useEffect, useState, useRef } from "react";
import { InterviewResults } from "@/components/InterviewResults";
import Image from "next/image";
import { SignedIn, SignedOut, SignIn, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
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

function StartShell({ onStartInterview }: { onStartInterview: (settings: { questions: number, minutes: number }) => void }) {
  const [questions, setQuestions] = useState(5);
  const [minutes, setMinutes] = useState(10);

  // ★ Linkをbuttonに変更し、クリック時に親コンポーネントの関数を呼ぶ
  const handleStartClick = () => {
    onStartInterview({ questions, minutes });
  };

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* 左：スタート/設定（サインイン後表示） */}
      <section className="bg-slate-900 text-white p-8 flex flex-col">
        <header className="flex items-center gap-3">
          <Image src="/logo.svg" alt="FranFran" width={40} height={40} />
          <h1 className="text-xl font-bold text-yellow-500">FranFran</h1>
          <div className="ml-auto">
            <SignedIn>
              <UserButton afterSignOutUrl="/start" />
            </SignedIn>
          </div>
        </header>

        <div className="mt-8 grow">
          <SignedOut>
            <h2 className="text-2xl font-semibold mb-3">ようこそ</h2>
            <p className="text-slate-300">ログインすると面接を開始できます。</p>
          </SignedOut>

          <SignedIn>
            <h2 className="text-2xl font-semibold mb-4">スタート</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm mb-1">質問数</label>
                <input
                placeholder="数"
                  type="number"
                  min={1}
                  max={20}
                  value={questions}
                  onChange={(e) =>
                    setQuestions(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">制限時間（分）</label>
                <input
                placeholder="時間"
                  type="number"
                  min={1}
                  max={60}
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1"
                />
              </div>

              <button
               onClick={handleStartClick}
                className="inline-block rounded bg-teal-600 px-4 py-2 font-medium hover:bg-teal-500 transition-colors"
              >
                面接を開始
              </button>

              <div className="flex gap-3 pt-2">
                <Link
                  href="/history"
                  className="rounded px-3 py-2 border border-slate-600 bg-slate-500 hover:bg-slate-400 transition-colors"
                >
                  過去結果ページ
                </Link>
                <Link
                  href="/settings"
                  className="rounded px-3 py-2 border border-slate-600 bg-slate-500 hover:bg-slate-400 transition-colors"
                >
                  設定
                </Link>
              </div>
            </div>
          </SignedIn>
        </div>

        <footer className="text-xs text-slate-400">
          © {new Date().getFullYear()} FranFran
        </footer>
      </section>

      {/* 右：Clerk ログイン（未ログイン時のみ） */}
      <section className="p-8 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <SignedOut>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">ログイン / 新規登録</span>
              <SignUpButton mode="modal">
                <button className="rounded px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white transition-colors">
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
              afterSignInUrl="/"
              signUpUrl="/sign-up"
              routing="hash" 
            />
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-4">
              <p className="text-neutral-600">
                ログイン済みです。左側で条件を設定して開始してください。
              </p>
              <button
                onClick={handleStartClick}
                className="rounded bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 transition-colors"
              >
                面接を開始
              </button>
            </div>
          </SignedIn>
        </div>
      </section>
    </main>
  );
}

interface InterviewUIProps {
  settings: {
    questions: number;
    minutes: number;
  };
}

 function InterviewUI({ settings }: InterviewUIProps) {
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
      
       if (!response.ok) {
        // レスポンスの本文をテキストとして取得
        const errorText = await response.text();
        // エラーの詳細をコンソールに出力
        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        // ここでエラーを投げる
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

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
          addedFinal += t;      // 確定は蓄積
        } else {
          newInterim = t;       // 暫定は置き換え
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
      {isFinished ? (
          // ★ 面接結果コンポーネントにsessionIdを渡すと、後で結果取得がしやすくなります
          <InterviewResults sessionId={sessionId} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  const [view, setView] = useState<'start' | 'interview'>('start');
  const [interviewSettings, setInterviewSettings] = useState({ questions: 5, minutes: 10 });

  const handleStart = (settings: { questions: number, minutes: number }) => {
    setInterviewSettings(settings);
    setView('interview');
  };

  // Clerkのコンポーネントでラップする必要があるため、ここで全体を囲みます
  return (
    <>
      {view === 'start' ? (
        <StartShell onStartInterview={handleStart} />
      ) : (
        <InterviewUI settings={interviewSettings} />
      )}
    </>
  );
}