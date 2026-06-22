"use client";

import { useState, type FocusEvent } from "react";
import type { Block } from "@/lib/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BlockRenderer } from "../BlockRenderer";

interface BlockComponentProps {
  block: Block;
  onChange: (block: Block) => void;
}

const LANGUAGES = [
  "typescript", "javascript", "python", "java", "c", "cpp", "go",
  "rust", "sql", "html", "css", "json", "yaml", "markdown", "bash", "text",
];

export function HeadingBlock({ block, onChange }: BlockComponentProps) {
  const handleBlur = (e: FocusEvent<HTMLHeadingElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };
  const level = Math.min(Math.max(Number(block.data.level) || 2, 1), 3);
  const sizeClass = level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : "text-xl";
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Heading"
      className={`${sizeClass} font-bold text-gray-900 focus:outline-none`}
      onBlur={handleBlur}
    >
      {block.data.text || undefined}
    </Tag>
  );
}

export function ParagraphBlock({ block, onChange }: BlockComponentProps) {
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Type something…"
      className="min-h-[1.5em] text-base leading-relaxed text-gray-900 focus:outline-none"
      onBlur={handleBlur}
    >
      {block.data.text || undefined}
    </div>
  );
}

export function ToggleBlock({ block, onChange }: BlockComponentProps) {
  const [open, setOpen] = useState<boolean>(block.data.open ?? true);

  const handleTitleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, title: e.currentTarget.innerText } });
  };

  const handleChildrenChange = (next: Block[]) => onChange({ ...block, children: next });

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-700" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-700" />
        )}
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Toggle"
          className="flex-1 font-medium text-gray-900 focus:outline-none"
          onBlur={handleTitleBlur}
          onClick={(e) => e.stopPropagation()}
        >
          {block.data.title || undefined}
        </div>
      </div>
      {open && block.children && block.children.length > 0 && (
        <div className="space-y-1 border-t border-gray-100 px-3 py-2">
          {block.children.map((child, idx) => (
            <BlockRenderer
              key={child.id}
              block={child}
              onChange={(updated) => {
                const next = [...block.children!];
                next[idx] = updated;
                handleChildrenChange(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CalloutBlock({ block, onChange }: BlockComponentProps) {
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };
  return (
    <div className="flex items-start gap-3 rounded-md bg-gray-100 px-4 py-3 text-gray-900">
      <span className="select-none text-lg">{block.data.icon || "💡"}</span>
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Callout text"
        className="flex-1 focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || undefined}
      </div>
    </div>
  );
}

export function ListBlock({ block, onChange }: BlockComponentProps) {
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };
  const isBullet = block.type === "bulleted_list";
  const index = typeof block.data.index === "number" ? block.data.index : 1;
  const marker = isBullet ? "•" : `${index}.`;
  return (
    <div className="flex items-start gap-2 text-gray-900">
      <span className="mt-0.5 select-none text-gray-700">{marker}</span>
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="List item"
        className="flex-1 focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || undefined}
      </div>
    </div>
  );
}

export function QuoteBlock({ block, onChange }: BlockComponentProps) {
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.innerText } });
  };
  return (
    <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-700">
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Quote"
        className="focus:outline-none"
        onBlur={handleBlur}
      >
        {block.data.text || undefined}
      </div>
    </blockquote>
  );
}

export function CodeBlock({ block, onChange }: BlockComponentProps) {
  const [showLang, setShowLang] = useState(false);

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    onChange({ ...block, data: { ...block.data, text: e.currentTarget.value } });
  };

  return (
    <div className="relative rounded-md bg-gray-900 text-gray-100">
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-1">
        <span className="text-xs uppercase text-gray-400">
          {block.data.language || "text"}
        </span>
        <button
          type="button"
          className="text-xs text-gray-400 hover:text-gray-100"
          onClick={() => setShowLang((s) => !s)}
        >
          Change
        </button>
      </div>
      {showLang && (
        <div className="absolute right-0 top-8 z-10 max-h-40 overflow-auto rounded-md border border-gray-700 bg-gray-800 shadow-lg">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              className="block w-full px-3 py-1 text-left text-xs capitalize text-gray-300 hover:bg-gray-700"
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
        className="w-full bg-transparent p-3 font-mono text-sm text-gray-100 focus:outline-none"
        rows={Math.max(3, (block.data.text || "").split("\n").length)}
        defaultValue={block.data.text || ""}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  );
}

export function ImageBlock({ block, onChange }: BlockComponentProps) {
  const [editing, setEditing] = useState(!block.data.src);

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    onChange({ ...block, data: { ...block.data, src: e.currentTarget.value } });
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={block.data.src || ""}
        onBlur={handleBlur}
        placeholder="Image URL"
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    );
  }

  return (
    <div className="group relative">
      {block.data.src ? (
        <img
          src={block.data.src}
          alt={block.data.alt || ""}
          className="max-h-96 w-full rounded-md object-contain"
        />
      ) : (
        <div
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300"
          onClick={() => setEditing(true)}
        >
          Click to add image
        </div>
      )}
      {block.data.src && (
        <button
          type="button"
          className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs text-gray-700 shadow opacity-0 transition group-hover:opacity-100"
          onClick={() => setEditing(true)}
        >
          Edit URL
        </button>
      )}
    </div>
  );
}

export function EmbedBlock({ block, onChange }: BlockComponentProps) {
  const [editing, setEditing] = useState(!block.data.url);

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    onChange({ ...block, data: { ...block.data, url: e.currentTarget.value } });
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={block.data.url || ""}
        onBlur={handleBlur}
        placeholder="Embed URL"
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    );
  }

  return (
    <div className="group relative">
      {block.data.url ? (
        <div className="overflow-hidden rounded-md border border-gray-200">
          <iframe
            src={block.data.url}
            className="h-64 w-full"
            title="Embedded content"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300"
          onClick={() => setEditing(true)}
        >
          Click to add embed
        </div>
      )}
      <button
        type="button"
        className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs text-gray-700 shadow opacity-0 transition group-hover:opacity-100"
        onClick={() => setEditing(true)}
      >
        Edit URL
      </button>
    </div>
  );
}

export function TableBlock({ block, onChange }: BlockComponentProps) {
  const headers: string[] = block.data.headers || ["", ""];
  const rows: string[][] = block.data.rows || [];

  const updateHeader = (idx: number, value: string) =>
    onChange({
      ...block,
      data: { ...block.data, headers: headers.map((h, i) => (i === idx ? value : h)) },
    });

  const updateCell = (rowIdx: number, colIdx: number, value: string) =>
    onChange({
      ...block,
      data: {
        ...block.data,
        rows: rows.map((r, ri) =>
          ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
        ),
      },
    });

  const addRow = () =>
    onChange({
      ...block,
      data: { ...block.data, rows: [...rows, Array(headers.length).fill("")] },
    });

  const addCol = () =>
    onChange({
      ...block,
      data: {
        ...block.data,
        headers: [...headers, ""],
        rows: rows.map((r) => [...r, ""]),
      },
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-200 bg-gray-50 px-2 py-1">
                <input
                  className="w-full bg-transparent text-left font-semibold text-gray-900 focus:outline-none"
                  value={h}
                  onChange={(e) => updateHeader(i, e.target.value)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-200 px-2 py-1">
                  <input
                    className="w-full bg-transparent text-gray-900 focus:outline-none"
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          className="text-xs text-gray-700 hover:text-gray-900"
          onClick={addRow}
        >
          + Row
        </button>
        <button
          type="button"
          className="text-xs text-gray-700 hover:text-gray-900"
          onClick={addCol}
        >
          + Column
        </button>
      </div>
    </div>
  );
}

export function DividerBlock() {
  return <hr className="my-4 border-t border-gray-200" />;
}

interface AIAssistantBlockProps extends BlockComponentProps {
  onSummarise?: (blockId: string) => void;
}

export function AIAssistantBlock({ block, onChange, onSummarise }: AIAssistantBlockProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="mb-2 text-sm font-medium text-gray-700">AI Assistant</div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          value={block.data.prompt || ""}
          onChange={(e) =>
            onChange({ ...block, data: { ...block.data, prompt: e.target.value } })
          }
          placeholder="Ask anything..."
        />
        <button
          type="button"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          onClick={() => onSummarise?.(block.id)}
        >
          Summarise
        </button>
      </div>
      {block.metadata.aiSummary && (
        <div className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {block.metadata.aiSummary}
        </div>
      )}
    </div>
  );
}
