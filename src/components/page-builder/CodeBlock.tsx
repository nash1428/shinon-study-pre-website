"use client";

import { useState } from "react";
import { Block } from "@/lib/blockSchema";

const LANGUAGES = [
  "typescript", "javascript", "python", "java", "c", "cpp", "csharp",
  "go", "rust", "sql", "html", "css", "json", "yaml", "markdown", "bash", "text",
];

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export default function CodeBlock({ block, onChange }: Props) {
  const [showLang, setShowLang] = useState(false);

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.value } });
  };

  return (
    <div className="relative rounded-md bg-zinc-900 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-1">
        <span className="text-xs text-zinc-400 uppercase">
          {block.data.language || "text"}
        </span>
        <button
          className="text-xs text-zinc-400 hover:text-white"
          onClick={() => setShowLang((s) => !s)}
        >
          Change
        </button>
      </div>
      {showLang && (
        <div className="absolute right-0 top-8 z-10 max-h-40 overflow-auto rounded border border-zinc-700 bg-zinc-800 shadow-lg">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className="block w-full px-3 py-1 text-left text-xs capitalize text-zinc-300 hover:bg-zinc-700"
              onClick={() => {
                onChange({ ...block, data: { ...block.data, language: lang } });
                setShowLang(false);
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
      <textarea
        className="w-full bg-transparent p-3 font-mono text-sm focus:outline-none"
        rows={Math.max(3, (block.data.text || "").split("\n").length)}
        defaultValue={block.data.text || ""}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  );
}
