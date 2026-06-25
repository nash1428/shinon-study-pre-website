import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { pdfText, noteContent, type } = await req.json();

    if (!pdfText && !noteContent) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[generate-study-materials] GEMINI_API_KEY not configured");
      if (type === "anki") {
        return NextResponse.json({
          ok: true,
          ankiCards: [
            { front: "[AI not configured] What is the main topic?", back: "Configure GEMINI_API_KEY to generate real cards." },
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const combinedContent = `Lecture PDF content:\n${pdfText || "(no PDF provided)"}\n\nNote content:\n${noteContent || "(no notes provided)"}`;

    if (type === "anki") {
      const result = await model.generateContent(
        `You are a study assistant that creates Anki flashcards. Based on the provided study material, generate 5-10 high-quality Anki cards. Return ONLY a JSON array of objects with "front" and "back" fields. Example: [{"front":"What is X?","back":"X is..."}]\n\n${combinedContent}`
      );
      const raw = result.response.text();
      let ankiCards;
      try {
        ankiCards = JSON.parse(raw);
      } catch {
        // Try to extract array from the response
        const match = raw.match(/\[[\s\S]*\]/);
        ankiCards = match ? JSON.parse(match[0]) : [];
      }

      return NextResponse.json({ ok: true, ankiCards: Array.isArray(ankiCards) ? ankiCards : [] });
    } else {
      const result = await model.generateContent(
        `You are a study assistant that creates quiz questions. Based on the provided study material, generate 5 multiple-choice questions with 4 options each. Return ONLY a JSON array of objects. Each question has: "question" (string), "options" (array of 4 strings), "answer" (index 0-3 of correct option). Example: [{"question":"What is X?","options":["A","B","C","D"],"answer":0}]\n\n${combinedContent}`
      );
      const raw = result.response.text();
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
