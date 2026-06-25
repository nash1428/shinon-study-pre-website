"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Lock, Clock, Target, Flame, TrendingUp, Users, Calendar, MapPin, GraduationCap, Search, UserPlus, Loader2, UserCheck, Bell,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import FocusTimer from "@/components/FocusTimer";

interface FriendUser {
  id: string;
  username: string;
  isPrivateAccount: boolean;
  followers: string[];
  following: string[];
  studyStats: {
    totalMinutes: number;
    sessionsCompleted: number;
  };
}

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

const mockFriends: FriendUser[] = [
  { id: "friend1", username: "Aoi Tanaka", isPrivateAccount: false, followers: [], following: [], studyStats: { totalMinutes: 1820, sessionsCompleted: 73 } },
  { id: "friend2", username: "Kenji Sato", isPrivateAccount: true, followers: ["currentUser"], following: ["currentUser"], studyStats: { totalMinutes: 2450, sessionsCompleted: 98 } },
  { id: "friend3", username: "Yuki Mori", isPrivateAccount: true, followers: [], following: ["currentUser"], studyStats: { totalMinutes: 960, sessionsCompleted: 38 } },
];

const currentUserId = "currentUser";

/**
 * Helper: Check if the current viewer is a mutual follower (friend) of the target user.
 * A friend is someone who is in BOTH the target's followers AND following arrays.
 */
function isMutualFriend(targetUser: FriendUser, viewerId: string): boolean {
  return targetUser.followers.includes(viewerId) && targetUser.following.includes(viewerId);
}

/**
 * Helper: Determine if the viewer can see the target user's full profile.
 * Returns true if the account is public OR the viewer is a mutual friend.
 */
function canViewProfile(targetUser: FriendUser, viewerId: string): boolean {
  if (!targetUser.isPrivateAccount) return true;
  return isMutualFriend(targetUser, viewerId);
}

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function FriendCard({ friend }: { friend: FriendUser }) {
  const [selected, setSelected] = useState(false);
  const canView = canViewProfile(friend, currentUserId);
  const isFriend = isMutualFriend(friend, currentUserId);

  if (selected) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] border border-ivory-deep/40">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setSelected(false)} className="text-xs text-ink-muted hover:text-ink">
            ← Back to friends
          </button>
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 font-bold text-lg text-gold-dark">
            {friend.username[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-ink">{friend.username}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{friend.followers.length} followers</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{friend.following.length} following</span>
              {friend.isPrivateAccount && (
                <span className="flex items-center gap-1 rounded-full bg-ivory-warm px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                  <Lock className="h-2.5 w-2.5" /> Private
                </span>
              )}
            </div>
          </div>
        </div>

        {canView ? (
          <div className="mt-6 space-y-4">
            {/* Study Statistics */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Study Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-moss/5 p-4">
                  <div className="flex items-center gap-2 text-moss">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Total Study Time</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-ink">{formatStudyTime(friend.studyStats.totalMinutes)}</p>
                </div>
                <div className="rounded-xl bg-gold/5 p-4">
                  <div className="flex items-center gap-2 text-gold-dark">
                    <Target className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Sessions Completed</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-ink">{friend.studyStats.sessionsCompleted}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-ivory-warm/40 p-4">
                <div className="flex items-center gap-2 text-ink-soft">
                  <Flame className="h-4 w-4 text-red-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Avg per Session</span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink">
                  {friend.studyStats.sessionsCompleted > 0
                    ? formatStudyTime(Math.round(friend.studyStats.totalMinutes / friend.studyStats.sessionsCompleted))
                    : "—"}
                </p>
              </div>
            </div>

            {/* Focus Session — moved from Home page */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Focus Session</h3>
              <FocusTimer />
            </div>
          </div>
        ) : (
          /* Locked / Private state */
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-ivory-warm/30 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ivory-deep/30">
              <Lock className="h-7 w-7 text-ink-muted" />
            </div>
            <h3 className="text-lg font-semibold text-ink">This account is private</h3>
            <p className="mt-1.5 max-w-xs text-sm text-ink-muted">
              Follow {friend.username} and wait for them to follow you back to see their study stats and activity.
            </p>
            <button className="mt-5 rounded-xl bg-moss px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moss-dark">
              Follow
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setSelected(true)}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] text-left"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 font-bold text-gold-dark">
        {friend.username[0]}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{friend.username}</h3>
          {friend.isPrivateAccount && (
            <Lock className="h-3 w-3 text-ink-muted" />
          )}
        </div>
        <p className="text-xs text-ink-muted">
          {canView
            ? `${formatStudyTime(friend.studyStats.totalMinutes)} studied · ${friend.studyStats.sessionsCompleted} sessions`
            : "Private account"}
        </p>
      </div>
      {isFriend && (
        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-[10px] font-medium text-moss">Friends</span>
      )}
    </button>
  );
}

export default function FriendPage() {
  const { profile, user } = useAuth();
  const [focusCount] = useLocalStorage<number>("studyspace_focus_count", 0);
  const [focusMinutes] = useLocalStorage<number>("studyspace_focus_minutes", 0);
  const [totalPoints] = useLocalStorage<number>("studyspace_focus_points", 0);

  // Friend search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks which user ID is being processed

  // Current user's own stats
  const myStats = {
    totalMinutes: focusMinutes,
    sessionsCompleted: focusCount,
    points: totalPoints,
  };

  const totalFollowers = useMemo(() => mockFriends.filter(f => f.followers.includes(currentUserId)).length, []);
  const totalFollowing = mockFriends.length;

  // Auto-register the current user so they appear in search results
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
          },
        }),
      }).catch(() => {});
    });
  }, [user, profile]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
    try {
      let idToken = "";
      if (user) {
        idToken = await user.getIdToken();
      }
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

  // Connection actions (friend request, accept, follow, unfollow)
  const handleConnection = async (action: string, targetUserId: string) => {
    if (!user) return;
    setActionLoading(targetUserId);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/user-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          currentUserId: user.uid,
          targetUserId,
          idToken,
        }),
      });

      // Update local state to reflect the change
      setSearchResults((prev) =>
        prev.map((u) => {
          if (u.id !== targetUserId) return u;
          switch (action) {
            case "send_request":
              return { ...u, hasPendingRequest: true };
            case "follow":
              return { ...u, isFollowing: true };
            case "unfollow":
              return { ...u, isFollowing: false };
            case "accept_request":
              return { ...u, isFriend: true, hasPendingRequest: false, isFollowing: true };
            case "reject_request":
              return { ...u, hasPendingRequest: false };
            default:
              return u;
          }
        })
      );
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="page-enter space-y-6">
      {/* SNS-style profile header for current user */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
        {/* Cover + avatar */}
        <div className="relative">
          <div className="h-24 rounded-xl bg-gradient-to-r from-moss/20 via-gold/20 to-moss/10" />
          <div className="absolute -bottom-8 left-6">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-[var(--shadow-soft)]"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gold/20 font-bold text-xl text-gold-dark shadow-[var(--shadow-soft)]">
                {profile?.name?.[0] || "S"}
              </div>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="mt-10 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">{profile?.name || "Student"}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              {profile?.university && (
                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{profile.university}</span>
              )}
              {profile?.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
              )}
              {profile?.isPrivate && (
                <span className="flex items-center gap-1 rounded-full bg-ivory-warm px-2 py-0.5 text-[10px] font-medium">
                  <Lock className="h-2.5 w-2.5" /> Private Account
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-ink">{totalFollowing}</p>
              <p className="text-[10px] text-ink-muted">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-ink">{totalFollowers}</p>
              <p className="text-[10px] text-ink-muted">Followers</p>
            </div>
          </div>
        </div>

        {/* My study stats summary */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-moss/5 p-3 text-center">
            <Clock className="mx-auto mb-1 h-4 w-4 text-moss" />
            <p className="text-sm font-bold text-ink">{formatStudyTime(myStats.totalMinutes)}</p>
            <p className="text-[10px] text-ink-muted">Study Time</p>
          </div>
          <div className="rounded-xl bg-gold/5 p-3 text-center">
            <Target className="mx-auto mb-1 h-4 w-4 text-gold-dark" />
            <p className="text-sm font-bold text-ink">{myStats.sessionsCompleted}</p>
            <p className="text-[10px] text-ink-muted">Sessions</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-4 w-4 text-red-400" />
            <p className="text-sm font-bold text-ink">
              {myStats.sessionsCompleted > 0
                ? formatStudyTime(Math.round(myStats.totalMinutes / myStats.sessionsCompleted))
                : "—"}
            </p>
            <p className="text-[10px] text-ink-muted">Avg/Session</p>
          </div>
          <div className="rounded-xl bg-gold/10 p-3 text-center">
            <Flame className="mx-auto mb-1 h-4 w-4 text-gold-dark" />
            <p className="text-sm font-bold text-gold-dark">{myStats.points}</p>
            <p className="text-[10px] text-ink-muted">Points</p>
          </div>
        </div>
      </div>

      {/* Focus Session — moved from Home */}
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-ivory-deep bg-white py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searching}
            className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Search results */}
        {hasSearched && (
          <div className="mt-3 space-y-2">
            {searching ? (
              <p className="py-4 text-center text-sm text-ink-muted">Searching...</p>
            ) : searchResults.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center shadow-[var(--shadow-card)]">
                <p className="text-sm text-ink-muted">
                  No users found for <span className="font-semibold text-ink">"{searchQuery}"</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted/60">
                  Make sure your friend has logged in to Study Garden at least once, then search by their name or email.
                </p>
              </div>
            ) : (
              searchResults.map((resultUser) => (
                <div
                  key={resultUser.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)]"
                >
                  {resultUser.avatarUrl ? (
                    <img
                      src={resultUser.avatarUrl}
                      alt={resultUser.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-bold text-gold-dark">
                      {resultUser.name?.[0] || "S"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-ink">{resultUser.name}</p>
                      {resultUser.isPrivate && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-muted">
                          <Lock className="h-2.5 w-2.5" /> Private
                        </span>
                      )}
                    </div>
                    {resultUser.university && (
                      <p className="text-[11px] text-ink-muted">
                        <GraduationCap className="inline h-3 w-3 mr-0.5" />
                        {resultUser.university}
                      </p>
                    )}
                    {resultUser.isFriend && (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-moss">
                        <UserCheck className="h-2.5 w-2.5" /> Friends
                      </span>
                    )}
                  </div>

                  {/* Privacy-based connection buttons */}
                  {resultUser.isFriend ? (
                    // Already friends — show "Friends" badge
                    <span className="flex items-center gap-1 rounded-lg bg-moss/10 px-3 py-1.5 text-xs font-medium text-moss">
                      <UserCheck className="h-3.5 w-3.5" /> Friends
                    </span>
                  ) : actionLoading === resultUser.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                  ) : resultUser.isPrivate ? (
                    // PRIVATE account: only "Connect" (friend request)
                    resultUser.hasPendingRequest ? (
                      <span className="flex items-center gap-1 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-dark">
                        <Bell className="h-3.5 w-3.5" /> Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnection("send_request", resultUser.id)}
                        className="flex items-center gap-1 rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark"
                        title="Send friend request"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Connect
                      </button>
                    )
                  ) : (
                    // PUBLIC account: both "Connect" and "Following" buttons
                    <div className="flex items-center gap-1.5">
                      {resultUser.hasPendingRequest ? (
                        <span className="flex items-center gap-1 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11px] font-medium text-gold-dark">
                          <Bell className="h-3 w-3" /> Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnection("send_request", resultUser.id)}
                          className="flex items-center gap-1 rounded-lg bg-moss px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-moss-dark"
                          title="Send friend request"
                        >
                          <UserPlus className="h-3 w-3" /> Connect
                        </button>
                      )}
                      {resultUser.isFollowing ? (
                        <button
                          onClick={() => handleConnection("unfollow", resultUser.id)}
                          className="flex items-center gap-1 rounded-lg border border-ivory-deep px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          title="Unfollow"
                        >
                          <UserCheck className="h-3 w-3" /> Following
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnection("follow", resultUser.id)}
                          className="flex items-center gap-1 rounded-lg border border-moss/30 bg-moss/5 px-2.5 py-1.5 text-[11px] font-medium text-moss transition-colors hover:bg-moss/10"
                          title="Follow"
                        >
                          <Users className="h-3 w-3" /> Follow
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Friends list */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Friends</h2>
        <div className="space-y-3">
          {mockFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      </div>
    </div>
  );
}
