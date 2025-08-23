// src/app/services/interviewService.ts

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content:string;
}

async function queryHuggingFace(token: string, prompt: string): Promise<any> {
  // ★ デバッグ用コード2: APIを呼び出す直前のトークンを確認
  console.log('[DEBUG] API呼び出しに使用中のトークン:', token ? `「${token.substring(0, 5)}...」` : 'トークンがありません！');

  const API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";
  
  const response = await fetch(API_URL, {
    // (中略... fetchの中身は変更なし)
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 250, return_full_text: false } }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 503) { throw new Error("Model is loading, please try again in a few moments."); }
    throw new Error(`API request failed: ${response.status} ${errorBody}`);
  }
  return response.json();
}

class InterviewService {
  private token: string;

  constructor(apiToken: string | undefined) {
    // ★ デバッグ用コード1: 環境変数から読み込んだ直後のトークンを確認
    console.log('[DEBUG] 環境変数から読み込んだトークン:', apiToken ? `「${apiToken.substring(0, 5)}...」` : 'undefined (読み込めていません)');

    if (!apiToken) {
      throw new Error("Hugging Face Access Token is required.");
    }
    this.token = apiToken;
  }

  // (中略... generateNextQuestion関数の中身は変更なし)
  public async generateNextQuestion( userMessage: string, history: ChatHistoryItem[] ): Promise<string> {
    const systemPrompt = `あなたは優秀なIT企業の採用面接官です。候補者の回答に対し、ポジティブな相槌を軽く入れた上で、鋭い深掘り質問を1つだけ生成してください。回答は必ず日本語で、質問文のみを返してください。`;
    let conversation = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>";
    history.forEach(h => { conversation += `<|start_header_id|>${h.role}<|end_header_id|>\n\n${h.content}<|eot_id|>`; });
    conversation += `<|start_header_id|>user<|end_header_id|>\n\n${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

    try {
      const response = await queryHuggingFace(this.token, conversation);
      return response[0].generated_text.trim();
    } catch (error) {
      console.error("Error in generateNextQuestion:", error);
      if (error instanceof Error) { return `エラーが発生しました: ${error.message}`; }
      return "不明なエラーが発生しました。";
    }
  }
}

const interviewService = new InterviewService(process.env.HF_ACCESS_TOKEN);
export default interviewService;
export type { ChatHistoryItem };