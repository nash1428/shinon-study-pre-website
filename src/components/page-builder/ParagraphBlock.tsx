"use client";

import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function ParagraphBlock({ block, onChange }: Props) {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className="min-h-[1.5em] text-base leading-relaxed focus:outline-none"
      onBlur={handleBlur}
    >
      {block.data.text || ""}
    </div>
  );
}
