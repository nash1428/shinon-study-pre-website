import { NextResponse } from "next/server";
import { searchBlocks } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const results = searchBlocks(query);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
