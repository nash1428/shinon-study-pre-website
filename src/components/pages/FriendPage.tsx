"use client";

import { useState, useMemo } from "react";
import {
  Lock, Clock, Target, Flame, TrendingUp, Users, Calendar, MapPin, GraduationCap,
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
  const { profile } = useAuth();
  const [focusCount] = useLocalStorage<number>("studyspace_focus_count", 0);
  const [focusMinutes] = useLocalStorage<number>("studyspace_focus_minutes", 0);

  // Current user's own stats
  const myStats = {
    totalMinutes: focusMinutes,
    sessionsCompleted: focusCount,
  };

  const totalFollowers = useMemo(() => mockFriends.filter(f => f.followers.includes(currentUserId)).length, []);
  const totalFollowing = mockFriends.length;

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
        <div className="mt-5 grid grid-cols-3 gap-3">
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
        </div>
      </div>

      {/* Focus Session — moved from Home */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Focus Session</h2>
        <FocusTimer />
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
