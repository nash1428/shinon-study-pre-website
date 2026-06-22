"use client";

import { useState } from "react";
import { Plus, Sparkles, Download } from "lucide-react";
import type { Block } from "@/lib/types";

interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  onAddBlock: (block: Block) => void;
  onSummarise: () => void;
  onExport: () => void;
}

const BLOCK_OPTIONS: { type: Block["type"]; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "toggle", label: "Toggle" },
  { type: "callout", label: "Callout" },
  { type: "bulleted_list", label: "Bulleted List" },
  { type: "numbered_list", label: "Numbered List" },
  { type: "quote", label: "Quote" },
  { type: "code", label: "Code" },
  { type: "image", label: "Image" },
  { type: "embed", label: "Embed" },
  { type: "table", label: "Table" },
  { type: "divider", label: "Divider" },
  { type: "ai_assistant", label: "AI Assistant" },
];

const BLOCK_DEFAULTS: Record<Block["type"], Record<string, unknown>> = {
  heading: { text: "", level: 2 },
  paragraph: { text: "" },
  toggle: { title: "" },
  callout: { text: "", icon: "💡" },
  bulleted_list: { text: "" },
  numbered_list: { text: "" },
  quote: { text: "" },
  code: { text: "", language: "typescript" },
  image: { src: "", alt: "" },
  video: { src: "" },
  embed: { url: "" },
  table: { headers: ["", ""], rows: [] },
  divider: {},
  ai_assistant: { prompt: "" },
};

function createBlockByType(type: Block["type"]): Block {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type,
    data: { ...BLOCK_DEFAULTS[type] },
    children: type === "toggle" || type === "callout" ? [] : undefined,
    metadata: { createdAt: now, updatedAt: now },
  };
}

export function EditorToolbar({
  title,
  onTitleChange,
  onAddBlock,
  onSummarise,
  onExport,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" /> Add Block
        </button>
        {open && (
          <div className="absolute right-0 top-9 z-30 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {BLOCK_OPTIONS.map((o) => (
              <button
                key={o.type}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  onAddBlock(createBlockByType(o.type));
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onSummarise}
        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Sparkles className="h-4 w-4" /> AI Summarise
      </button>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Download className="h-4 w-4" /> Export Markdown
      </button>
    </div>
  );
}
