import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { pdfText, noteContent, type } = await req.json();

    if (!pdfText && !noteContent) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[generate-study-materials] OPENAI_API_KEY not configured");
      // Return placeholder data so the UI still works
      if (type === "anki") {
        return NextResponse.json({
          ok: true,
          ankiCards: [
            { front: "[AI not configured] What is the main topic?", back: "Configure OPENAI_API_KEY to generate real cards." },
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

    const openai = new OpenAI({ apiKey });

    const combinedContent = `Lecture PDF content:\n${pdfText || "(no PDF provided)"}\n\nNote content:\n${noteContent || "(no notes provided)"}`;

    if (type === "anki") {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates Anki flashcards. Based on the provided study material, generate 5-10 high-quality Anki cards. Return ONLY a JSON array of objects with "front" and "back" fields. Example: [{"front":"What is X?","back":"X is..."}]`,
          },
          { role: "user", content: combinedContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      const ankiCards = parsed.cards || parsed.ankiCards || parsed.items || parsed;

      return NextResponse.json({ ok: true, ankiCards: Array.isArray(ankiCards) ? ankiCards : [] });
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates quiz questions. Based on the provided study material, generate 5 multiple-choice questions with 4 options each. Return ONLY a JSON object with a "questions" array. Each question has: "question" (string), "options" (array of 4 strings), "answer" (index 0-3 of correct option). Example: {"questions":[{"question":"What is X?","options":["A","B","C","D"],"answer":0}]}`,
          },
          { role: "user", content: combinedContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      const quizQuestions = parsed.questions || [];

      return NextResponse.json({ ok: true, quizQuestions: Array.isArray(quizQuestions) ? quizQuestions : [] });
    }
  } catch (err) {
    console.error("[generate-study-materials] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to generate study materials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
