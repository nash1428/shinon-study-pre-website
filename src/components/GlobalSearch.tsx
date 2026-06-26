"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, FileText, CheckSquare, Calendar, Users, X, CornerDownLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "task" | "note" | "schedule" | "friend";
  meta?: string;
}

interface SearchResults {
  tasks: SearchResultItem[];
  notes: SearchResultItem[];
  schedules: SearchResultItem[];
  friends: SearchResultItem[];
}

const typeConfig = {
  task: { label: "Tasks", icon: CheckSquare, color: "text-gold-dark", bg: "bg-gold/5" },
  note: { label: "Notes", icon: FileText, color: "text-moss", bg: "bg-moss/5" },
  schedule: { label: "Schedules", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
  friend: { label: "Friends", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function GlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ tasks: [], notes: [], schedules: [], friends: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.trim().length < 1) {
      setResults({ tasks: [], notes: [], schedules: [], friends: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      let idToken = "";
      if (user) idToken = await user.getIdToken();
      const res = await fetch("/api/global-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchTerm.trim(),
          currentUserId: user?.uid || "",
          idToken,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.results);
      } else {
        setResults({ tasks: [], notes: [], schedules: [], friends: [] });
      }
    } catch {
      setResults({ tasks: [], notes: [], schedules: [], friends: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const totalResults = results.tasks.length + results.notes.length + results.schedules.length + results.friends.length;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search tasks, notes, schedules, friends..."
          className="w-full rounded-xl border border-ivory-deep bg-white py-2 pl-9 pr-8 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setResults({ tasks: [], notes: [], schedules: [], friends: [] }); setHasSearched(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {!showDropdown && !query && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded-md border border-ivory-deep px-1.5 py-0.5 text-[10px] text-ink-muted sm:flex">
          <CornerDownLeft className="h-2.5 w-2.5" /> Ctrl+K
        </div>
      )}

      {/* Dropdown results */}
      {showDropdown && hasSearched && (
        <div className="absolute z-[80] mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-float)] border border-ivory-deep/40 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
              <span className="ml-2 text-sm text-ink-muted">Searching...</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
              <p className="text-sm text-ink-muted">No results found for <span className="font-semibold text-ink">"{query}"</span></p>
            </div>
          ) : (
            <div className="py-2">
              {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((typeKey) => {
                const items = results[typeKey as keyof SearchResults] as SearchResultItem[];
                if (items.length === 0) return null;
                const config = typeConfig[typeKey];
                const Icon = config.icon;
                return (
                  <div key={typeKey}>
                    <div className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${config.color} ${config.bg}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                      <span className="ml-1 rounded-full bg-white/60 px-1 text-[9px]">{items.length}</span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 px-4 py-2.5 transition-colors hover:bg-ivory-warm/40 cursor-pointer"
                        onClick={() => {
                          setShowDropdown(false);
                          setQuery("");
                        }}
                      >
                        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                          {item.subtitle && <p className="truncate text-[11px] text-ink-muted">{item.subtitle}</p>}
                        </div>
                        {item.meta && <span className="shrink-0 rounded-full bg-ivory-warm px-2 py-0.5 text-[9px] text-ink-muted">{item.meta}</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
