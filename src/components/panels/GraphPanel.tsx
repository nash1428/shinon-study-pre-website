"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { GraphSuggestion } from "@/lib/types";

interface Props {
  selectedText: string | null;
  onInsert: (suggestion: GraphSuggestion) => void;
}

export default function GraphPanel({ selectedText, onInsert }: Props) {
  const [suggestions, setSuggestions] = useState<GraphSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const text = selectedText?.trim();
      if (!text) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/graph/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Graph suggest failed");
        const data = (await res.json()) as { suggestions?: GraphSuggestion[] };
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch (e) {
        console.error("Graph suggest error", e);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedText]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <Sparkles size={14} className="text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Related Concepts
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="text-sm text-gray-500">Finding connections…</div>
        ) : !selectedText?.trim() ? (
          <div className="text-sm text-gray-500">
            Select a block in the editor to see related concepts.
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-sm text-gray-500">No suggestions yet.</div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={`${s.title}-${i}`}
                className="rounded border border-gray-200 bg-white p-3"
              >
                <p className="text-sm font-medium text-gray-700">{s.title}</p>
                <p className="mt-1 text-sm text-gray-500">{s.definition}</p>
                <button
                  type="button"
                  onClick={() => onInsert(s)}
                  className="mt-2 inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Plus size={12} />
                  Insert as block
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
