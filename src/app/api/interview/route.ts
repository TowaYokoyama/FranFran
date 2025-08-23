import { NextRequest, NextResponse } from 'next/server';

// 起動したOpenTTSサーバーのURL
const OPENTTS_API_URL = "http://localhost:5500/api/tts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let textToSpeak = "";

    // ここはロジックの拡張待ち
    if (body.message === "start") {
      textToSpeak = "こんにちは！AI面接へようこそ。自己紹介をお願いします。";
    } else {
      textToSpeak = "なるほど、ありがとうございます。次に、あなたの長所について教えてください。";
    }

    // OpenTTSのAPIを呼び出す
    // URLのクエリパラメータでテキストや声の種類を指定します
    const voice = "ja-JP/laps/tacotron2-DDC_ljspeech"; // 利用可能な日本語ボイス
    const url = `${OPENTTS_API_URL}?voice=${voice}&text=${encodeURIComponent(textToSpeak)}`;
    
    const ttsResponse = await fetch(url);

    if (!ttsResponse.ok) {
      throw new Error(`OpenTTS Server Error: ${ttsResponse.statusText}`);
    }

    // OpenTTSから返ってきた音声データ（WAV）を取得
    const audioBlob = await ttsResponse.blob();

    // 音声データをフロントエンドに返す
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
      },
    });

  } catch (error) {
    console.error("API Error in /api/interview:", error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}