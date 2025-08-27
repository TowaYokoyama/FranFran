import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { history } = await request.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty history data' }, { status: 400 });
    }

    // 環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 履歴データをプロンプトに変換
    const prompt = `以下の面接履歴に基づいて、応募者のパフォーマンスを詳細にレビューしてください。改善点、強み、全体的な評価を含めてください。

面接履歴:
${history.map((item: any) => `質問: ${item.qText}
回答: ${item.aText}`).join('\n\n')}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ review: text });
  } catch (error) {
    console.error('AIレビュー生成エラー:', error);
    return NextResponse.json({ error: 'Failed to generate AI review' }, { status: 500 });
  }
}