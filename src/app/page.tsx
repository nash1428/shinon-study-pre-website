"use client";

import { useState, useEffect } from "react";
import "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar, { type TabId } from "@/components/Sidebar";
import LanguageToggle from "@/components/LanguageToggle";
import HomePage from "@/components/pages/HomePage";
import NotesPage from "@/components/pages/NotesPage";
import TasksPage from "@/components/pages/TasksPage";
import SearchPage from "@/components/pages/SearchPage";

function ProtectedApp() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to /login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Show loading spinner while checking auth state
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-sage-500" />
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
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        profileData={profile}
      />

      <main className={`min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? "ml-16" : "ml-64"
      }`}>
        <header className="sticky top-0 z-30 flex items-center justify-end border-b border-stone-200/60 bg-cream/90 px-10 py-3 backdrop-blur-lg">
          <LanguageToggle />
        </header>

        <div className="mx-auto max-w-6xl px-10 py-8">
          {renderPage()}
        </div>
      </main>
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
