"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { recentSearches } from "@/lib/data";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(recentSearches);

  const removeRecent = (item: string) => {
    setRecent(recent.filter((r) => r !== item));
  };

  return (
    <div className="page-enter">
      <h1 className="mb-4 text-3xl font-bold text-ink">Search</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your study materials..."
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-12 pr-4 text-sm text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-4 focus:ring-sage-100"
        />
      </div>
      <p className="mb-8 text-xs text-ink-muted">
        Search across Notes, Tasks, and Schedule.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent searches */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Recent Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent.length === 0 ? (
              <p className="text-sm text-ink-muted">No recent searches.</p>
            ) : (
              recent.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-ink-soft shadow-[var(--shadow-soft)]"
                >
                  {item}
                  <button
                    onClick={() => removeRecent(item)}
                    className="ml-0.5 text-stone-300 hover:text-stone-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Notes", color: "bg-sage-50 text-sage-700", count: "24" },
              { label: "Tasks", color: "bg-lavender-50 text-lavender-500", count: "7" },
              { label: "Schedule", color: "bg-blue-50 text-blue-500", count: "4" },
              { label: "Anki Decks", color: "bg-amber-50 text-amber-600", count: "12" },
            ].map((cat) => (
              <button
                key={cat.label}
                className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left ${cat.color}`}
              >
                <span className="text-sm font-medium">{cat.label}</span>
                <span className="text-xs opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
