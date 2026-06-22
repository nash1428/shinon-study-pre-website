import { NextResponse } from "next/server";
import { getPage, updateBlock } from "@/lib/store";
import { summariseBlock } from "@/lib/ai";
import type { Block } from "@/lib/types";

function findBlock(blocks: Block[], blockId: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    if (block.children) {
      const found = findBlock(block.children, blockId);
      if (found) return found;
    }
  }
  return undefined;
}

function blockText(block: Block): string {
  return Object.values(block.data ?? {})
    .filter((v): v is string => typeof v === "string")
    .join(" ");
}

export async function POST(req: Request) {
  try {
    const { blockId, pageId } = await req.json();
    const page = getPage(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    const block = findBlock(page.blocks, blockId);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    const text = blockText(block);
    const summary = await summariseBlock(text);
    updateBlock(pageId, blockId, {
      metadata: { ...block.metadata, aiSummary: summary },
    });
    return NextResponse.json({ summary });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
