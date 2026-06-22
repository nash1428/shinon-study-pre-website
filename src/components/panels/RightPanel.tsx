"use client";

import { useState } from "react";
import SearchPanel from "./SearchPanel";
import GraphPanel from "./GraphPanel";
import type { GraphSuggestion } from "@/lib/types";

interface Props {
  selectedText: string | null;
  onOpenPage: (id: string) => void;
  onInsertBlock: (suggestion: GraphSuggestion) => void;
}

type Tab = "search" | "graph";

export default function RightPanel({
  selectedText,
  onOpenPage,
  onInsertBlock,
}: Props) {
  const [tab, setTab] = useState<Tab>("search");

  const tabs: { id: Tab; label: string }[] = [
    { id: "search", label: "Search" },
    { id: "graph", label: "Knowledge Graph" },
  ];

  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-sm ${
              tab === t.id
                ? "border-b-2 border-gray-700 text-gray-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "search" ? (
          <SearchPanel onResultClick={onOpenPage} />
        ) : (
          <GraphPanel selectedText={selectedText} onInsert={onInsertBlock} />
        )}
      </div>
    </aside>
  );
}
