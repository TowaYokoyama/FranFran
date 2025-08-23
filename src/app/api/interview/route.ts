import { NextRequest, NextResponse } from 'next/server';

const VOICEVOX_API_URL = "http://localhost:50021";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let textToSpeak = "";

    if (body.message === "start") {
      textToSpeak = "こんにちは！AI面接へようこそ。自己紹介をお願いします。";
    } else {
      textToSpeak = "なるほど、ありがとうございます。次に、あなたの長所について教えてください。";
    }

    // --- VOICEVOX API 連携 ---
    const speakerId = 13; // 話すキャラクターのID 

    // 1. テキストから音声合成用のクエリを作成
    const audioQueryResponse = await fetch(
      `${VOICEVOX_API_URL}/audio_query?text=${encodeURIComponent(textToSpeak)}&speaker=${speakerId}`,
      { method: 'POST' }
    );
    const audioQuery = await audioQueryResponse.json();

    // 2. 作成したクエリを使って音声(WAV)を生成
    const synthesisResponse = await fetch(
      `${VOICEVOX_API_URL}/synthesis?speaker=${speakerId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioQuery),
      }
    );

    if (!synthesisResponse.ok) {
      throw new Error(`VOICEVOX Server Error: ${synthesisResponse.statusText}`);
    }

    const audioBlob = await synthesisResponse.blob();
    
    // 音声データと質問テキストを返す
    const response = new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'X-Question-Text': encodeURIComponent(textToSpeak)
      },
    });
    return response;

  } catch (error) {
    console.error("API Error in /api/interview:", error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
