import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        outline: `# ${topic || "Sample Topic"}\n\n## Overview\nThis is a mock outline because no OpenAI API key is configured.\n\n## Key Concepts\n- Concept A\n- Concept B\n- Concept C\n\n## Examples\n1. Example one\n2. Example two\n\n## Practice Questions\n- Q1: What is the main idea?`,
      });
    }
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful teaching assistant." },
        {
          role: "user",
          content: `Create a detailed markdown study notebook outline about "${topic}". Include sections for Overview, Key Concepts, Examples, and Practice Questions.`,
        },
      ],
    });
    const outline = completion.choices[0].message.content || "";
    return NextResponse.json({ outline });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
