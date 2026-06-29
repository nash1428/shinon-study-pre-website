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
      console.log(`[friend-data] REST fetch user ${uid}: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields || {};
        const getString = (k: string) => (fields[k] as { stringValue?: string })?.stringValue || "";
        const getBool = (k: string) => {
          const v = fields[k];
          if (v?.booleanValue !== undefined) return v.booleanValue;
          // If field missing, default to true (sharing enabled)
          return true;
        };
        const getArray = (k: string) => {
          const v = fields[k] as { arrayValue?: { values?: { stringValue: string }[] } } | undefined;
          return v?.arrayValue?.values?.map((i) => i.stringValue).filter(Boolean) || [];
        };
        const getInt = (k: string) => {
          const v = fields[k];
          if (v?.integerValue !== undefined) return parseInt(String(v.integerValue)) || 0;
          const s = (fields[k] as { stringValue?: string })?.stringValue;
          return s ? parseInt(s) || 0 : 0;
        };
        const av = fields["avatarUrl"] as { stringValue?: string; nullValue?: unknown } | undefined;
        const user = {
          id: uid,
          name: getString("name"),
          email: getString("email"),
          university: getString("university"),
          avatarUrl: av?.nullValue !== undefined ? null : (av?.stringValue || null),
          isPrivate: getBool("isPrivate"),
          showTodayTasks: getBool("showTodayTasks"),
          showTodaySchedule: getBool("showTodaySchedule"),
          followers: getArray("followers"),
          following: getArray("following"),
          friends: getArray("friends"),
          friendRequests: getArray("incomingRequests") || getArray("friendRequests"),
          incomingRequests: getArray("incomingRequests") || getArray("friendRequests"),
          outgoingRequests: getArray("outgoingRequests"),
          focusCount: getInt("focusCount"),
          focusMinutes: getInt("focusMinutes"),
          totalPoints: getInt("totalPoints"),
          registeredAt: getString("registeredAt") || getString("updatedAt"),
        };
        console.log(`[friend-data] REST user data: focusCount=${user.focusCount}, focusMinutes=${user.focusMinutes}, showTasks=${user.showTodayTasks}, showSchedule=${user.showTodaySchedule}`);
        return user;
      } else if (res.status === 403) {
        console.warn("[friend-data] REST 403 — Firestore security rules blocking read");
      } else if (res.status === 404) {
        console.warn(`[friend-data] REST 404 — user ${uid} not found in Firestore`);
      }
    } catch (err) {
      console.warn("[friend-data] REST fetch failed:", err);
    }
  }

  // Fallback to in-memory registry
  const registryUser = userRegistry.get(uid);
  if (registryUser) {
    console.log(`[friend-data] Using in-memory registry for ${uid}: focusCount=${registryUser.focusCount}, showTasks=${registryUser.showTodayTasks}`);
  }
  return registryUser || null;
}

/**
 * Fetch today's tasks — tries Admin SDK, then REST API fallback
 */
async function fetchTodayTasks(targetUserId: string, idToken: string): Promise<FriendTask[]> {
  const tasks: FriendTask[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayDateStr = today.toDateString();

  // 1. Try Admin SDK
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("tasks")
        .where("userId", "==", targetUserId)
        .limit(50)
        .get();
      snapshot.forEach((d) => {
        const data = d.data();
        const deadline = data.deadline || data.dueDate || "";
        let isToday = true;
        if (deadline) {
          try { isToday = new Date(deadline).toDateString() === todayDateStr; }
          catch { isToday = deadline === todayStr; }
        }
        if (isToday) {
          tasks.push({ id: d.id, title: data.title || "", done: data.done || false, deadline, content: data.content || "" });
        }
      });
      console.log(`[friend-data] Tasks via Admin SDK: ${tasks.length}`);
      return tasks;
    } catch (err) {
      console.warn("[friend-data] Tasks Admin SDK failed, trying REST");
    }
  }

  // 2. Fallback: REST API
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/tasks?pageSize=100`, {
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const getString = (k: string) => (f[k] as { stringValue?: string })?.stringValue || "";
          const getBool = (k: string) => (f[k] as { booleanValue?: boolean })?.booleanValue || false;
          const userId = getString("userId");
          if (userId !== targetUserId) continue;
          const deadline = getString("deadline") || getString("dueDate");
          let isToday = true;
          if (deadline) {
            try { isToday = new Date(deadline).toDateString() === todayDateStr; }
            catch { isToday = deadline === todayStr; }
          }
          if (isToday) {
            tasks.push({ id: doc.name.split("/").pop(), title: getString("title"), done: getBool("done"), deadline, content: getString("content") });
          }
        }
        console.log(`[friend-data] Tasks via REST: ${tasks.length}`);
      }
    } catch (err) {
      console.warn("[friend-data] Tasks REST failed:", err);
    }
  }

  return tasks;
}

/**
 * Fetch today's events — tries Admin SDK, then REST API fallback
 */
async function fetchTodayEvents(targetUserId: string, idToken: string): Promise<FriendEvent[]> {
  const events: FriendEvent[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 1. Try Admin SDK
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("events")
        .where("userId", "==", targetUserId)
        .limit(50)
        .get();
      snapshot.forEach((d) => {
        const data = d.data();
        const eventDate = data.date || "";
        if (eventDate === todayStr || eventDate.includes(todayStr)) {
          events.push({ id: d.id, title: data.title || "", date: eventDate, startTime: data.startTime || "", endTime: data.endTime || "", location: data.location || "" });
        }
      });
      console.log(`[friend-data] Events via Admin SDK: ${events.length}`);
      return events;
    } catch (err) {
      console.warn("[friend-data] Events Admin SDK failed, trying REST");
    }
  }

  // 2. Fallback: REST API
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/events?pageSize=100`, {
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const getString = (k: string) => (f[k] as { stringValue?: string })?.stringValue || "";
          const userId = getString("userId");
          if (userId !== targetUserId) continue;
          const eventDate = getString("date");
          if (eventDate === todayStr || eventDate.includes(todayStr)) {
            events.push({ id: doc.name.split("/").pop(), title: getString("title"), date: eventDate, startTime: getString("startTime"), endTime: getString("endTime"), location: getString("location") });
          }
        }
        console.log(`[friend-data] Events via REST: ${events.length}`);
      }
    } catch (err) {
      console.warn("[friend-data] Events REST failed:", err);
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

    // Fetch the TARGET user's profile
    const targetUser = await fetchUserFromFirestore(idToken, targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Permission check
    const isFriend = targetUser.friends.includes(currentUserId);
    const isFollowing = targetUser.following.includes(currentUserId);
    const canViewProfile = !targetUser.isPrivate || isFriend || isFollowing;

    if (!canViewProfile) {
      return NextResponse.json({
        ok: true, canView: false, tasks: [], events: [],
        showTodayTasks: false, showTodaySchedule: false,
        studyStats: null, isFriend, isFollowing,
      });
    }

    const showTasks = targetUser.showTodayTasks;
    const showSchedule = targetUser.showTodaySchedule;

    // Fetch today's tasks and events in parallel
    const [tasks, events] = await Promise.all([
      showTasks ? fetchTodayTasks(targetUserId, idToken) : Promise.resolve([]),
      showSchedule ? fetchTodayEvents(targetUserId, idToken) : Promise.resolve([]),
    ]);

    console.log(`[friend-data] Fetched for ${targetUserId}: ${tasks.length} tasks, ${events.length} events`);

    return NextResponse.json({
      ok: true, canView: true,
      tasks: showTasks ? tasks : [],
      events: showSchedule ? events : [],
      showTodayTasks: showTasks,
      showTodaySchedule: showSchedule,
      studyStats: {
        focusCount: targetUser.focusCount || 0,
        focusMinutes: targetUser.focusMinutes || 0,
        totalPoints: targetUser.totalPoints || 0,
      },
      isFriend, isFollowing,
      todayDate: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("[friend-data] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch friend data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
