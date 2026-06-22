"use client";

import { useState } from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function MediaBlock({ block, onChange }: Props) {
  const isImage = block.type === "image";
  const [edit, setEdit] = useState(false);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange({ ...block, data: { ...block.data, src: e.currentTarget.value } });
    setEdit(false);
  };

  if (edit) {
    return (
      <input
        autoFocus
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        defaultValue={block.data.src || ""}
        onBlur={handleBlur}
        placeholder={isImage ? "Image URL" : "Video URL"}
      />
    );
  }

  return (
    <div className="group relative">
      {isImage ? (
        block.data.src ? (
          <img
            src={block.data.src}
            alt={block.data.alt || ""}
            className="max-h-96 w-full rounded object-contain"
          />
        ) : (
          <div
            className="flex h-32 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400"
            onClick={() => setEdit(true)}
          >
            Click to add image
          </div>
        )
      ) : block.data.src ? (
        <video src={block.data.src} controls className="w-full rounded" />
      ) : (
        <div
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400"
          onClick={() => setEdit(true)}
        >
          Click to add video
        </div>
      )}
      <button
        className="absolute right-2 top-2 rounded bg-white dark:bg-zinc-900 px-2 py-1 text-xs shadow opacity-0 group-hover:opacity-100 transition"
        onClick={() => setEdit(true)}
      >
        Edit URL
      </button>
    </div>
  );
}
