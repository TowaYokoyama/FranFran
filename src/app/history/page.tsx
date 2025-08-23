// src/app/history/page.tsx
import Link from "next/link";

export const metadata = {
  title: "FranFran | 過去結果・AIアドバイス",
};

type HistoryItem = {
  id: string;
  date: string;
  score: number;
  questions?: number;
  minutes?: number;
};

const mockHistory: HistoryItem[] = [
  { id: "h3", date: "2025/08/23", score: 78, questions: 8, minutes: 10 },
  { id: "h2", date: "2025/08/22", score: 82, questions: 10, minutes: 12 },
  { id: "h1", date: "2025/08/20", score: 71, questions: 6, minutes: 8 },
];

export default function HistoryPage() {
  const items = mockHistory;
  const latest = items[0];
  const advice = [
    "回答の最初に要点を1文でまとめると評価が安定します。",
    "結論→理由→具体例の順で整理しましょう。",
    "質問1つあたり 60〜90秒を目安に、冗長さを抑えると◎。",
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center">
        <h1 className="text-2xl font-bold text-yellow-500">
          過去結果 / AIアドバイス
        </h1>
        <div className="ml-auto">
          <Link
            href="/start"
            className="rounded px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white transition-colors"
          >
            ← スタートに戻る
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* 履歴一覧 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">履歴一覧</h2>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2">実施日</th>
                  <th className="px-4 py-2">スコア</th>
                  <th className="px-4 py-2">質問数</th>
                  <th className="px-4 py-2">時間(分)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="px-4 py-2">{h.date}</td>
                    <td className="px-4 py-2 font-medium">{h.score}</td>
                    <td className="px-4 py-2">{h.questions ?? "-"}</td>
                    <td className="px-4 py-2">{h.minutes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AIアドバイス */}
        <section className="border rounded p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">AIからのアドバイス</h2>
            {latest && (
              <span className="text-sm text-slate-500">
                直近スコア: <b>{latest.score}</b>（{latest.date}）
              </span>
            )}
          </div>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            {advice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>

          <div className="mt-5 flex gap-3">
            <Link
              href="/start"
              className="rounded px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white transition-colors"
            >
              ← スタートに戻る
            </Link>
            <Link
              href="/interview"
              className="rounded px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              面接を再開
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
