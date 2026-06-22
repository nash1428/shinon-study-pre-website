import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const ListBlock: React.FC<Props> = ({ block, onChange }) => {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };

  const isBullet = block.type === "bulleted_list";
  const bullet = isBullet ? "•" : `${block.data.index ?? 1}.`;

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 select-none text-gray-500">{bullet}</span>
      <div
        contentEditable
        suppressContentEditableWarning
        className="flex-1 focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || ""}
      </div>
    </div>
  );
};
