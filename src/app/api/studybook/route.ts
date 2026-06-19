import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { topic, mode, text } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      if (mode === "outline") {
        return NextResponse.json({
          outline: `# ${topic || "Sample Topic"}\n\n## Overview\nMock outline — add OPENAI_API_KEY to enable AI generation.\n\n## Key Concepts\n- Concept A\n- Concept B\n\n## Examples\n1. Example one\n2. Example two\n\n## Practice Questions\n- Q1: What is the main idea?`,
        });
      }
      return NextResponse.json({
        summary:
          "(Mock summary) Add OPENAI_API_KEY to enable AI summarisation.",
      });
    }

    if (mode === "outline") {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful teaching assistant.",
          },
          {
            role: "user",
            content: `Create a detailed markdown study notebook outline about "${topic}". Include sections for Overview, Key Concepts, Examples, and Practice Questions.`,
          },
        ],
      });
      return NextResponse.json({
        outline: completion.choices[0].message.content || "",
      });
    }

    // summarise
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
    return NextResponse.json({
      summary: completion.choices[0].message.content || "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
