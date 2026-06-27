import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, FIRESTORE_BASE } from "../register-user/route";

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
    return "The user currently has no notes, tasks, or events in their app.";
  }

  return `You have access to the user's current app data below. Use ONLY this data to answer questions about their notes, tasks, and schedule.\n\n${parts.join("\n\n")}`;
}

// ====== Function calling tool definitions ======
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note in the user's Notes section. ONLY call this function when the user has provided BOTH a title AND a category. If the title or category is missing, DO NOT call this function — ask the user for the missing information first.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the note. Must be explicitly provided by the user.",
          },
          category: {
            type: "string",
            description: "The category for the note (e.g., 'Work', 'Finance', 'Biology'). Must be explicitly provided by the user.",
          },
          content: {
            type: "string",
            description: "Optional content/body for the note.",
          },
        },
        required: ["title", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in the user's Task Tracker. ONLY call this function when the user has provided BOTH a title AND a due date. If the title or due date is missing, DO NOT call this function — ask the user for the missing information first.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the task. Must be explicitly provided by the user.",
          },
          dueDate: {
            type: "string",
            description: "The due date for the task in YYYY-MM-DD format. Must be explicitly provided by the user.",
          },
        },
        required: ["title", "dueDate"],
      },
    },
  },
];

// ====== Save to Firestore (server-side, Admin SDK) ======
async function saveTaskToFirestore(userId: string, task: { id: number; title: string; done: boolean; content: string; deadline?: string }): Promise<boolean> {
  if (adminDb) {
    try {
      await adminDb.collection("tasks").doc(String(task.id)).set({
        ...task,
        userId,
        source: "chatbot",
        createdAt: new Date().toISOString(),
      });
      console.log(`[chat] Task saved to Firestore: ${task.id}`);
      return true;
    } catch (err) {
      console.error("[chat] Failed to save task to Firestore:", err);
    }
  }
  return false;
}

async function saveNoteToFirestore(userId: string, note: { id: number; title: string; category: string; tag: string; date: string; excerpt: string; fullContent: string; fullWidth: boolean }): Promise<boolean> {
  if (adminDb) {
    try {
      await adminDb.collection("notes").doc(String(note.id)).set({
        ...note,
        userId,
        source: "chatbot",
        createdAt: new Date().toISOString(),
      });
      console.log(`[chat] Note saved to Firestore: ${note.id}`);
      return true;
    } catch (err) {
      console.error("[chat] Failed to save note to Firestore:", err);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const apiKey = process.env.AIAND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        reply: "I'm not fully configured yet. Please set up the AI API key to enable chat.",
      });
    }

    const client = new OpenAI({
      baseURL: "https://api.aiand.com/v1",
      apiKey,
    });

    const contextString = context ? buildContextString(context as AppContext) : "The user currently has no notes, tasks, or events in their app.";

    const systemPrompt = `You are Fox Sensei, a wise and gentle study companion in a 'Study Garden' app. Your personality is calm, encouraging, and Socratic.

CRITICAL RULES — ANTI-HALLUCINATION:
- You have access to the user's app data below. Use ONLY this data to answer questions about their notes, tasks, and schedule.
- NEVER make up, guess, or fabricate information. If the data doesn't contain an answer, say "I don't see that in your current notes/tasks" and suggest they add it.
- When referencing data, use the EXACT names and details from the context.

CONVERSATIONAL DATA GATHERING — Creating Notes and Tasks:
When a user wants to create a note or task, you MUST gather ALL required fields BEFORE calling any function. Do NOT call the function until the user has provided every required parameter.

For NOTES — you need BOTH:
1. Title — ask "What is the title of the note?" if not provided
2. Category — ask "What category should this note be under?" if not provided

For TASKS — you need BOTH:
1. Title — ask "What is the task title?" if not provided
2. Due Date — ask "What is the due date? (e.g., 2026-07-15)" if not provided

FLOW EXAMPLE:
User: "Create a note for me."
You: "Sure! What is the title of the note?"
User: "Meeting agenda."
You: "Got it. What category should this note be under?"
User: "Work."
You: *calls create_note with title="Meeting agenda", category="Work"*
You: "Note 'Meeting agenda' has been created in the 'Work' category!"

IMPORTANT: Do NOT call the function until the user has provided ALL required parameters. NEVER guess or auto-fill missing values.

FORMATTING RULES:
- Use Markdown for ALL responses. Bold key terms with **text**, italics with *text*.
- NEVER write long, dense paragraphs. Keep paragraphs to 1-2 sentences max.
- Use bullet points (-) for lists, summaries, task lists, and step-by-step instructions.
- Keep responses concise and scannable.

${contextString}`;

    const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({
        role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
        content: m.text,
      })),
    ];

    // First call — check if the AI wants to call a function
    const completion = await client.chat.completions.create({
      model: "zai-org/glm-5.2",
      messages: apiMessages,
      tools,
      tool_choice: "auto",
      max_tokens: 800,
    });

    const responseMessage = completion.choices[0]?.message;

    // Check if the AI wants to call a function
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolCallTyped = toolCall as { id: string; type: "function"; function: { name: string; arguments: string } };
      const functionName = toolCallTyped.function.name;
      const functionArgs = JSON.parse(toolCallTyped.function.arguments || "{}");

      console.log(`[chat] Tool call: ${functionName} with args:`, functionArgs);

      let toolResult: { success: boolean; task?: unknown; note?: unknown; error?: string };

      if (functionName === "create_task") {
        const task = {
          id: Date.now(),
          title: functionArgs.title,
          done: false,
          content: "Created via Fox Sensei chat",
          deadline: functionArgs.dueDate || undefined,
        };

        // Save to Firestore
        const saved = userId ? await saveTaskToFirestore(userId, task) : false;
        toolResult = { success: saved, task };
        console.log(`[chat] create_task result: saved=${saved}, task=${task.title}`);
      } else if (functionName === "create_note") {
        const note = {
          id: Date.now(),
          title: functionArgs.title,
          category: functionArgs.category,
          tag: "Note",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          excerpt: (functionArgs.content || "").slice(0, 80) || "Created via Fox Sensei chat",
          fullContent: functionArgs.content || "",
          fullWidth: false,
        };

        // Save to Firestore
        const saved = userId ? await saveNoteToFirestore(userId, note) : false;
        toolResult = { success: saved, note };
        console.log(`[chat] create_note result: saved=${saved}, note=${note.title}`);
      } else {
        return NextResponse.json({ ok: true, reply: "I'm not sure how to do that yet." });
      }

      // Second call — let the AI generate a natural confirmation response
      const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
        ...apiMessages,
        responseMessage,
        {
          role: "tool" as const,
          tool_call_id: toolCallTyped.id,
          content: JSON.stringify(toolResult),
        },
      ];

      const followUpCompletion = await client.chat.completions.create({
        model: "zai-org/glm-5.2",
        messages: followUpMessages,
        max_tokens: 400,
      });

      const reply = followUpCompletion.choices[0]?.message?.content || "Done!";

      return NextResponse.json({
        ok: true,
        reply,
        action: functionName,
        actionResult: toolResult,
      });
    }

    // No function call — just return the text reply (e.g., asking for missing info)
    const reply = responseMessage?.content || "I'm here for you. What would you like to explore?";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[chat] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
