import React, { useState } from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const EmbedBlock: React.FC<Props> = ({ block, onChange }) => {
  const [edit, setEdit] = useState(false);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange({ ...block, data: { ...block.data, url: e.currentTarget.value } });
    setEdit(false);
  };

  if (edit) {
    return (
      <input
        autoFocus
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        defaultValue={block.data.url || ""}
        onBlur={handleBlur}
        placeholder="Embed URL"
      />
    );
  }

  const url = block.data.url || "";

  return (
    <div className="group relative">
      {url ? (
        <div className="overflow-hidden rounded border border-gray-200">
          <iframe
            src={url}
            className="h-64 w-full"
            title="Embedded content"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
          onClick={() => setEdit(true)}
        >
          Click to add embed
        </div>
      )}
      <button
        className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs shadow opacity-0 group-hover:opacity-100 transition"
        onClick={() => setEdit(true)}
      >
        Edit URL
      </button>
    </div>
  );
};
