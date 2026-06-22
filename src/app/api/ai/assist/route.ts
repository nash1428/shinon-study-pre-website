import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        response: `Mock AI response to: "${prompt}"`,
      });
    }

    // TODO: add rate limiting for AI calls
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful study assistant." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({
      response: completion.choices[0].message.content || "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 500 });
  }
}
