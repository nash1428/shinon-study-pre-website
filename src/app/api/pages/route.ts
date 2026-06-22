import { NextResponse } from "next/server";
import { listPages, createPage } from "@/lib/pageStore";

export async function GET() {
  try {
    const pages = await listPages();
    return NextResponse.json({ pages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to list pages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = await createPage(body.content, body.title);
    return NextResponse.json({ id: record.id, page: record });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create page" }, { status: 500 });
  }
}
