"use client";

import { Home, NotebookPen, ListChecks, Search } from "lucide-react";

export type TabId = "home" | "notes" | "tasks" | "search";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "search", label: "Search", icon: Search },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/60 bg-cream/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 transition-all duration-200"
            >
              <div
                className={`flex h-10 w-16 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-sage-100"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive
                      ? "text-sage-700"
                      : "text-stone-400"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-sage-700"
                    : "text-stone-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
