"use client";

import { useState } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
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
      {/* Main content — centered with max width, padded for bottom nav */}
      <main className="mx-auto max-w-md pb-24">
        {renderPage()}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
