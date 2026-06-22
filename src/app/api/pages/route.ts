import { NextResponse } from "next/server";
import { getAllPages, createPage } from "@/lib/store";

export async function GET() {
  try {
    const pages = getAllPages();
    return NextResponse.json(pages);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, parentId } = await req.json();
    const page = createPage(title, parentId ?? null);
    return NextResponse.json(page);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
