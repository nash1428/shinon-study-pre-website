import { NextResponse } from "next/server";
import { suggestGraph } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const suggestions = await suggestGraph(text);
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
