import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[audio-summarize] GEMINI_API_KEY not configured");
      return NextResponse.json({
        ok: true,
        summary: "[AI not configured] Audio summarization requires GEMINI_API_KEY. The audio was recorded but could not be transcribed.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Send audio to Gemini with transcription + summarization prompt
    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType || "audio/webm",
        },
      },
      "You are a study assistant. Transcribe this lecture audio, then summarize it into clear, structured study notes with bullet points and key terms. Format: first '## Transcript' with the full transcription, then '## Summary' with the structured notes.",
    ]);

    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ ok: true, summary: "No speech detected in the audio." });
    }

    return NextResponse.json({ ok: true, summary: text });
  } catch (err) {
    console.error("[audio-summarize] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to process audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
