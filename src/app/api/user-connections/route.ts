import { NextRequest, NextResponse } from "next/server";
import { userRegistry, type RegisteredUser, parseFirestoreUser, toFirestoreFields, FIRESTORE_BASE } from "../register-user/route";

type ActionType = "send_request" | "accept_request" | "reject_request" | "follow" | "unfollow" | "unconnect";

async function fetchUserFromFirestore(idToken: string, uid: string): Promise<RegisteredUser | null> {
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

async function saveUserToFirestore(idToken: string, user: RegisteredUser): Promise<boolean> {
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

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId, idToken } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch both users from Firestore (or in-memory fallback)
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
        followers: [], following: [], friends: [], friendRequests: [],
        registeredAt: new Date().toISOString(),
      };
    }

    switch (action as ActionType) {
      case "send_request": {
        if (!targetUser.friendRequests.includes(currentUserId)) {
          targetUser.friendRequests.push(currentUserId);
          userRegistry.set(targetUser.id, targetUser);
          if (idToken) await saveUserToFirestore(idToken, targetUser);
        }
        return NextResponse.json({ ok: true, message: "Friend request sent" });
      }

      case "accept_request": {
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
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
        return NextResponse.json({ ok: true, message: "Friend request accepted" });
      }

      case "reject_request": {
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        userRegistry.set(currentUser.id, currentUser);
        if (idToken) await saveUserToFirestore(idToken, currentUser);
        return NextResponse.json({ ok: true, message: "Friend request rejected" });
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
        // Remove from friends, followers, and following for both users
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
