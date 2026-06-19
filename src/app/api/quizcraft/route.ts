import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        questions: [
          {
            q: `What is a core concept of ${topic || "this topic"}?`,
            options: ["The main idea", "An unrelated fact", "A random guess", "A historical date"],
            answer: 0,
          },
          {
            q: "Which technique helps retention best?",
            options: ["Spacing", "Cramming", "Ignoring", "Guessing"],
            answer: 0,
          },
          {
            q: "What does active recall mean?",
            options: ["Testing yourself", "Re-reading notes", "Highlighting text", "Listening to lectures"],
            answer: 0,
          },
        ],
      });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate multiple-choice practice questions for students. Output valid JSON only.",
        },
        {
          role: "user",
          content: `Create 3 multiple-choice questions about "${topic}". Each question must have 4 options and a correct answer index (0-based). Return only a JSON object with a key "questions" containing an array of {q, options (string[]), answer (number)}.`,
        },
      ],
    });
    const raw = completion.choices[0].message.content || "";
    const json = JSON.parse(raw.replace(/```json|```/g, ""));
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
