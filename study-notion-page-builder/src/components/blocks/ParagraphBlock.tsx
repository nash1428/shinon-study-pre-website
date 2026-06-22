import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const ParagraphBlock: React.FC<Props> = ({ block, onChange }) => {
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
};
