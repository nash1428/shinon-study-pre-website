import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, parseFirestoreUser, FIRESTORE_BASE, type RegisteredUser } from "../register-user/route";

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
          friendRequests: data.friendRequests || [],
          registeredAt: data.registeredAt || data.updatedAt || "",
        };
      }
    } catch {}
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
        return parseFirestoreUser(uid, data.fields || {});
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

    // Fetch the target user's profile (includes privacy settings)
    const targetUser = await fetchUserFromFirestore(idToken, currentUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user can view this profile
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
      });
    }

    // Privacy check: only return tasks/schedule if the user has enabled sharing
    const showTasks = targetUser.showTodayTasks;
    const showSchedule = targetUser.showTodaySchedule;

    let tasks: FriendTask[] = [];
    let events: FriendEvent[] = [];

    // Fetch today's tasks (from localStorage — passed via the request or from Firestore)
    // Since tasks are stored in localStorage on the client, we need to fetch from Firestore if available
    if (showTasks) {
      if (adminDb) {
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
        } catch {}
      }

      // Fallback: check in-memory registry for localStorage-based tasks (won't have other users' tasks)
      // This is a limitation — tasks are currently stored in localStorage per-browser
    }

    // Fetch today's events
    if (showSchedule) {
      if (adminDb) {
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
        } catch {}
      }
    }

    return NextResponse.json({
      ok: true,
      canView: true,
      tasks: showTasks ? tasks : [],
      events: showSchedule ? events : [],
      showTodayTasks: showTasks,
      showTodaySchedule: showSchedule,
      isFriend,
      isFollowing,
    });
  } catch (err) {
    console.error("[friend-data] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch friend data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
