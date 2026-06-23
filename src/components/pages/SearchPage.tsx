"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentSearches as initialRecent } from "@/lib/data";

export default function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(initialRecent);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { key: "search.cat.notes", rawValue: "Notes", color: "bg-sage-50 text-sage-700", activeColor: "bg-sage-500 text-white", count: "24" },
    { key: "search.cat.tasks", rawValue: "Tasks", color: "bg-lavender-50 text-lavender-500", activeColor: "bg-lavender-400 text-white", count: "7" },
    { key: "search.cat.schedule", rawValue: "Schedule", color: "bg-blue-50 text-blue-500", activeColor: "bg-blue-500 text-white", count: "4" },
    { key: "search.cat.anki", rawValue: "Anki Decks", color: "bg-amber-50 text-amber-600", activeColor: "bg-amber-500 text-white", count: "12" },
  ];

  const handleRecentClick = (item: string) => {
    setQuery(item);
    setActiveCategory(null);
  };

  const handleCategoryClick = (cat: typeof categories[0]) => {
    const catValue = cat.rawValue;
    if (activeCategory === catValue) {
      setActiveCategory(null);
      setQuery("");
    } else {
      setActiveCategory(catValue);
      setQuery(catValue);
    }
  };

  const removeRecent = (item: string) => {
    setRecent(recent.filter((r) => r !== item));
  };

  return (
    <div className="page-enter">
      <h1 className="mb-4 text-3xl font-bold text-ink">{t("search.title")}</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveCategory(null);
          }}
          placeholder={t("search.placeholder")}
          className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-12 pr-4 text-sm text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-4 focus:ring-sage-100"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setActiveCategory(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mb-8 text-xs text-ink-muted">{t("search.subtitle")}</p>

      {/* Live search results hint */}
      {query && (
        <div className="mb-6 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">
          Searching for: <span className="font-semibold">"{query}"</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent searches */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("search.recent")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("search.noRecent")}</p>
            ) : (
              recent.map((item) => (
                <button
                  key={item}
                  onClick={() => handleRecentClick(item)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium shadow-[var(--shadow-soft)] transition-all duration-200 ${
                    query === item
                      ? "bg-sage-500 text-white"
                      : "bg-white text-ink-soft hover:bg-sage-50 hover:text-sage-700"
                  }`}
                >
                  {item}
                  <span
                    onClick={(e) => { e.stopPropagation(); removeRecent(item); }}
                    className="ml-0.5 text-stone-300 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("search.categories")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.rawValue;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${
                    isActive ? cat.activeColor + " shadow-[var(--shadow-soft)]" : cat.color
                  }`}
                >
                  <span className="text-sm font-medium">{t(cat.key)}</span>
                  <span className="text-xs opacity-60">{cat.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
