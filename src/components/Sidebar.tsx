"use client";

import { useState, useRef, useEffect } from "react";
import {
  Home, NotebookPen, ListChecks, Search, Users,
  ChevronUp, X, Check, Camera, Trash2,
  PanelLeftClose, PanelLeftOpen, LogOut, Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, type UserProfile } from "@/lib/AuthContext";

export type TabId = "home" | "notes" | "tasks" | "search" | "friend";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  profileData: UserProfile | null;
}

const navItems: { id: TabId; labelKey: string; icon: typeof Home }[] = [
  { id: "home", labelKey: "sidebar.home", icon: Home },
  { id: "notes", labelKey: "sidebar.notes", icon: NotebookPen },
  { id: "tasks", labelKey: "sidebar.tasks", icon: ListChecks },
  { id: "friend", labelKey: "sidebar.friend", icon: Users },
  { id: "search", labelKey: "sidebar.search", icon: Search },
];

const profileFields: { key: keyof Omit<UserProfile, "isPrivate" | "avatarUrl">; labelKey: string }[] = [
  { key: "name", labelKey: "profile.name" },
  { key: "university", labelKey: "profile.university" },
  { key: "semester", labelKey: "profile.semester" },
  { key: "degree", labelKey: "profile.degree" },
  { key: "major", labelKey: "profile.major" },
  { key: "email", labelKey: "profile.email" },
  { key: "hometown", labelKey: "profile.hometown" },
  { key: "location", labelKey: "profile.location" },
];

const defaultProfile: UserProfile = {
  name: "Student",
  university: "",
  semester: "",
  degree: "",
  major: "",
  email: "",
  hometown: "",
  location: "",
  isPrivate: false,
  avatarUrl: null,
};

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, profileData }: SidebarProps) {
  const { t } = useTranslation();
  const { saveProfile, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profileData || defaultProfile);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile data from auth context ONLY when not editing
  useEffect(() => {
    if (profileData && !isExpanded) {
      setDraft(profileData);
    }
  }, [profileData, isExpanded]);

  const profile = profileData || defaultProfile;

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await saveProfile(draft);
      setSaveStatus("saved");
      setTimeout(() => {
        setIsExpanded(false);
        setSaveStatus("idle");
      }, 800);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsExpanded(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 data URL so it survives page refresh
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setDraft({ ...draft, avatarUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setDraft({ ...draft, avatarUrl: null });
  };

  const handleAvatarClickCollapsed = () => {
    onToggleCollapse();
  };

  const Avatar = ({ size, url, name }: { size: number; url: string | null; name: string }) => {
    if (url) {
      return (
        <img
          src={url}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gold/20 font-bold text-gold-dark"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name?.[0] || "S"}
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-ivory-deep/60 bg-ivory transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header — App icon (clickable, navigates to Home) */}
      <div className={`flex items-center py-6 ${isCollapsed ? "justify-center px-2" : "gap-2.5 px-6"}`}>
        <button
          onClick={() => onTabChange("home")}
          className="shrink-0 cursor-pointer transition-transform hover:scale-105"
          title="Home"
        >
          <img
            src="/app-icon.jpg"
            alt="Study Garden"
            width={40}
            height={40}
            className="rounded-xl object-cover"
          />
        </button>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold text-ink tracking-tight">Study Garden</h1>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm/50 transition-colors"
            title="Collapse"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-2">
          <button
            onClick={onToggleCollapse}
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm/50 transition-colors"
            title="Expand"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {t("sidebar.menu")}
          </p>
        )}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? t(item.labelKey) : undefined}
                className={`flex w-full items-center gap-3 rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                } text-sm font-medium ${
                  isActive
                    ? "bg-moss/10 text-moss"
                    : "text-ink-soft hover:bg-ivory-warm/50 hover:text-ink"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                    isActive ? "text-moss" : "text-ink-muted"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {!isCollapsed && t(item.labelKey)}
                {!isCollapsed && isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-moss" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Expandable Profile Section */}
      <div className="border-t border-ivory-deep/60">
        {isCollapsed ? (
          /* Collapsed sidebar — avatar only */
          <button
            onClick={handleAvatarClickCollapsed}
            className="flex w-full items-center justify-center py-4 transition-colors hover:bg-ivory-warm/30"
            title={profile.name}
          >
            <div className="relative group/avatar">
              <Avatar size={32} url={profile.avatarUrl} name={profile.name} />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <PanelLeftOpen className="h-4 w-4 text-white" />
              </div>
            </div>
          </button>
        ) : isExpanded ? (
          /* Expanded — editable form */
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
            <div className="flex items-center gap-3 py-3">
              <div className="relative group/avatar">
                <Avatar size={48} url={draft.avatarUrl} name={draft.name} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100"
                  title={t("profile.changePhoto")}
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {t("profile.changePhoto")}
                </span>
                {draft.avatarUrl && (
                  <button
                    onClick={handleRemovePhoto}
                    className="ml-2 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-500"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    {t("profile.removePhoto")}
                  </button>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {profileFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-0.5 block text-[10px] font-medium text-ink-muted">
                    {t(field.labelKey)}
                  </label>
                  <input
                    type="text"
                    value={draft[field.key] || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                    className="w-full rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                  />
                </div>
              ))}
            </div>

            {/* Privacy toggle */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-ivory-warm/50 px-3 py-2.5">
              <span className="text-xs font-medium text-ink-soft">
                {t("profile.private")}
              </span>
              <button
                onClick={() => setDraft({ ...draft, isPrivate: !draft.isPrivate })}
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  draft.isPrivate ? "bg-moss" : "bg-stone-light"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    draft.isPrivate ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white transition-colors ${
                  saveStatus === "saved"
                    ? "bg-moss"
                    : saveStatus === "error"
                    ? "bg-red-400"
                    : "bg-moss hover:bg-moss-dark"
                } disabled:opacity-50`}
              >
                {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
                {saveStatus === "saved" && <Check className="h-3 w-3" />}
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : t("profile.save")}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg border border-ivory-deep px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-ivory-warm/50"
              >
                {t("profile.cancel")}
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-ivory-deep py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-3 w-3" />
              {t("auth.logout")}
            </button>
          </div>
        ) : (
          /* Collapsed profile — avatar + name + chevron */
          <button
            onClick={() => {
              setDraft(profile);
              setIsExpanded(true);
            }}
            className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-ivory-warm/30"
          >
            <Avatar size={32} url={profile.avatarUrl} name={profile.name} />
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-ink">{profile.name}</p>
              <p className="truncate text-[11px] text-ink-muted">{profile.university || profile.email}</p>
            </div>
            <ChevronUp className="h-4 w-4 text-ink-muted" />
          </button>
        )}
      </div>
    </aside>
  );
}
