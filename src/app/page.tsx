"use client";

import { useState } from "react";
import Sidebar, { type TabId } from "@/components/Sidebar";
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

      {/* Main content area — scrollable, offset for sidebar */}
      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-6xl px-10 py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
