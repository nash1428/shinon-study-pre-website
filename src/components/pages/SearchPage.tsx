"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, FileText, CheckSquare, Calendar, Clock, MapPin, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentSearches as initialRecent } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NoteResult {
  id: number;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  content?: string;
  type: "note";
}

interface TaskResult {
  id: number;
  title: string;
  content?: string;
  deadline?: string;
  done: boolean;
  type: "task";
}

interface EventResult {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "event";
}

interface SearchResult {
  note?: NoteResult;
  task?: TaskResult;
  event?: EventResult;
  type: "note" | "task" | "event";
  score: number;
  matchedField: string;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function searchMatch(query: string, ...fields: (string | undefined)[]): { match: boolean; field: string } {
  const q = normalize(query);
  if (!q) return { match: false, field: "" };
  for (const field of fields) {
    if (field && normalize(field).includes(q)) {
      return { match: true, field: field };
    }
  }
  return { match: false, field: "" };
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useLocalStorage<string[]>("studyspace_recent_searches", initialRecent);
  const [activeCategory, setActiveCategory] = useState<"all" | "notes" | "tasks" | "events">("all");
  const [hasSearched, setHasSearched] = useState(false);

  // Read all app data from localStorage
  const [notes, setNotes] = useState<NoteResult[]>([]);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);

  useEffect(() => {
    try {
      const notesRaw = localStorage.getItem("studyspace_notes");
      if (notesRaw) {
        const parsed = JSON.parse(notesRaw);
        setNotes(parsed.map((n: NoteResult) => ({ ...n, type: "note" as const })));
      }
    } catch {}
    try {
      const tasksRaw = localStorage.getItem("studyspace_tasks_all");
      if (tasksRaw) {
        const parsed = JSON.parse(tasksRaw);
        setTasks(parsed.map((t: TaskResult) => ({ ...t, type: "task" as const })));
      }
    } catch {}
    try {
      const eventsRaw = localStorage.getItem("studyspace_local_events");
      if (eventsRaw) {
        const parsed = JSON.parse(eventsRaw);
        setEvents(parsed.map((e: EventResult, i: number) => ({ ...e, id: e.id || `evt-${i}`, type: "event" as const })));
      }
    } catch {}
  }, []);

  // Perform search across all data
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = normalize(query);
    const allResults: SearchResult[] = [];

    // Search notes
    notes.forEach((note) => {
      const titleMatch = searchMatch(query, note.title);
      const excerptMatch = searchMatch(query, note.excerpt);
      const contentMatch = searchMatch(query, note.content);
      const tagMatch = searchMatch(query, note.tag);

      if (titleMatch.match || excerptMatch.match || contentMatch.match || tagMatch.match) {
        let score = 0;
        let matchedField = "";
        if (titleMatch.match) { score += 3; matchedField = "title"; }
        if (excerptMatch.match) { score += 2; matchedField = matchedField || "excerpt"; }
        if (contentMatch.match) { score += 1; matchedField = matchedField || "content"; }
        if (tagMatch.match) { score += 2; matchedField = matchedField || "tag"; }
        allResults.push({ note, type: "note", score, matchedField });
      }
    });

    // Search tasks
    tasks.forEach((task) => {
      const titleMatch = searchMatch(query, task.title);
      const contentMatch = searchMatch(query, task.content);
      const deadlineMatch = searchMatch(query, task.deadline);

      if (titleMatch.match || contentMatch.match || deadlineMatch.match) {
        let score = 0;
        let matchedField = "";
        if (titleMatch.match) { score += 3; matchedField = "title"; }
        if (contentMatch.match) { score += 1; matchedField = matchedField || "content"; }
        if (deadlineMatch.match) { score += 1; matchedField = matchedField || "deadline"; }
        allResults.push({ task, type: "task", score, matchedField });
      }
    });

    // Search events
    events.forEach((event) => {
      const titleMatch = searchMatch(query, event.title);
      const locationMatch = searchMatch(query, event.location);
      const dateMatch = searchMatch(query, event.date);

      if (titleMatch.match || locationMatch.match || dateMatch.match) {
        let score = 0;
        let matchedField = "";
        if (titleMatch.match) { score += 3; matchedField = "title"; }
        if (locationMatch.match) { score += 2; matchedField = matchedField || "location"; }
        if (dateMatch.match) { score += 1; matchedField = matchedField || "date"; }
        allResults.push({ event, type: "event", score, matchedField });
      }
    });

    // Sort by relevance score (highest first)
    allResults.sort((a, b) => b.score - a.score);

    return allResults;
  }, [query, notes, tasks, events]);

  // Auto-suggestions based on query (top titles that contain the query)
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = normalize(query);
    const all: { text: string; type: string }[] = [];

    notes.forEach((n) => {
      if (normalize(n.title).includes(q)) all.push({ text: n.title, type: "Note" });
    });
    tasks.forEach((t) => {
      if (normalize(t.title).includes(q)) all.push({ text: t.title, type: "Task" });
    });
    events.forEach((e) => {
      if (normalize(e.title).includes(q)) all.push({ text: e.title, type: "Event" });
    });

    return all.slice(0, 5);
  }, [query, notes, tasks, events]);

  // Filter results by category
  const filteredResults = useMemo(() => {
    if (activeCategory === "all") return results;
    const typeMap = { notes: "note", tasks: "task", events: "event" } as const;
    return results.filter((r) => r.type === typeMap[activeCategory]);
  }, [results, activeCategory]);

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: { type: "note" | "task" | "event"; label: string; icon: typeof FileText; results: SearchResult[] }[] = [];
    const noteResults = filteredResults.filter((r) => r.type === "note");
    const taskResults = filteredResults.filter((r) => r.type === "task");
    const eventResults = filteredResults.filter((r) => r.type === "event");

    if (noteResults.length > 0) groups.push({ type: "note", label: "Notes", icon: FileText, results: noteResults });
    if (taskResults.length > 0) groups.push({ type: "task", label: "Tasks", icon: CheckSquare, results: taskResults });
    if (eventResults.length > 0) groups.push({ type: "event", label: "Schedule", icon: Calendar, results: eventResults });

    return groups;
  }, [filteredResults]);

  // Category counts
  const categoryCounts = useMemo(() => ({
    all: results.length,
    notes: results.filter((r) => r.type === "note").length,
    tasks: results.filter((r) => r.type === "task").length,
    events: results.filter((r) => r.type === "event").length,
  }), [results]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setHasSearched(true);
    if (q.trim() && !recent.includes(q.trim())) {
      setRecent([q.trim(), ...recent].slice(0, 8));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setHasSearched(true);
    setActiveCategory("all");
  };

  const handleRecentClick = (item: string) => {
    setQuery(item);
    setHasSearched(true);
    setActiveCategory("all");
  };

  const handleCategoryClick = (cat: typeof activeCategory) => {
    setActiveCategory(activeCategory === cat ? "all" : cat);
  };

  const removeRecent = (item: string) => {
    setRecent(recent.filter((r) => r !== item));
  };

  const categories = [
    { key: "all" as const, label: "All", count: categoryCounts.all, color: "bg-ivory-warm text-ink-soft", activeColor: "bg-ink text-white" },
    { key: "notes" as const, label: t("search.cat.notes"), count: categoryCounts.notes, color: "bg-moss/5 text-moss", activeColor: "bg-moss text-white" },
    { key: "tasks" as const, label: t("search.cat.tasks"), count: categoryCounts.tasks, color: "bg-gold/5 text-gold-dark", activeColor: "bg-gold/40 text-white" },
    { key: "events" as const, label: t("search.cat.schedule"), count: categoryCounts.events, color: "bg-blue-50 text-blue-500", activeColor: "bg-blue-500 text-white" },
  ];

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-gold/20 font-semibold text-ink">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="page-enter">
      <h1 className="mb-4 text-3xl font-bold text-ink">{t("search.title")}</h1>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHasSearched(false);
            setActiveCategory("all");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          placeholder={t("search.placeholder")}
          className="w-full rounded-2xl border border-ivory-deep bg-white py-3.5 pl-12 pr-12 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-4 focus:ring-moss/10"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setHasSearched(false); setActiveCategory("all"); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Auto-suggestions dropdown */}
        {suggestions.length > 0 && !hasSearched && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-float)] border border-ivory-deep/40">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.text)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-ivory-warm/50"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <span className="flex-1 truncate text-ink">{highlightMatch(s.text, query)}</span>
                <span className="shrink-0 rounded-full bg-ivory-warm px-2 py-0.5 text-[10px] text-ink-muted">{s.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mb-6 text-xs text-ink-muted">{t("search.subtitle")}</p>

      {/* Category filters — only show when there are results */}
      {query.trim() && hasSearched && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeCategory === cat.key ? cat.activeColor : cat.color
              }`}
            >
              {cat.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeCategory === cat.key ? "bg-white/20" : "bg-white/60"}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {query.trim() && hasSearched && (
        <div className="space-y-6">
          {filteredResults.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-[var(--shadow-card)]">
              <Search className="mx-auto mb-3 h-8 w-8 text-ink-muted/40" />
              <p className="text-sm text-ink-muted">
                No results found for <span className="font-semibold text-ink">"{query}"</span>
              </p>
              <p className="mt-1 text-xs text-ink-muted/60">Try a different keyword or check spelling.</p>
            </div>
          ) : (
            groupedResults.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.type}>
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <Icon className="h-3.5 w-3.5" />
                    {group.label}
                    <span className="rounded-full bg-ivory-warm px-1.5 py-0.5 text-[9px] text-ink-muted">{group.results.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {group.results.map((result, i) => {
                      if (result.type === "note" && result.note) {
                        const note = result.note;
                        return (
                          <div key={i} className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink">{highlightMatch(note.title, query)}</p>
                              <p className="mt-0.5 text-xs text-ink-muted">{highlightMatch(note.excerpt, query)}</p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                  note.tag === "PDF" ? "bg-red-50 text-red-500"
                                  : note.tag === "Anki" ? "bg-moss/5 text-moss"
                                  : note.tag === "Quiz" ? "bg-blue-50 text-blue-500"
                                  : "bg-gold/10 text-gold-dark"
                                }`}>{note.tag}</span>
                                <span className="text-[10px] text-ink-muted">{note.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (result.type === "task" && result.task) {
                        const task = result.task;
                        return (
                          <div key={i} className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 ${task.done ? "border-moss bg-moss" : "border-ivory-deep"}`}>
                              {task.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.done ? "text-ink-muted line-through" : "text-ink"}`}>
                                {highlightMatch(task.title, query)}
                              </p>
                              {task.content && <p className="mt-0.5 text-xs text-ink-muted">{highlightMatch(task.content, query)}</p>}
                              {task.deadline && (
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-muted">
                                  <Clock className="h-3 w-3" />
                                  Due: {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      if (result.type === "event" && result.event) {
                        const event = result.event;
                        return (
                          <div key={i} className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink">{highlightMatch(event.title, query)}</p>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.startTime}–{event.endTime}</span>
                                {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{highlightMatch(event.location, query)}</span>}
                                <span>{event.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Default view — recent searches + categories (when no search yet) */}
      {!query.trim() && (
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
                    className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-ink-soft shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-moss/5 hover:text-moss"
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

          {/* Browse by category */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t("search.categories")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(1).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setQuery(cat.label); setHasSearched(true); setActiveCategory(cat.key); }}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${cat.color}`}
                >
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
