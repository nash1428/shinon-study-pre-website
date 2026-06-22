import { NextResponse } from "next/server";
import { updateBlock } from "@/lib/store";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pageId, updates } = await req.json();
    const updated = updateBlock(pageId, id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
