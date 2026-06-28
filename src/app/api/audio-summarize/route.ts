import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB max

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    // Check size (base64 is ~33% larger than binary)
    const estimatedSize = (audioBase64.length * 3) / 4;
    if (estimatedSize > MAX_AUDIO_SIZE) {
      return NextResponse.json({
        error: `Audio file too large (${(estimatedSize / 1024 / 1024).toFixed(1)}MB). Maximum is 20MB. Try recording a shorter clip.`,
      }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[audio-summarize] GEMINI_API_KEY not configured");
      return NextResponse.json({
        ok: true,
        summary: "[AI not configured] Audio summarization requires GEMINI_API_KEY. The audio was recorded but could not be transcribed. Please contact the administrator.",
      });
    }

    console.log(`[audio-summarize] Processing audio: ${(estimatedSize / 1024).toFixed(0)}KB, type: ${mimeType || "audio/webm"}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
      return NextResponse.json({ ok: true, summary: "No speech detected in the audio. Try recording in a quieter environment." });
    }

    console.log(`[audio-summarize] Success: ${text.length} chars returned`);
    return NextResponse.json({ ok: true, summary: text });
  } catch (err) {
    console.error("[audio-summarize] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to process audio";
    // Return a user-friendly message
    if (message.includes("quota") || message.includes("RATE_LIMIT")) {
      return NextResponse.json({
        error: "Audio processing rate limit reached. Please wait a minute and try again.",
      }, { status: 429 });
    }
    if (message.includes("permission") || message.includes("403")) {
      return NextResponse.json({
        error: "Audio processing failed due to API permissions. Please contact the administrator.",
      }, { status: 500 });
    }
    return NextResponse.json({ error: `Audio processing failed: ${message}` }, { status: 500 });
  }
}
