"use client";

import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function QuoteBlock({ block, onChange }: Props) {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  return (
    <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-700 dark:text-zinc-300">
      <div
        contentEditable
        suppressContentEditableWarning
        className="focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || "Quote"}
      </div>
    </blockquote>
  );
}
