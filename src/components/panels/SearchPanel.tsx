"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/types";

interface Props {
  onResultClick: (pageId: string) => void;
}

export default function SearchPanel({ onResultClick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results?: SearchResult[] };
        if (!cancelled) setResults(data.results ?? []);
      } catch (e) {
        console.error("Search error", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative px-3 py-3">
        <Search
          size={14}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages…"
          className="w-full rounded border border-gray-200 bg-white py-1.5 pl-7 pr-3 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="px-2 py-2 text-sm text-gray-500">Searching…</div>
        ) : results.length === 0 ? (
          <div className="px-2 py-2 text-sm text-gray-500">
            {query.trim()
              ? "No results"
              : "Type to search across all pages."}
          </div>
        ) : (
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={r.blockId}>
                <button
                  type="button"
                  onClick={() => onResultClick(r.pageId)}
                  className="w-full rounded px-2 py-2 text-left hover:bg-gray-50"
                >
                  <p className="line-clamp-2 text-sm text-gray-700">
                    {r.snippet}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
