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
    return "The user currently has no notes, tasks, or events in their app.";
  }

  return `You have access to the user's current app data below. Use ONLY this data to answer questions about their notes, tasks, and schedule.\n\n${parts.join("\n\n")}`;
}

// ====== Function calling tool definitions ======
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Create a new task in the user's Task Tracker. Only call this when the user explicitly asks to create/add a task AND has provided a clear title. If the user hasn't specified a title, do NOT call this function — ask the user instead.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the task. Must be explicitly stated or clearly derived from the user's request. Never guess or make up a title.",
          },
          dueDate: {
            type: "string",
            description: "Optional due date in ISO format (YYYY-MM-DD). Only include if the user specified a deadline.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createNote",
      description: "Create a new note in the user's Notes section. Only call this when the user explicitly asks to create/make a note AND has provided BOTH a title AND a category. If either the title or category is missing, do NOT call this function — ask the user for the missing information first.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the note. Must be explicitly stated by the user. Never guess or make up a title.",
          },
          category: {
            type: "string",
            description: "The category for the note (e.g., 'Finance', 'Mathematics', 'General'). Must be explicitly stated by the user. Never guess or make up a category.",
          },
          content: {
            type: "string",
            description: "The content/body of the note. Use the content the user provided, or leave empty if none specified.",
          },
        },
        required: ["title", "category"],
      },
    },
  },
];

// ====== Execute function calls ======
function executeCreateTask(args: { title: string; dueDate?: string }) {
  const task = {
    id: Date.now(),
    title: args.title,
    done: false,
    content: "Created via Fox Sensei chat",
    deadline: args.dueDate || undefined,
  };

  // Save to localStorage (shared with Task Tracker)
  try {
    const existing = JSON.parse(localStorage.getItem("studyspace_tasks_all") || "[]");
    localStorage.setItem("studyspace_tasks_all", JSON.stringify([...existing, task]));
  } catch {}

  return { success: true, task };
}

function executeCreateNote(args: { title: string; category: string; content?: string }) {
  const note = {
    id: Date.now(),
    title: args.title,
    category: args.category,
    tag: "Note",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    excerpt: (args.content || "").slice(0, 80) + ((args.content || "").length > 80 ? "..." : "") || "Created via Fox Sensei chat",
    fullContent: args.content || "",
    fullWidth: false,
  };

  // Save to localStorage (shared with Notes page)
  try {
    const existing = JSON.parse(localStorage.getItem("studyspace_notes") || "[]");
    localStorage.setItem("studyspace_notes", JSON.stringify([note, ...existing]));
  } catch {}

  return { success: true, note };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

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
- Do NOT invent note titles, task names, or event details that aren't in the provided data.
- When referencing data, use the EXACT names and details from the context.
- If asked about something not in the data, clearly state it's not found.

FUNCTION CALLING RULES — Creating Notes and Tasks:
- When a user asks to create/add a task: Call the "createTask" function ONLY if they provided a clear title. If no title is given, ask them what the task should be.
- When a user asks to create/make a note: Call the "createNote" function ONLY if they provided BOTH a title AND a category. If either is missing, ask the user for the missing information BEFORE calling the function.
- NEVER guess or auto-fill missing titles or categories. Always ask the user.
- After successfully creating a note or task, confirm it was created and mention the exact title/category used.

FORMATTING RULES:
- Use Markdown for ALL responses. Bold key terms with **text**, italics with *text*.
- NEVER write long, dense paragraphs. Keep paragraphs to 1-2 sentences max.
- Use bullet points (-) for lists, summaries, task lists, and step-by-step instructions.
- When listing the user's notes, tasks, or events, ALWAYS use bullet points — one per item.
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
      model: "openai/gpt-oss-120b",
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

      let toolResult: { success: boolean; task?: unknown; note?: unknown };

      if (functionName === "createTask") {
        toolResult = executeCreateTask(functionArgs);
      } else if (functionName === "createNote") {
        toolResult = executeCreateNote(functionArgs);
      } else {
        return NextResponse.json({ ok: true, reply: "I'm not sure how to do that yet." });
      }

      // Second call — let the AI generate a natural response confirming the action
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

    // No function call — just return the text reply
    const reply = responseMessage?.content || "I'm here for you. What would you like to explore?";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[chat] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
