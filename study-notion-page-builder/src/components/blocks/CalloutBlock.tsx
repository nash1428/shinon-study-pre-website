import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const CalloutBlock: React.FC<Props> = ({ block, onChange }) => {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({
      ...block,
      data: { ...block.data, text: e.currentTarget.innerText },
    });
  };

  return (
    <div className="flex items-start gap-3 rounded-md bg-blue-50 px-4 py-3 text-blue-900">
      <span className="text-lg select-none">{block.data.icon || "💡"}</span>
      <div
        contentEditable
        suppressContentEditableWarning
        className="flex-1 focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || "Callout text"}
      </div>
    </div>
  );
};
