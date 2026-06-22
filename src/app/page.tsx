"use client";

import { useState } from "react";
import "@/lib/i18n";
import Sidebar, { type TabId } from "@/components/Sidebar";
import LanguageToggle from "@/components/LanguageToggle";
import HomePage from "@/components/pages/HomePage";
import NotesPage from "@/components/pages/NotesPage";
import TasksPage from "@/components/pages/TasksPage";
import SearchPage from "@/components/pages/SearchPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "notes":
        return <NotesPage />;
      case "tasks":
        return <TasksPage />;
      case "search":
        return <SearchPage />;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Fixed left sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <main className="ml-64 min-h-screen">
        {/* Sticky top header bar */}
        <header className="sticky top-0 z-30 flex items-center justify-end border-b border-stone-200/60 bg-cream/90 px-10 py-3 backdrop-blur-lg">
          <LanguageToggle />
        </header>

        {/* Page content */}
        <div className="mx-auto max-w-6xl px-10 py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
