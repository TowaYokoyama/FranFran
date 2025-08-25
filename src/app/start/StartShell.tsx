"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function StartShell() {
  const [questions, setQuestions] = useState(5);
  const [minutes, setMinutes] = useState(10);
  const startHref = `/interview?qs=${questions}&min=${minutes}`;

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

              {/* CTAs */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => (window.location.href = startHref)}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-500 transition-colors"
                >
                  面接スタート
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

            {/* Signed out block */}
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
                  afterSignInUrl="/start"
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
