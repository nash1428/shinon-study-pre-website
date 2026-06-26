"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Lock, Clock, Target, Flame, TrendingUp, Users, Calendar, MapPin, GraduationCap,
  Search, UserPlus, Loader2, UserCheck, Bell, MoreVertical, ChevronLeft, Check, X,
  ListChecks, CalendarDays, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import FocusTimer from "@/components/FocusTimer";

interface SearchResultUser {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  isFriend: boolean;
  isFollowing: boolean;
  hasPendingRequest: boolean;
}

interface FriendListUser {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  showTodayTasks: boolean;
  showTodaySchedule: boolean;
  isFriend: boolean;
  isFollowing: boolean;
}

interface FriendTask {
  id: string;
  title: string;
  done: boolean;
  deadline?: string;
  content?: string;
}

interface FriendEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    return d.toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function FriendPage() {
  const { profile, user, saveProfile } = useAuth();
  const [focusCount] = useLocalStorage<number>("studyspace_focus_count", 0);
  const [focusMinutes] = useLocalStorage<number>("studyspace_focus_minutes", 0);
  const [totalPoints] = useLocalStorage<number>("studyspace_focus_points", 0);

  // Friend search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Friend list (from Firestore)
  const [friendList, setFriendList] = useState<FriendListUser[]>([]);
  const [friendListLoading, setFriendListLoading] = useState(true);

  // Selected friend profile view
  const [selectedFriend, setSelectedFriend] = useState<FriendListUser | null>(null);
  const [friendData, setFriendData] = useState<{ tasks: FriendTask[]; events: FriendEvent[]; showTodayTasks: boolean; showTodaySchedule: boolean } | null>(null);
  const [friendDataLoading, setFriendDataLoading] = useState(false);

  // 3-dot menu for own profile
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showTodayTasks, setShowTodayTasks] = useLocalStorage<boolean>("studyspace_show_tasks", true);
  const [showTodaySchedule, setShowTodaySchedule] = useLocalStorage<boolean>("studyspace_show_schedule", true);

  const myStats = {
    totalMinutes: focusMinutes,
    sessionsCompleted: focusCount,
    points: totalPoints,
  };

  const totalFollowers = friendList.filter(f => f.isFriend || f.isFollowing).length;
  const totalFollowing = friendList.length;

  // Auto-register the current user
  useEffect(() => {
    if (!user || !profile) return;
    user.getIdToken().then((idToken) => {
      fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          profile: {
            name: profile.name,
            university: profile.university,
            avatarUrl: profile.avatarUrl,
            isPrivate: profile.isPrivate,
            showTodayTasks,
            showTodaySchedule,
          },
        }),
      }).catch(() => {});
    });
  }, [user, profile, showTodayTasks, showTodaySchedule]);

  // Fetch friend list from Firestore
  const fetchFriendList = async () => {
    if (!user) return;
    setFriendListLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/search-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm: "",
          currentUserId: user.uid,
          idToken,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Filter to only show friends and people we follow
        const friendsAndFollowing = data.users.filter((u: SearchResultUser) => u.isFriend || u.isFollowing);
        setFriendList(friendsAndFollowing.map((u: SearchResultUser) => ({
          id: u.id, name: u.name, email: u.email, university: u.university,
          avatarUrl: u.avatarUrl, isPrivate: u.isPrivate,
          showTodayTasks: true, showTodaySchedule: true,
          isFriend: u.isFriend, isFollowing: u.isFollowing,
        })));
      }
    } catch {}
    setFriendListLoading(false);
  };

  useEffect(() => {
    fetchFriendList();
  }, [user]);

  // Fetch friend's data when viewing their profile
  const fetchFriendData = async (friend: FriendListUser) => {
    if (!user) return;
    setFriendDataLoading(true);
    setFriendData(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/friend-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: friend.id,
          currentUserId: user.uid,
          idToken,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFriendData({
          tasks: data.tasks || [],
          events: data.events || [],
          showTodayTasks: data.showTodayTasks,
          showTodaySchedule: data.showTodaySchedule,
        });
      }
    } catch {}
    setFriendDataLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
    try {
      let idToken = "";
      if (user) idToken = await user.getIdToken();
      const res = await fetch("/api/search-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm: searchQuery.trim(),
          currentUserId: user?.uid || "currentUser",
          idToken,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.users);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Connection actions
  const handleConnection = async (action: string, targetUserId: string) => {
    if (!user) return;
    setActionLoading(targetUserId);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/user-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, currentUserId: user.uid, targetUserId, idToken }),
      });

      // Update search results
      setSearchResults((prev) =>
        prev.map((u) => {
          if (u.id !== targetUserId) return u;
          switch (action) {
            case "send_request": return { ...u, hasPendingRequest: true };
            case "follow": return { ...u, isFollowing: true };
            case "unfollow": return { ...u, isFollowing: false };
            case "unconnect": return { ...u, isFriend: false, isFollowing: false };
            case "accept_request": return { ...u, isFriend: true, hasPendingRequest: false, isFollowing: true };
            case "reject_request": return { ...u, hasPendingRequest: false };
            default: return u;
          }
        })
      );

      // If unconnect/unfollow, also remove from friend list
      if (action === "unconnect" || action === "unfollow") {
        setFriendList((prev) => prev.filter((f) => f.id !== targetUserId));
        if (selectedFriend?.id === targetUserId) setSelectedFriend(null);
      }

      // If follow/connect, refresh friend list
      if (action === "follow" || action === "accept_request") {
        fetchFriendList();
      }
    } catch {}
    setActionLoading(null);
  };

  // Toggle privacy setting
  const handleTogglePrivacy = async (setting: "tasks" | "schedule") => {
    const newValue = setting === "tasks" ? !showTodayTasks : !showTodaySchedule;
    if (setting === "tasks") setShowTodayTasks(newValue);
    if (setting === "schedule") setShowTodaySchedule(newValue);

    // Save to profile
    if (profile && user) {
      const updatedProfile = {
        ...profile,
        showTodayTasks: setting === "tasks" ? newValue : showTodayTasks,
        showTodaySchedule: setting === "schedule" ? newValue : showTodaySchedule,
      };
      await saveProfile(updatedProfile);
    }
  };

  // ====== FRIEND PROFILE DETAIL VIEW ======
  if (selectedFriend) {
    const canView = !selectedFriend.isPrivate || selectedFriend.isFriend || selectedFriend.isFollowing;

    return (
      <div className="page-enter space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
          {/* Back button */}
          <button
            onClick={() => { setSelectedFriend(null); setFriendData(null); }}
            className="mb-4 flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to friends
          </button>

          {/* Profile header */}
          <div className="flex items-center gap-4">
            {selectedFriend.avatarUrl ? (
              <img src={selectedFriend.avatarUrl} alt={selectedFriend.name} className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-[var(--shadow-soft)]" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 font-bold text-lg text-gold-dark">
                {selectedFriend.name?.[0] || "S"}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">{selectedFriend.name}</h2>
              {selectedFriend.university && (
                <p className="text-xs text-ink-muted"><GraduationCap className="inline h-3 w-3 mr-0.5" />{selectedFriend.university}</p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                {selectedFriend.isFriend && (
                  <span className="flex items-center gap-1 text-moss"><UserCheck className="h-3 w-3" />Friends</span>
                )}
                {selectedFriend.isFollowing && !selectedFriend.isFriend && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />Following</span>
                )}
                {selectedFriend.isPrivate && (
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Private</span>
                )}
              </div>
            </div>

            {/* Unconnect / Unfollow button */}
            {actionLoading === selectedFriend.id ? (
              <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
            ) : selectedFriend.isFriend ? (
              <button
                onClick={() => handleConnection("unconnect", selectedFriend.id)}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                title="Remove friend connection"
              >
                <X className="h-3.5 w-3.5" /> Unconnect
              </button>
            ) : selectedFriend.isFollowing ? (
              <button
                onClick={() => handleConnection("unfollow", selectedFriend.id)}
                className="flex items-center gap-1 rounded-lg border border-ivory-deep px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                title="Stop following"
              >
                <UserCheck className="h-3.5 w-3.5" /> Following
              </button>
            ) : (
              <button
                onClick={() => selectedFriend.isPrivate
                  ? handleConnection("send_request", selectedFriend.id)
                  : handleConnection("follow", selectedFriend.id)
                }
                className="flex items-center gap-1 rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark"
              >
                <UserPlus className="h-3.5 w-3.5" /> {selectedFriend.isPrivate ? "Connect" : "Follow"}
              </button>
            )}
          </div>

          {canView ? (
            <div className="mt-6 space-y-4">
              {/* Study Statistics */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Study Statistics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-moss/5 p-4">
                    <div className="flex items-center gap-2 text-moss">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Study Time</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-ink">{formatStudyTime(focusMinutes)}</p>
                  </div>
                  <div className="rounded-xl bg-gold/5 p-4">
                    <div className="flex items-center gap-2 text-gold-dark">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Sessions</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-ink">{focusCount}</p>
                  </div>
                  <div className="rounded-xl bg-gold/10 p-4">
                    <div className="flex items-center gap-2 text-gold-dark">
                      <Flame className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Points</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-ink">{totalPoints}</p>
                  </div>
                </div>
              </div>

              {/* Friend's data loading */}
              {friendDataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
                </div>
              ) : friendData ? (
                <>
                  {/* Today's Tasks */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <ListChecks className="h-3.5 w-3.5" /> Today's Tasks
                      {!friendData.showTodayTasks && (
                        <span className="ml-1 flex items-center gap-0.5 text-[10px] text-ink-muted/60">
                          <EyeOff className="h-2.5 w-2.5" /> Hidden by user
                        </span>
                      )}
                    </h3>
                    {friendData.showTodayTasks ? (
                      friendData.tasks.length > 0 ? (
                        <div className="space-y-2">
                          {friendData.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 rounded-lg bg-ivory-warm/40 px-3 py-2">
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 ${task.done ? "border-moss bg-moss" : "border-ivory-deep"}`}>
                                {task.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                              </div>
                              <span className={`text-xs ${task.done ? "text-ink-muted line-through" : "text-ink"}`}>{task.title}</span>
                              {task.deadline && (
                                <span className="ml-auto text-[10px] text-ink-muted">
                                  <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                                  {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-ivory-warm/20 px-3 py-2 text-xs text-ink-muted">No tasks for today.</p>
                      )
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-ivory-warm/20 px-3 py-3">
                        <Lock className="h-3.5 w-3.5 text-ink-muted" />
                        <p className="text-xs text-ink-muted">{selectedFriend.name} has chosen to keep their tasks private.</p>
                      </div>
                    )}
                  </div>

                  {/* Today's Schedule */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <CalendarDays className="h-3.5 w-3.5" /> Today's Schedule
                      {!friendData.showTodaySchedule && (
                        <span className="ml-1 flex items-center gap-0.5 text-[10px] text-ink-muted/60">
                          <EyeOff className="h-2.5 w-2.5" /> Hidden by user
                        </span>
                      )}
                    </h3>
                    {friendData.showTodaySchedule ? (
                      friendData.events.length > 0 ? (
                        <div className="space-y-2">
                          {friendData.events.map((evt) => (
                            <div key={evt.id} className="flex items-center gap-2 rounded-lg bg-blue-50/40 px-3 py-2">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-ink">{evt.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                                  <span><Clock className="inline h-2.5 w-2.5 mr-0.5" />{evt.startTime}–{evt.endTime}</span>
                                  {evt.location && <span><MapPin className="inline h-2.5 w-2.5 mr-0.5" />{evt.location}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-ivory-warm/20 px-3 py-2 text-xs text-ink-muted">No events scheduled for today.</p>
                      )
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-ivory-warm/20 px-3 py-3">
                        <Lock className="h-3.5 w-3.5 text-ink-muted" />
                        <p className="text-xs text-ink-muted">{selectedFriend.name} has chosen to keep their schedule private.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* Locked / Private state */
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-ivory-warm/30 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ivory-deep/30">
                <Lock className="h-7 w-7 text-ink-muted" />
              </div>
              <h3 className="text-lg font-semibold text-ink">This account is private</h3>
              <p className="mt-1.5 max-w-xs text-sm text-ink-muted">
                Send a friend request to {selectedFriend.name} to see their tasks and schedule.
              </p>
              <button
                onClick={() => handleConnection("send_request", selectedFriend.id)}
                className="mt-5 rounded-xl bg-moss px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moss-dark"
              >
                Connect
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ====== MAIN FRIEND PAGE ======
  return (
    <div className="page-enter space-y-6">
      {/* SNS-style profile header for current user */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
        <div className="relative">
          <div className="h-24 rounded-xl bg-gradient-to-r from-moss/20 via-gold/20 to-moss/10" />
          <div className="absolute -bottom-8 left-6">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-[var(--shadow-soft)]" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gold/20 font-bold text-xl text-gold-dark shadow-[var(--shadow-soft)]">
                {profile?.name?.[0] || "S"}
              </div>
            )}
          </div>

          {/* 3-dot menu (top right of own profile) */}
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-ink-muted shadow-sm transition-colors hover:bg-white hover:text-ink"
              title="Privacy settings"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-4 shadow-[var(--shadow-float)] border border-ivory-deep/40 z-30">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Privacy Settings</h3>

                {/* Show Today's Tasks toggle */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-ink-muted" />
                    <span className="text-xs font-medium text-ink">Share Today's Tasks</span>
                  </div>
                  <button
                    onClick={() => handleTogglePrivacy("tasks")}
                    className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${showTodayTasks ? "bg-moss" : "bg-stone-light"}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showTodayTasks ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Show Today's Schedule toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-ink-muted" />
                    <span className="text-xs font-medium text-ink">Share Today's Schedule</span>
                  </div>
                  <button
                    onClick={() => handleTogglePrivacy("schedule")}
                    className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${showTodaySchedule ? "bg-moss" : "bg-stone-light"}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showTodaySchedule ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>

                <p className="mt-3 border-t border-ivory-deep/40 pt-2 text-[10px] text-ink-muted">
                  When enabled, friends can see your tasks and schedule on your profile page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="mt-10 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">{profile?.name || "Student"}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              {profile?.university && (<span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{profile.university}</span>)}
              {profile?.location && (<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>)}
              {profile?.isPrivate && (<span className="flex items-center gap-1 rounded-full bg-ivory-warm px-2 py-0.5 text-[10px] font-medium"><Lock className="h-2.5 w-2.5" /> Private Account</span>)}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center"><p className="text-lg font-bold text-ink">{totalFollowing}</p><p className="text-[10px] text-ink-muted">Following</p></div>
            <div className="text-center"><p className="text-lg font-bold text-ink">{totalFollowers}</p><p className="text-[10px] text-ink-muted">Followers</p></div>
          </div>
        </div>

        {/* My study stats summary */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-moss/5 p-3 text-center"><Clock className="mx-auto mb-1 h-4 w-4 text-moss" /><p className="text-sm font-bold text-ink">{formatStudyTime(myStats.totalMinutes)}</p><p className="text-[10px] text-ink-muted">Study Time</p></div>
          <div className="rounded-xl bg-gold/5 p-3 text-center"><Target className="mx-auto mb-1 h-4 w-4 text-gold-dark" /><p className="text-sm font-bold text-ink">{myStats.sessionsCompleted}</p><p className="text-[10px] text-ink-muted">Sessions</p></div>
          <div className="rounded-xl bg-red-50 p-3 text-center"><TrendingUp className="mx-auto mb-1 h-4 w-4 text-red-400" /><p className="text-sm font-bold text-ink">{myStats.sessionsCompleted > 0 ? formatStudyTime(Math.round(myStats.totalMinutes / myStats.sessionsCompleted)) : "—"}</p><p className="text-[10px] text-ink-muted">Avg/Session</p></div>
          <div className="rounded-xl bg-gold/10 p-3 text-center"><Flame className="mx-auto mb-1 h-4 w-4 text-gold-dark" /><p className="text-sm font-bold text-gold-dark">{myStats.points}</p><p className="text-[10px] text-ink-muted">Points</p></div>
        </div>
      </div>

      {/* Focus Session — on own profile only */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Focus Session</h2>
        <FocusTimer />
      </div>

      {/* Friend Search */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Find Friends</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search by name or email..." className="w-full rounded-xl border border-ivory-deep bg-white py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
          </div>
          <button onClick={handleSearch} disabled={!searchQuery.trim() || searching} className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </button>
        </div>

        {/* Search results */}
        {hasSearched && (
          <div className="mt-3 space-y-2">
            {searching ? (
              <p className="py-4 text-center text-sm text-ink-muted">Searching...</p>
            ) : searchResults.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center shadow-[var(--shadow-card)]">
                <p className="text-sm text-ink-muted">No users found for <span className="font-semibold text-ink">"{searchQuery}"</span></p>
                <p className="mt-1 text-xs text-ink-muted/60">Make sure your friend has logged in to Study Garden at least once, then search by their name or email.</p>
              </div>
            ) : (
              searchResults.map((resultUser) => (
                <div key={resultUser.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)]">
                  {resultUser.avatarUrl ? (
                    <img src={resultUser.avatarUrl} alt={resultUser.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-bold text-gold-dark">{resultUser.name?.[0] || "S"}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-ink">{resultUser.name}</p>
                      {resultUser.isPrivate && <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-muted"><Lock className="h-2.5 w-2.5" />Private</span>}
                    </div>
                    {resultUser.university && <p className="text-[11px] text-ink-muted"><GraduationCap className="inline h-3 w-3 mr-0.5" />{resultUser.university}</p>}
                    {resultUser.isFriend && <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-moss"><UserCheck className="h-2.5 w-2.5" />Friends</span>}
                  </div>

                  {resultUser.isFriend ? (
                    <span className="flex items-center gap-1 rounded-lg bg-moss/10 px-3 py-1.5 text-xs font-medium text-moss"><UserCheck className="h-3.5 w-3.5" />Friends</span>
                  ) : actionLoading === resultUser.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                  ) : resultUser.isPrivate ? (
                    resultUser.hasPendingRequest ? (
                      <span className="flex items-center gap-1 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-dark"><Bell className="h-3.5 w-3.5" />Request Sent</span>
                    ) : (
                      <button onClick={() => handleConnection("send_request", resultUser.id)} className="flex items-center gap-1 rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark" title="Send friend request"><UserPlus className="h-3.5 w-3.5" />Connect</button>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {resultUser.hasPendingRequest ? (
                        <span className="flex items-center gap-1 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11px] font-medium text-gold-dark"><Bell className="h-3 w-3" />Sent</span>
                      ) : (
                        <button onClick={() => handleConnection("send_request", resultUser.id)} className="flex items-center gap-1 rounded-lg bg-moss px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-moss-dark" title="Send friend request"><UserPlus className="h-3 w-3" />Connect</button>
                      )}
                      {resultUser.isFollowing ? (
                        <button onClick={() => handleConnection("unfollow", resultUser.id)} className="flex items-center gap-1 rounded-lg border border-ivory-deep px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200" title="Unfollow"><UserCheck className="h-3 w-3" />Following</button>
                      ) : (
                        <button onClick={() => handleConnection("follow", resultUser.id)} className="flex items-center gap-1 rounded-lg border border-moss/30 bg-moss/5 px-2.5 py-1.5 text-[11px] font-medium text-moss transition-colors hover:bg-moss/10" title="Follow"><Users className="h-3 w-3" />Follow</button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Friends list — populated from Firestore */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Friends</h2>
        {friendListLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
          </div>
        ) : friendList.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-[var(--shadow-card)]">
            <Users className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
            <p className="text-sm text-ink-muted">No friends yet.</p>
            <p className="mt-1 text-xs text-ink-muted/60">Search for users above to connect and follow.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friendList.map((friend) => (
              <button
                key={friend.id}
                onClick={() => { setSelectedFriend(friend); fetchFriendData(friend); }}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] text-left"
              >
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 font-bold text-gold-dark">{friend.name?.[0] || "S"}</div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{friend.name}</h3>
                    {friend.isPrivate && <Lock className="h-3 w-3 text-ink-muted" />}
                  </div>
                  <p className="text-xs text-ink-muted">
                    {friend.isFriend ? "Friends" : "Following"}
                  </p>
                </div>
                {friend.isFriend && <span className="rounded-full bg-moss/10 px-2 py-0.5 text-[10px] font-medium text-moss">Friends</span>}
                {!friend.isFriend && friend.isFollowing && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-500">Following</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
