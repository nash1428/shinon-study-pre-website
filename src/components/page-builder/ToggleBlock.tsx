"use client";

import { useState } from "react";
import { Block } from "@/lib/blockSchema";
import BlockRenderer from "./BlockRenderer";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function ToggleBlock({ block, onChange }: Props) {
  const [open, setOpen] = useState(block.data.open ?? true);

  const handleTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, title: e.currentTarget.innerText } });
  };

  const handleChildrenChange = (newChildren: Block[]) => {
    onChange({ ...block, children: newChildren });
  };

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
        onClick={() => setOpen((o: boolean) => !o)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
        <div
          contentEditable
          suppressContentEditableWarning
          className="flex-1 font-medium focus:outline-none"
          onBlur={handleTitleBlur}
          onClick={(e) => e.stopPropagation()}
        >
          {block.data.title || "Toggle"}
        </div>
      </button>
      {open && block.children && block.children.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
          {block.children.map((child, idx) => (
            <BlockRenderer
              key={child.id}
              block={child}
              onChange={(updated) => {
                const next = [...block.children!];
                next[idx] = updated;
                handleChildrenChange(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
