import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type QA = {
  qText: string;
  aText: string;
};

/**
 * POST /api/review
 * 面接履歴を受け取り、AIによるレビューコメントを生成して返すエンドポイント
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const history: QA[] = body.history;

    if (!history || history.length === 0) {
      return NextResponse.json({ error: '面接履歴がありません。' }, { status: 400 });
    }

    // 将来的には、ここで外部のAIモデルを呼び出す
    // const reviewText = await callAiModel(history);
    const reviewText = generateMockReview(history);
    
    return NextResponse.json({ review: reviewText });

  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json({ error: 'レビューの生成中にエラーが発生しました。' }, { status: 500 });
  }
}

/**
 * AIモデルへのAPIコールをシミュレートし、モックのレビューを生成する関数。
 * NOTE: この関数は、実際のAI APIに置き換える必要があります。
 */
function generateMockReview(history: QA[]): string {
  const prompt = buildPromptForTechReview(history);

  // --- ここから下はAIモデルの応答の仮の姿です ---
  let mockResponse = `## AIによる面接フィードバック\n\n`;
  mockResponse += `### 総合評価\n\n`;
  mockResponse += `全体を通して、技術的な質問に対して真摯に回答しようとする姿勢が見られました。特に、ご自身の経験に基づいた回答は、具体的なイメージが湧きやすく好印象です。\n\n`;
  mockResponse += `一方で、いくつかの技術的な概念の理解において、やや表層的な部分が見受けられました。よりシニアなエンジニアを目指す上では、単なる知識だけでなく、「なぜその技術が生まれたのか」「どのようなトレードオフがあるのか」といった、より深いレベルでの理解を示すことが重要になります。\n\n`;
  mockResponse += `### 各回答への詳細フィードバック\n\n`;

  history.forEach((qa, index) => {
    mockResponse += `#### Q${index + 1}: ${qa.qText}\n\n`;
    mockResponse += `**あなたの回答の要約:**\n
`;
    mockResponse += `
${qa.aText.substring(0, 100)}...

`;
    mockResponse += `**フィードバック:**\n`;
    if (qa.qText.toLowerCase().includes('オブジェクト指向')) {
      mockResponse += `カプセル化、継承、ポリモーフィズムといった基本的な概念には触れられていますが、それぞれのメリット・デメリットや、実際の設計でどのように活かしたかの具体例が加わると、より説得力が増します。例えば、「以前のプロジェクトで、ポリモーフィズムを活用して支払い処理のコードをどのように整理したか」といった話ができると理想的です。

`;
    } else if (qa.qText.toLowerCase().includes('データベース')) {
      mockResponse += `正規化やインデックスについての基本的な知識はお持ちのようですが、実務で発生しがちなパフォーマンス問題（例: N+1問題）と、その具体的な解決策について言及できると、より実践的なスキルをアピールできます。

`;
    } else {
      mockResponse += `回答は的確ですが、もう一歩踏み込んだ説明があるとさらに良くなります。例えば、ご自身の経験と紐付けて、「その選択をした背景」や「他の選択肢と比較してなぜそれが優れていたのか」を語れると、単なる知識ではなく「使いこなしている技術」としてアピールできます。

`;
    }
  });

  mockResponse += `### 今後の学習に向けたアドバイス\n\n`;
  mockResponse += `1.  **体系的な知識の再確認:** 改めて公式ドキュメントや信頼性の高い技術書を読み込み、利用している技術の「なぜ」を説明できるように準備しましょう。\n`;
  mockResponse += `2.  **設計思想の学習:** クリーンアーキテクチャやドメイン駆動設計など、より抽象度の高い設計思想を学ぶことで、個別の技術知識が繋がり、応用力が向上します。

`;
  mockResponse += `今回の面接は、ご自身の現在地を知る良い機会になったかと思います。このフィードバックを元に学習を進め、さらなる高みを目指してください。応援しています！`;
  // --- AIモデル応答の仮の姿ここまで ---

  return mockResponse;
}


/**
 * エンジニアリング技術面接のレビューを生成するためのプロンプトを構築する関数
 * @param history - 質問と回答の履歴
 * @returns AIモデルに渡すためのプロンプト文字列
 */
function buildPromptForTechReview(history: QA[]): string {
  let prompt = `あなたは、IT企業のシニアソフトウェアエンジニア採用を担当する、経験豊富な技術面接官です。
これから、ある候補者との面接の会話履歴を提示します。この内容に基づき、以下の要件に従って、候補者へのフィードバックを生成してください。

# 要件
- 候補者の技術的な知識の深さと正確性を評価してください。
- 問題解決能力と論理的思考力を評価してください。
- コミュニケーション能力と、複雑な事柄を分かりやすく説明する能力を評価してください。
- 全体的な評価、各回答への具体的なフィードバック、そして今後の改善点を、構造化して記述してください。
- 候補者の良かった点を具体的に褒めつつも、改善すべき点は建設的に指摘してください。
- 出力形式はMarkdownとします。

# 面接の会話履歴
`;

  history.forEach((qa, index) => {
    prompt += `------------------\n`;
    prompt += `質問${index + 1}: ${qa.qText}\n`;
    prompt += `候補者の回答${index + 1}: ${qa.aText}\n`;
  });

  prompt += `------------------\n\n以上が会話履歴です。それでは、フィードバックの生成を開始してください。`;

  return prompt;
}
