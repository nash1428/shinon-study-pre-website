import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ActionType = "send_request" | "accept_request" | "reject_request" | "follow" | "unfollow";

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!db) {
      console.warn("[user-connections] Firestore not configured");
      return NextResponse.json({ ok: true, message: "Firestore not configured — operating in local mode" });
    }

    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Fetch target user to check privacy
    const targetDoc = await getDoc(targetUserRef);
    if (!targetDoc.exists()) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }
    const targetData = targetDoc.data();
    const isPrivate = targetData.isPrivate || false;

    switch (action as ActionType) {
      case "send_request": {
        // Add current user to target's friendRequests
        await updateDoc(targetUserRef, {
          friendRequests: arrayUnion(currentUserId),
        });
        return NextResponse.json({ ok: true, message: "Friend request sent" });
      }

      case "accept_request": {
        // Remove from current user's friendRequests, add to both users' friends lists
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
        // Remove from current user's friendRequests
        await updateDoc(currentUserRef, {
          friendRequests: arrayRemove(targetUserId),
        });
        return NextResponse.json({ ok: true, message: "Friend request rejected" });
      }

      case "follow": {
        // Only allowed for public accounts
        if (isPrivate) {
          return NextResponse.json({ error: "Cannot follow private account — send a friend request instead" }, { status: 403 });
        }
        // Add target to current user's following, add current user to target's followers
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId),
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId),
        });
        return NextResponse.json({ ok: true, message: "Now following" });
      }

      case "unfollow": {
        await updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId),
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId),
        });
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
