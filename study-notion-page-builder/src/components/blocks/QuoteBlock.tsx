import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const QuoteBlock: React.FC<Props> = ({ block, onChange }) => {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  return (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
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
};
