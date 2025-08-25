import { NextRequest, NextResponse } from 'next/server';

// このランタイム指定により、Node.jsのAPIが利用可能になります
export const runtime = 'nodejs';

// 型定義: 質問と回答のペア
type QA = {
  qText: string; // 質問文
  aText: string; // 回答文
};

/**
 * POST /api/review
 * 面接履歴を受け取り、AIによるレビューコメントを生成して返すエンドポイント
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストボディから面接履歴を取得
    const body = await req.json();
    const history: QA[] = body.history;

    // 履歴データがない場合はエラー
    if (!history || history.length === 0) {
      return NextResponse.json({ error: '面接履歴がありません。' }, { status: 400 });
    }

    // ここでAI（大規模言語モデルなど）にレビューを依頼する処理を実装します。
    // 今回は、受け取った履歴を基に簡易的なレビューを生成するロジックで代替します。
    const reviewText = generateSimpleReview(history);
    
    // 生成したレビューを返す
    return NextResponse.json({ review: reviewText });

  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json({ error: 'レビューの生成中にエラーが発生しました。' }, { status: 500 });
  }
}

/**
 * 面接履歴から簡易的なレビューコメントを生成する関数
 * @param history - 質問と回答の履歴
 * @returns 生成されたレビューコメント
 */
function generateSimpleReview(history: QA[]): string {
  let review = "面接お疲れ様でした。全体的な印象と、各回答についてフィードバックします。\n\n";

  // 全体的なフィードバック
  const totalAnswers = history.length;
  if (totalAnswers < 3) {
    review += "全体的に、もう少し具体的なエピソードを交えて話せると、より魅力が伝わるでしょう。";
  } else {
    review += "全体的に、ご自身の経験を基にした回答ができており、素晴らしいです。";
  }
  review += "\n\n---\n\n";

  // 各回答へのフィードバック
  history.forEach((qa, index) => {
    review += `Q${index + 1}: 「${qa.qText}」\n`;
    if (qa.aText.length < 20) {
      review += `A: この回答は少し短いようです。もう少し具体的な状況や、その時の行動、結果などを付け加えると、より説得力が増します。\n\n`;
    } else if (qa.aText.length > 200) {
      review += `A: 非常に詳しく回答いただきありがとうございます。要点を先に述べ、その後に詳細を説明する「PREP法」を意識すると、さらに分かりやすくなります。\n\n`;
    } else {
      review += `A: 具体的で分かりやすい回答です。ご自身の言葉で語れている点が良いですね。\n\n`;
    }
  });

  review += "---\n\n今後のご活躍を期待しています！";

  return review;
}
