import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userRegistry, type RegisteredUser } from "../register-user/route";

type ActionType = "send_request" | "accept_request" | "reject_request" | "follow" | "unfollow";

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try Firestore first
    let usedFirestore = false;
    if (db) {
      try {
        const currentUserRef = doc(db, "users", currentUserId);
        const targetUserRef = doc(db, "users", targetUserId);
        const targetDoc = await getDoc(targetUserRef);
        if (targetDoc.exists()) {
          usedFirestore = true;
          const targetData = targetDoc.data();
          const isPrivate = targetData.isPrivate || false;

          switch (action as ActionType) {
            case "send_request": {
              await updateDoc(targetUserRef, { friendRequests: arrayUnion(currentUserId) });
              return NextResponse.json({ ok: true, message: "Friend request sent" });
            }
            case "accept_request": {
              await updateDoc(currentUserRef, {
                friendRequests: arrayRemove(targetUserId),
                friends: arrayUnion(targetUserId),
                followers: arrayUnion(targetUserId),
                following: arrayUnion(targetUserId),
              });
              await updateDoc(targetUserRef, {
                friends: arrayUnion(currentUserId),
                followers: arrayUnion(currentUserId),
                following: arrayUnion(currentUserId),
              });
              return NextResponse.json({ ok: true, message: "Friend request accepted" });
            }
            case "reject_request": {
              await updateDoc(currentUserRef, { friendRequests: arrayRemove(targetUserId) });
              return NextResponse.json({ ok: true, message: "Friend request rejected" });
            }
            case "follow": {
              if (isPrivate) {
                return NextResponse.json({ error: "Cannot follow private account" }, { status: 403 });
              }
              await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
              await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
              return NextResponse.json({ ok: true, message: "Now following" });
            }
            case "unfollow": {
              await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
              await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
              return NextResponse.json({ ok: true, message: "Unfollowed" });
            }
          }
        }
      } catch (err) {
        console.warn("[user-connections] Firestore failed, using in-memory registry");
      }
    }

    // Fallback: use in-memory registry
    const currentUser = userRegistry.get(currentUserId);
    const targetUser = userRegistry.get(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Ensure current user exists in registry
    if (!currentUser) {
      userRegistry.set(currentUserId, {
        id: currentUserId, name: "User", email: "", university: "",
        avatarUrl: null, isPrivate: false, followers: [], following: [],
        friends: [], friendRequests: [], registeredAt: new Date().toISOString(),
      });
    }
    const current = userRegistry.get(currentUserId)!;

    switch (action as ActionType) {
      case "send_request": {
        if (!targetUser.friendRequests.includes(currentUserId)) {
          targetUser.friendRequests.push(currentUserId);
        }
        return NextResponse.json({ ok: true, message: "Friend request sent" });
      }
      case "accept_request": {
        current.friendRequests = current.friendRequests.filter((id) => id !== targetUserId);
        if (!current.friends.includes(targetUserId)) current.friends.push(targetUserId);
        if (!current.followers.includes(targetUserId)) current.followers.push(targetUserId);
        if (!current.following.includes(targetUserId)) current.following.push(targetUserId);
        if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        if (!targetUser.following.includes(currentUserId)) targetUser.following.push(currentUserId);
        return NextResponse.json({ ok: true, message: "Friend request accepted" });
      }
      case "reject_request": {
        current.friendRequests = current.friendRequests.filter((id) => id !== targetUserId);
        return NextResponse.json({ ok: true, message: "Friend request rejected" });
      }
      case "follow": {
        if (targetUser.isPrivate) {
          return NextResponse.json({ error: "Cannot follow private account — send a friend request instead" }, { status: 403 });
        }
        if (!current.following.includes(targetUserId)) current.following.push(targetUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        return NextResponse.json({ ok: true, message: "Now following" });
      }
      case "unfollow": {
        current.following = current.following.filter((id) => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
        return NextResponse.json({ ok: true, message: "Unfollowed" });
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
