import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[audio-summarize] OPENAI_API_KEY not configured");
      return NextResponse.json({
        ok: true,
        summary: "[AI not configured] Audio summarization requires OPENAI_API_KEY. The audio was recorded but could not be transcribed.",
      });
    }

    const openai = new OpenAI({ apiKey });

    // Convert base64 to File for Whisper API
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioFile = new File([audioBuffer], "audio.webm", { type: mimeType || "audio/webm" });

    // 1. Transcribe audio with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const transcript = transcription.text;
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ ok: true, summary: "No speech detected in the audio." });
    }

    // 2. Summarize the transcription with GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a study assistant. Summarize the following lecture audio transcription into clear, structured study notes. Use bullet points and key terms. Keep it concise but comprehensive.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      max_tokens: 800,
    });

    const summary = completion.choices[0]?.message?.content || transcript;

    return NextResponse.json({ ok: true, summary, transcript });
  } catch (err) {
    console.error("[audio-summarize] Failed:", err);
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 });
  }
}
