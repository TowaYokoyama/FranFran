// app/interview-data.ts

export interface InterviewQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    score: number;
  }[];
}

export const interviewData: InterviewQuestion[] = [
  {
    id: 1,
    question: "こんにちは！AI面接へようこそ。準備はよろしいですか？",
    options: [
      { text: "はい、準備万端です！", score: 3 },
      { text: "少し緊張していますが、よろしくお願いします。", score: 2 },
      { text: "はい、よろしくお願いします。", score: 1 },
    ],
  },
  {
    id: 2,
    question: "素晴らしい！では、あなたの自己紹介をお願いします。",
    options: [
      { text: "強みである「計画性と実行力」を中心に話す。", score: 3 },
      { text: "学業で力を入れた研究内容について話す。", score: 2 },
      { text: "アルバイトでのコミュニケーション経験を話す。", score: 2 },
    ],
  },
  {
    id: 3,
    question: "なるほど。では次に、当社を志望した理由を教えてください。",
    options: [
      { text: "企業理念への共感と、自身のスキルが貢献できる点を話す。", score: 3 },
      { text: "事業内容の魅力と、将来性を感じた点を話す。", score: 2 },
      { text: "成長できる環境に期待している点を話す。", score: 1 },
    ],
  },
];

export const getResult = (score: number) => {
  if (score >= 8) {
    return {
      rank: "S",
      feedback: "素晴らしいです！自己分析と企業研究が深くできています。自信を持って本番に臨んでください。",
    };
  } else if (score >= 5) {
    return {
      rank: "A",
      feedback: "良いですね。あと一歩、回答を深掘りすると更に良くなります。なぜそう思うのかを考えてみましょう。",
    };
  } else {
    return {
      rank: "B",
      feedback: "お疲れ様でした。まずは、企業の理念や事業内容をもう一度調べて、自分との接点を探すことから始めてみましょう。",
    };
  }
};