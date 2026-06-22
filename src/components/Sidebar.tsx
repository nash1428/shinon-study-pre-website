"use client";

import { Home, NotebookPen, ListChecks, Search, GraduationCap } from "lucide-react";

export type TabId = "home" | "notes" | "tasks" | "search";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const navItems: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "search", label: "Search", icon: Search },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-stone-200/60 bg-cream">
      {/* Header — App title + logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-500 shadow-[var(--shadow-soft)]">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-base font-bold text-ink tracking-tight">StudySpace</h1>
          <p className="text-[10px] text-ink-muted">Small steps every day</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          Menu
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sage-100 text-sage-700"
                    : "text-ink-soft hover:bg-stone-200/40 hover:text-ink"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] transition-colors duration-200 ${
                    isActive ? "text-sage-600" : "text-ink-muted"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sage-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer — user profile mini */}
      <div className="border-t border-stone-200/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender-200 text-sm font-bold text-lavender-500">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-ink">Shinon</p>
            <p className="truncate text-[11px] text-ink-muted">Stanford University</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
