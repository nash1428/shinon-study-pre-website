"use client";

import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function HeadingBlock({ block, onChange }: Props) {
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  const level = Math.min(block.data.level || 2, 6);
  const sizeClass =
    level === 1 ? "text-3xl" :
    level === 2 ? "text-2xl" :
    level === 3 ? "text-xl" :
    level === 4 ? "text-lg" :
    level === 5 ? "text-base" : "text-sm";

  const Tag = `h${level}`;
  const Element = Tag as any;

  return (
    <Element
      contentEditable
      suppressContentEditableWarning
      className={`${sizeClass} font-semibold focus:outline-none`}
      onBlur={handleBlur as any}
    >
      {block.data.text || "Heading"}
    </Element>
  );
}
