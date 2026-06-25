import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { pdfText, noteContent, type, count } = await req.json();

    if (!pdfText && !noteContent) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const itemCount = Math.max(1, Math.min(20, count || 5));

    const apiKey = process.env.AIAND_API_KEY;
    if (!apiKey) {
      console.warn("[generate-study-materials] AIAND_API_KEY not configured");
      if (type === "anki") {
        return NextResponse.json({
          ok: true,
          ankiCards: [
            { front: "[AI not configured] What is the main topic?", back: "Configure AIAND_API_KEY to generate real cards." },
          ],
        });
      }
      return NextResponse.json({
        ok: true,
        quizQuestions: [
          { question: "[AI not configured] What is the main topic?", options: ["A", "B", "C", "D"], answer: 0 },
        ],
      });
    }

    const client = new OpenAI({
      baseURL: "https://api.aiand.com/v1",
      apiKey,
    });

    const combinedContent = `Lecture PDF content:\n${pdfText || "(no PDF provided)"}\n\nNote content:\n${noteContent || "(no notes provided)"}`;

    if (type === "anki") {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates Anki flashcards. Based on the provided study material, generate exactly ${itemCount} high-quality Anki cards. Return ONLY a JSON array of objects with "front" and "back" fields. Example: [{"front":"What is X?","back":"X is..."}]`,
          },
          { role: "user", content: combinedContent },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "[]";
      let ankiCards;
      try {
        ankiCards = JSON.parse(raw);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        ankiCards = match ? JSON.parse(match[0]) : [];
      }

      return NextResponse.json({ ok: true, ankiCards: Array.isArray(ankiCards) ? ankiCards : [] });
    } else {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates quiz questions. Based on the provided study material, generate exactly ${itemCount} multiple-choice questions with 4 options each. Return ONLY a JSON array of objects. Each question has: "question" (string), "options" (array of 4 strings), "answer" (index 0-3 of correct option). Example: [{"question":"What is X?","options":["A","B","C","D"],"answer":0}]`,
          },
          { role: "user", content: combinedContent },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "[]";
      let quizQuestions;
      try {
        quizQuestions = JSON.parse(raw);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        quizQuestions = match ? JSON.parse(match[0]) : [];
      }

      return NextResponse.json({ ok: true, quizQuestions: Array.isArray(quizQuestions) ? quizQuestions : [] });
    }
  } catch (err) {
    console.error("[generate-study-materials] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to generate study materials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
