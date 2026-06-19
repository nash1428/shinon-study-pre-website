import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        nodes: [
          { id: "1", label: topic || "Main Idea", x: 300, y: 200 },
          { id: "2", label: "Sub-idea A", x: 150, y: 100 },
          { id: "3", label: "Sub-idea B", x: 450, y: 100 },
          { id: "4", label: "Example 1", x: 100, y: 300 },
          { id: "5", label: "Example 2", x: 500, y: 300 },
        ],
        edges: [
          { from: "1", to: "2" },
          { from: "1", to: "3" },
          { from: "2", to: "4" },
          { from: "3", to: "5" },
        ],
      });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful concept-map assistant.",
        },
        {
          role: "user",
          content: `For the topic "${topic}", create a JSON concept map. Return only a JSON object with keys "nodes" (array of {id, label, x, y}) and "edges" (array of {from, to}). Provide 5-7 nodes with rough x,y coordinates between 50 and 550.`,
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
