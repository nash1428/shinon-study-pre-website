import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const apiKey = process.env.AIAND_API_KEY;
    if (!apiKey) {
      console.warn("[chat] AIAND_API_KEY not configured");
      return NextResponse.json({
        ok: true,
        reply: "I'm not fully configured yet. Please set up the AI API key to enable chat.",
      });
    }

    const client = new OpenAI({
      baseURL: "https://api.aiand.com/v1",
      apiKey,
    });

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are Fox Sensei, a wise and gentle study companion in a 'Study Garden' app. Your personality is calm, encouraging, and Socratic. You help students with study questions, break down complex concepts, and motivate them with garden/nature metaphors. Keep responses concise (2-4 sentences). Be warm and supportive.",
        },
        ...messages.map((m: { role: string; text: string }) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })) as { role: "system" | "user" | "assistant"; content: string }[],
      ],
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "I'm here for you. What would you like to explore?";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[chat] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
