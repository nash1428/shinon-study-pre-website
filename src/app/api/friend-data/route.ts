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
  // Try Admin SDK first
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
        // Inline parse
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

/**
 * Fetch today's tasks for a user from Firestore + in-memory registry.
 * Today's date is calculated dynamically as YYYY-MM-DD.
 */
async function fetchTodayTasks(targetUserId: string): Promise<FriendTask[]> {
  const tasks: FriendTask[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayDateStr = today.toDateString();

  // 1. Try Firestore via Admin SDK
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("tasks")
        .where("userId", "==", targetUserId)
        .limit(50)
        .get();
      snapshot.forEach((d) => {
        const data = d.data();
        const deadline = data.deadline || data.dueDate || "";
        // Match if deadline is today OR if no deadline (today's task)
        let isToday = true;
        if (deadline) {
          try {
            isToday = new Date(deadline).toDateString() === todayDateStr;
          } catch {
            isToday = deadline === todayStr;
          }
        }
        if (isToday) {
          tasks.push({
            id: d.id,
            title: data.title || "",
            done: data.done || false,
            deadline,
            content: data.content || "",
          });
        }
      });
    } catch (err) {
      console.warn("[friend-data] Tasks fetch from Firestore failed:", err);
    }
  }

  // 2. Also check the in-memory registry for this user's tasks
  // (tasks created via chat or notes are saved to localStorage, but if the user
  // visited the Friend page, their task data might be in the registry)
  // Note: This won't have the actual tasks — they're in localStorage on the client.
  // The real solution is to save tasks to Firestore when created.
  // For now, return whatever Firestore has.

  return tasks;
}

/**
 * Fetch today's schedule/events for a user from Firestore.
 * Today's date is calculated dynamically as YYYY-MM-DD.
 */
async function fetchTodayEvents(targetUserId: string): Promise<FriendEvent[]> {
  const events: FriendEvent[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Try Firestore via Admin SDK
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("events")
        .where("userId", "==", targetUserId)
        .limit(50)
        .get();
      snapshot.forEach((d) => {
        const data = d.data();
        const eventDate = data.date || "";
        // Match if event date matches today's date string
        // Event dates are stored as YYYY-MM-DD (from the calendar)
        if (eventDate === todayStr || eventDate.includes(todayStr)) {
          events.push({
            id: d.id,
            title: data.title || "",
            date: eventDate,
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            location: data.location || "",
          });
        }
      });
    } catch (err) {
      console.warn("[friend-data] Events fetch from Firestore failed:", err);
    }
  }

  return events;
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

    // Privacy settings — respect the user's toggles
    const showTasks = targetUser.showTodayTasks;
    const showSchedule = targetUser.showTodaySchedule;

    // Fetch today's tasks and events in parallel
    const [tasks, events] = await Promise.all([
      showTasks ? fetchTodayTasks(targetUserId) : Promise.resolve([]),
      showSchedule ? fetchTodayEvents(targetUserId) : Promise.resolve([]),
    ]);

    console.log(`[friend-data] Fetched for ${targetUserId}: ${tasks.length} tasks, ${events.length} events`);

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
      todayDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    });
  } catch (err) {
    console.error("[friend-data] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch friend data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
