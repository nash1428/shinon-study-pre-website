"use client";

import { useState, useEffect } from "react";
import "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar, { type TabId } from "@/components/Sidebar";
import LanguageToggle from "@/components/LanguageToggle";
import GlobalSearch from "@/components/GlobalSearch";
import FloatingChatbot from "@/components/FloatingChatbot";
import HomePage from "@/components/pages/HomePage";
import NotesPage from "@/components/pages/NotesPage";
import TasksPage from "@/components/pages/TasksPage";
import SearchPage from "@/components/pages/SearchPage";
import FriendPage from "@/components/pages/FriendPage";

function ProtectedApp() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-moss" />
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
        onTabChange={setActiveTab}
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
        {/* Top header bar: Global Search (left) + Language toggle (right) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ivory-deep/40 bg-ivory/90 px-10 py-3 backdrop-blur-lg">
          <GlobalSearch />
          <LanguageToggle />
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
      <ProtectedApp />
    </AuthProvider>
  );
}
