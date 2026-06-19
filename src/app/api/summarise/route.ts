import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        summary:
          "(Mock summary) This text covers important ideas. In a real environment, an AI will generate a concise 3-sentence summary here.",
      });
    }
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise summariser." },
        {
          role: "user",
          content: `Summarise the following study notes in 3 sentences or fewer:\n\n${text}`,
        },
      ],
    });
    const summary = completion.choices[0].message.content || "";
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
