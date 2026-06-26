import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, type RegisteredUser, FIRESTORE_BASE } from "../register-user/route";

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

async function fetchUserFromFirestore(idToken: string, uid: string): Promise<RegisteredUser | null> {
  // Try Admin SDK first (bypasses security rules)
  if (adminDb) {
    try {
      const docSnap = await adminDb.collection("users").doc(uid).get();
      if (docSnap.exists) {
        const data = docSnap.data()!;
        return {
          id: docSnap.id,
          name: data.name || "",
          email: data.email || "",
          university: data.university || "",
          avatarUrl: data.avatarUrl || null,
          isPrivate: data.isPrivate || false,
          showTodayTasks: data.showTodayTasks ?? true,
          showTodaySchedule: data.showTodaySchedule ?? true,
          followers: data.followers || [],
          following: data.following || [],
          friends: data.friends || [],
          friendRequests: data.incomingRequests || data.friendRequests || [],
          incomingRequests: data.incomingRequests || data.friendRequests || [],
          outgoingRequests: data.outgoingRequests || [],
          focusCount: data.focusCount || 0,
          focusMinutes: data.focusMinutes || 0,
          totalPoints: data.totalPoints || 0,
          registeredAt: data.registeredAt || data.updatedAt || "",
        };
      }
    } catch (err) {
      console.warn("[friend-data] Admin SDK fetch failed:", err);
    }
  }

  // Fallback to REST API
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields || {};
        // Inline parse to avoid dynamic import issues
        const getString = (key: string): string => {
          const v = fields[key] as { stringValue?: string } | undefined;
          return v?.stringValue || "";
        };
        const getBool = (key: string): boolean => {
          const v = fields[key] as { booleanValue?: boolean } | undefined;
          return v?.booleanValue || false;
        };
        const getArray = (key: string): string[] => {
          const v = fields[key] as { arrayValue?: { values?: { stringValue: string }[] } } | undefined;
          if (!v?.arrayValue?.values) return [];
          return v.arrayValue.values.map((item) => item.stringValue).filter(Boolean);
        };
        const avatarField = fields["avatarUrl"] as { stringValue?: string; nullValue?: unknown } | undefined;
        const avatarUrl = avatarField?.nullValue !== undefined ? null : (avatarField?.stringValue || null);
        return {
          id: uid,
          name: getString("name"),
          email: getString("email"),
          university: getString("university"),
          avatarUrl,
          isPrivate: getBool("isPrivate"),
          showTodayTasks: getBool("showTodayTasks") ?? true,
          showTodaySchedule: getBool("showTodaySchedule") ?? true,
          followers: getArray("followers"),
          following: getArray("following"),
          friends: getArray("friends"),
          friendRequests: getArray("incomingRequests") || getArray("friendRequests"),
          incomingRequests: getArray("incomingRequests") || getArray("friendRequests"),
          outgoingRequests: getArray("outgoingRequests"),
          focusCount: parseInt(getString("focusCount")) || 0,
          focusMinutes: parseInt(getString("focusMinutes")) || 0,
          totalPoints: parseInt(getString("totalPoints")) || 0,
          registeredAt: getString("registeredAt") || getString("updatedAt"),
        };
      }
    } catch {}
  }

  // Fallback to in-memory registry
  return userRegistry.get(uid) || null;
}

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, currentUserId, idToken } = await req.json();

    if (!targetUserId || !currentUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the TARGET user's profile (includes privacy settings + friends list)
    const targetUser = await fetchUserFromFirestore(idToken, targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Permission check: verify the requesting user is a friend or following
    const isFriend = targetUser.friends.includes(currentUserId);
    const isFollowing = targetUser.following.includes(currentUserId);
    const canViewProfile = !targetUser.isPrivate || isFriend || isFollowing;

    if (!canViewProfile) {
      return NextResponse.json({
        ok: true,
        canView: false,
        tasks: [],
        events: [],
        showTodayTasks: false,
        showTodaySchedule: false,
        studyStats: null,
        isFriend,
        isFollowing,
      });
    }

    // Privacy settings
    const showTasks = targetUser.showTodayTasks;
    const showSchedule = targetUser.showTodaySchedule;

    let tasks: FriendTask[] = [];
    let events: FriendEvent[] = [];

    // Fetch today's tasks from Firestore
    if (showTasks && adminDb) {
      try {
        const tasksSnapshot = await adminDb.collection("tasks")
          .where("userId", "==", targetUserId)
          .limit(20)
          .get();
        const today = new Date().toDateString();
        tasks = tasksSnapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || "",
              done: data.done || false,
              deadline: data.deadline || data.dueDate || "",
              content: data.content || "",
            } as FriendTask;
          })
          .filter((t) => {
            if (!t.deadline) return true;
            try {
              return new Date(t.deadline).toDateString() === today;
            } catch {
              return true;
            }
          });
      } catch (err) {
        console.warn("[friend-data] Tasks fetch failed:", err);
      }
    }

    // Fetch today's events from Firestore
    if (showSchedule && adminDb) {
      try {
        const eventsSnapshot = await adminDb.collection("events")
          .where("userId", "==", targetUserId)
          .limit(20)
          .get();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        events = eventsSnapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || "",
              date: data.date || "",
              startTime: data.startTime || "",
              endTime: data.endTime || "",
              location: data.location || "",
            } as FriendEvent;
          })
          .filter((e) => e.date === todayStr);
      } catch (err) {
        console.warn("[friend-data] Events fetch failed:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      canView: true,
      tasks: showTasks ? tasks : [],
      events: showSchedule ? events : [],
      showTodayTasks: showTasks,
      showTodaySchedule: showSchedule,
      studyStats: {
        focusCount: targetUser.focusCount || 0,
        focusMinutes: targetUser.focusMinutes || 0,
        totalPoints: targetUser.totalPoints || 0,
      },
      isFriend,
      isFollowing,
    });
  } catch (err) {
    console.error("[friend-data] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch friend data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
