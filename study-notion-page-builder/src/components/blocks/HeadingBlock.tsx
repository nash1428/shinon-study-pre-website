import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const HeadingBlock: React.FC<Props> = ({ block, onChange }) => {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  const level = Math.min(block.data.level || 2, 6);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClass =
    level === 1
      ? "text-3xl"
      : level === 2
      ? "text-2xl"
      : level === 3
      ? "text-xl"
      : level === 4
      ? "text-lg"
      : level === 5
      ? "text-base"
      : "text-sm";

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      className={`${sizeClass} font-semibold focus:outline-none`}
      onBlur={handleBlur as any}
    >
      {block.data.text || "Heading"}
    </Tag>
  );
};
