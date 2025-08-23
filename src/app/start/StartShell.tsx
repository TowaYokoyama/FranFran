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

              <Link
                href={startHref}
                className="inline-block rounded bg-teal-600 px-4 py-2 font-medium hover:bg-teal-500 transition-colors"
              >
                面接を開始
              </Link>

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
              afterSignInUrl="/start"
              signUpUrl="/sign-up"
            />
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-4">
              <p className="text-neutral-600">
                ログイン済みです。左側で条件を設定して開始してください。
              </p>
              <Link
                href={startHref}
                className="rounded bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 transition-colors"
              >
                面接を開始
              </Link>
            </div>
          </SignedIn>
        </div>
      </section>
    </main>
  );
}
