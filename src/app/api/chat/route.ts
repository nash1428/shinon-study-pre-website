import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

interface AppContext {
  notes?: { title: string; tag: string; excerpt: string; date: string; content?: string }[];
  tasks?: { title: string; content?: string; deadline?: string; done: boolean }[];
  events?: { title: string; date: string; startTime: string; endTime: string; location: string }[];
}

function buildContextString(ctx: AppContext): string {
  const parts: string[] = [];

  if (ctx.notes && ctx.notes.length > 0) {
    const notesStr = ctx.notes.map((n, i) =>
      `${i + 1}. "${n.title}" (${n.tag}, ${n.date}) — ${n.excerpt}${n.content ? `\n   Content: ${n.content.slice(0, 300)}` : ""}`
    ).join("\n");
    parts.push(`=== USER'S NOTES (${ctx.notes.length} total) ===\n${notesStr}`);
  }

  if (ctx.tasks && ctx.tasks.length > 0) {
    const tasksStr = ctx.tasks.map((t, i) =>
      `${i + 1}. "${t.title}"${t.deadline ? ` — due ${t.deadline}` : ""} [${t.done ? "completed" : "pending"}]${t.content ? `\n   Details: ${t.content.slice(0, 200)}` : ""}`
    ).join("\n");
    parts.push(`=== USER'S TASKS (${ctx.tasks.length} total) ===\n${tasksStr}`);
  }

  if (ctx.events && ctx.events.length > 0) {
    const eventsStr = ctx.events.map((e, i) =>
      `${i + 1}. "${e.title}" on ${e.date} from ${e.startTime} to ${e.endTime}${e.location ? ` at ${e.location}` : ""}`
    ).join("\n");
    parts.push(`=== USER'S SCHEDULE (${ctx.events.length} total) ===\n${eventsStr}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `You have access to the user's current app data below. Use this to answer questions about their notes, tasks, and schedule. Reference specific items by name when relevant.\n\n${parts.join("\n\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

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

    const contextString = context ? buildContextString(context as AppContext) : "";

    const systemPrompt = contextString
      ? `You are Fox Sensei, a wise and gentle study companion in a 'Study Garden' app. Your personality is calm, encouraging, and Socratic. You help students with study questions, break down complex concepts, and motivate them with garden/nature metaphors.\n\nIMPORTANT: You have access to the user's app data (notes, tasks, schedule). When the user asks about their data (e.g., "what notes do I have?", "what tasks are due today?", "summarize my notes"), use the provided context to give specific, accurate answers. Reference actual note titles, task names, and event details from the context.\n\nKeep responses concise but thorough when answering data questions. Be warm and supportive.\n\n${contextString}`
      : "You are Fox Sensei, a wise and gentle study companion in a 'Study Garden' app. Your personality is calm, encouraging, and Socratic. You help students with study questions, break down complex concepts, and motivate them with garden/nature metaphors. Keep responses concise (2-4 sentences). Be warm and supportive.";

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((m: ChatMessage) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })) as { role: "system" | "user" | "assistant"; content: string }[],
      ],
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content || "I'm here for you. What would you like to explore?";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[chat] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
