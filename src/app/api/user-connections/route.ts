import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, type RegisteredUser, parseFirestoreUser, toFirestoreFields, FIRESTORE_BASE } from "../register-user/route";

type ActionType = "send_request" | "accept_request" | "reject_request" | "follow" | "unfollow" | "unconnect";

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
    } catch {}
  }

  // Fallback to REST API
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data = await res.json();
      return parseFirestoreUser(uid, data.fields || {});
    } catch {
      return null;
    }
  }

  // Fallback to in-memory registry
  return userRegistry.get(uid) || null;
}

async function saveUserToFirestore(idToken: string, user: RegisteredUser): Promise<boolean> {
  // Try Admin SDK first
  if (adminDb) {
    try {
      await adminDb.collection("users").doc(user.id).set({
        followers: user.followers,
        following: user.following,
        friends: user.friends,
        incomingRequests: user.incomingRequests || user.friendRequests,
        outgoingRequests: user.outgoingRequests,
        friendRequests: user.incomingRequests || user.friendRequests,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch {}
  }

  // Fallback to REST API
  if (idToken) {
    try {
      const fields = toFirestoreFields(user);
      const res = await fetch(`${FIRESTORE_BASE}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fields }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId, idToken } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch both users
    let currentUser: RegisteredUser | null = null;
    let targetUser: RegisteredUser | null = null;

    if (idToken) {
      currentUser = await fetchUserFromFirestore(idToken, currentUserId);
      targetUser = await fetchUserFromFirestore(idToken, targetUserId);
    }

    // Fallback to in-memory registry
    if (!currentUser) currentUser = userRegistry.get(currentUserId) || null;
    if (!targetUser) targetUser = userRegistry.get(targetUserId) || null;

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Ensure current user exists
    if (!currentUser) {
      currentUser = {
        id: currentUserId, name: "User", email: "", university: "",
        avatarUrl: null, isPrivate: false, showTodayTasks: true, showTodaySchedule: true,
        followers: [], following: [], friends: [],
        friendRequests: [], incomingRequests: [], outgoingRequests: [],
        focusCount: 0, focusMinutes: 0, totalPoints: 0,
        registeredAt: new Date().toISOString(),
      };
    }

    switch (action as ActionType) {
      case "send_request": {
        // Add currentUserId to target's incomingRequests
        if (!targetUser.incomingRequests.includes(currentUserId)) {
          targetUser.incomingRequests.push(currentUserId);
          if (!targetUser.friendRequests.includes(currentUserId)) {
            targetUser.friendRequests.push(currentUserId);
          }
        }
        // Add targetUserId to current's outgoingRequests
        if (!currentUser.outgoingRequests.includes(targetUserId)) {
          currentUser.outgoingRequests.push(targetUserId);
        }
        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Friend request sent" });
      }

      case "accept_request": {
        // Remove from both users' request arrays
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        currentUser.outgoingRequests = currentUser.outgoingRequests.filter((id) => id !== targetUserId);
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);
        targetUser.incomingRequests = targetUser.incomingRequests.filter((id) => id !== currentUserId);
        targetUser.friendRequests = targetUser.friendRequests.filter((id) => id !== currentUserId);

        // Add to both users' friends, followers, and following (mutual connection)
        if (!currentUser.friends.includes(targetUserId)) currentUser.friends.push(targetUserId);
        if (!currentUser.followers.includes(targetUserId)) currentUser.followers.push(targetUserId);
        if (!currentUser.following.includes(targetUserId)) currentUser.following.push(targetUserId);
        if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        if (!targetUser.following.includes(currentUserId)) targetUser.following.push(currentUserId);

        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Friend request accepted — you are now friends!" });
      }

      case "reject_request": {
        // Remove from current's incomingRequests and target's outgoingRequests
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);

        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Friend request declined" });
      }

      case "follow": {
        if (targetUser.isPrivate) {
          return NextResponse.json({ error: "Cannot follow private account — send a friend request instead" }, { status: 403 });
        }
        if (!currentUser.following.includes(targetUserId)) currentUser.following.push(targetUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Now following" });
      }

      case "unfollow": {
        currentUser.following = currentUser.following.filter((id) => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Unfollowed" });
      }

      case "unconnect": {
        // Remove from friends, followers, following for both users
        currentUser.friends = currentUser.friends.filter((id) => id !== targetUserId);
        currentUser.followers = currentUser.followers.filter((id) => id !== targetUserId);
        currentUser.following = currentUser.following.filter((id) => id !== targetUserId);
        targetUser.friends = targetUser.friends.filter((id) => id !== currentUserId);
        targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
        targetUser.following = targetUser.following.filter((id) => id !== currentUserId);
        userRegistry.set(currentUser.id, currentUser);
        userRegistry.set(targetUser.id, targetUser);
        if (idToken) {
          await saveUserToFirestore(idToken, currentUser);
          await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Disconnected" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[user-connections] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to process connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
