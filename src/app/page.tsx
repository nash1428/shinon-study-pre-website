"use client";

import { useState, useEffect } from "react";
import "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { FocusSessionProvider } from "@/lib/FocusSessionContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar, { type TabId } from "@/components/Sidebar";
import LanguageToggle from "@/components/LanguageToggle";
import FloatingChatbot from "@/components/FloatingChatbot";
import FocusSessionWidget from "@/components/FocusSessionWidget";
import HomePage from "@/components/pages/HomePage";
import NotesPage from "@/components/pages/NotesPage";
import TasksPage from "@/components/pages/TasksPage";
import SearchPage from "@/components/pages/SearchPage";
import FriendPage from "@/components/pages/FriendPage";

// Map URL hash to tab ID and vice versa
const hashToTab: Record<string, TabId> = {
  "#home": "home",
  "#notes": "notes",
  "#tasks": "tasks",
  "#friend": "friend",
  "#search": "search",
};
const tabToHash: Record<TabId, string> = {
  home: "#home",
  notes: "#notes",
  tasks: "#tasks",
  friend: "#friend",
  search: "#search",
};

// Get initial tab from URL hash (survives refresh)
function getTabFromHash(): TabId {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.toLowerCase();
  return hashToTab[hash] || "home";
}

function ProtectedApp() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  // Initialize from URL hash so refresh keeps the current page
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync activeTab changes to URL hash
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tabToHash[tab];
    }
  };

  // Listen for hash changes (e.g., browser back/forward buttons)
  useEffect(() => {
    const handler = () => {
      const newTab = getTabFromHash();
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [activeTab]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Show loading spinner while Firebase auth is initializing
  // This prevents the redirect to home on refresh
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-moss" />
          <p className="text-xs text-ink-muted">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-sm text-ink-muted">Redirecting to login…</p>
      </div>
    );
  }

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
      case "friend":
        return <FriendPage />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        profileData={profile}
      />

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
        style={{ "--sidebar-width": sidebarCollapsed ? "4rem" : "16rem" } as React.CSSProperties}
      >
        {/* Top header bar: Focus Session widget (left) + Language toggle (right) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ivory-deep/40 bg-ivory/90 px-10 py-3 backdrop-blur-lg">
          <FocusSessionWidget />
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-10 py-8">
          {renderPage()}
        </div>
      </main>

      {/* Floating chatbot — always at bottom-right */}
      <FloatingChatbot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FocusSessionProvider>
        <ProtectedApp />
      </FocusSessionProvider>
    </AuthProvider>
  );
}
