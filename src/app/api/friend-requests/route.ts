import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, type RegisteredUser, FIRESTORE_BASE } from "../register-user/route";

interface FriendRequestDoc {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined";
  timestamp: string;
}

/**
 * Fetch a user by ID from Firestore (Admin SDK) or in-memory registry.
 */
async function fetchUser(uid: string): Promise<RegisteredUser | null> {
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
      console.warn("[friend-requests] Admin SDK fetch failed for", uid);
    }
  }
  return userRegistry.get(uid) || null;
}

/**
 * Save a user to Firestore (Admin SDK) or in-memory registry.
 */
async function saveUser(user: RegisteredUser): Promise<void> {
  userRegistry.set(user.id, user);
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
    } catch (err) {
      console.warn("[friend-requests] Admin SDK save failed for", user.id);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId, idToken } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[friend-requests] action=${action} from=${currentUserId} to=${targetUserId}`);

    // ====== SEND REQUEST ======
    if (action === "send") {
      // Check if request already exists
      if (adminDb) {
        try {
          const existing = await adminDb.collection("friend_requests")
            .where("senderId", "==", currentUserId)
            .where("recipientId", "==", targetUserId)
            .where("status", "==", "pending")
            .limit(1)
            .get();

          if (!existing.empty) {
            return NextResponse.json({ ok: true, message: "Request already sent" });
          }
        } catch {}
      }

      // Fetch sender's name
      const sender = await fetchUser(currentUserId);
      const senderName = sender?.name || "User";

      // Create friend_request document in Firestore
      const requestData: FriendRequestDoc = {
        id: `req-${Date.now()}`,
        senderId: currentUserId,
        senderName,
        recipientId: targetUserId,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      if (adminDb) {
        try {
          await adminDb.collection("friend_requests").doc(requestData.id).set(requestData);
          console.log(`[friend-requests] Created request doc ${requestData.id}`);
        } catch (err) {
          console.error("[friend-requests] Failed to create request doc:", err);
        }
      }

      // Also update both users' arrays (in-memory + Firestore)
      const targetUser = await fetchUser(targetUserId);
      if (targetUser) {
        if (!targetUser.incomingRequests.includes(currentUserId)) {
          targetUser.incomingRequests.push(currentUserId);
          if (!targetUser.friendRequests.includes(currentUserId)) {
            targetUser.friendRequests.push(currentUserId);
          }
        }
        await saveUser(targetUser);
      }

      if (sender) {
        if (!sender.outgoingRequests.includes(targetUserId)) {
          sender.outgoingRequests.push(targetUserId);
        }
        await saveUser(sender);
      }

      return NextResponse.json({ ok: true, message: "Friend request sent" });
    }

    // ====== ACCEPT REQUEST ======
    if (action === "accept") {
      // Update the friend_requests document
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection("friend_requests")
            .where("senderId", "==", targetUserId)
            .where("recipientId", "==", currentUserId)
            .where("status", "==", "pending")
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await docRef.update({ status: "accepted", timestamp: new Date().toISOString() });
          }
        } catch (err) {
          console.error("[friend-requests] Failed to update request doc:", err);
        }
      }

      // Update both users' friends/followers/following arrays
      const currentUser = await fetchUser(currentUserId);
      const targetUser = await fetchUser(targetUserId);

      if (currentUser && targetUser) {
        // Remove from request arrays
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        currentUser.outgoingRequests = currentUser.outgoingRequests.filter((id) => id !== targetUserId);
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);
        targetUser.incomingRequests = targetUser.incomingRequests.filter((id) => id !== currentUserId);
        targetUser.friendRequests = targetUser.friendRequests.filter((id) => id !== currentUserId);

        // Add to friends (mutual connection)
        if (!currentUser.friends.includes(targetUserId)) currentUser.friends.push(targetUserId);
        if (!currentUser.followers.includes(targetUserId)) currentUser.followers.push(targetUserId);
        if (!currentUser.following.includes(targetUserId)) currentUser.following.push(targetUserId);
        if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        if (!targetUser.following.includes(currentUserId)) targetUser.following.push(currentUserId);

        await saveUser(currentUser);
        await saveUser(targetUser);
      }

      return NextResponse.json({ ok: true, message: "Friend request accepted" });
    }

    // ====== DECLINE REQUEST ======
    if (action === "decline") {
      // Update the friend_requests document
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection("friend_requests")
            .where("senderId", "==", targetUserId)
            .where("recipientId", "==", currentUserId)
            .where("status", "==", "pending")
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await docRef.update({ status: "declined", timestamp: new Date().toISOString() });
          }
        } catch (err) {
          console.error("[friend-requests] Failed to update request doc:", err);
        }
      }

      // Update users' arrays
      const currentUser = await fetchUser(currentUserId);
      const targetUser = await fetchUser(targetUserId);

      if (currentUser) {
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        await saveUser(currentUser);
      }

      if (targetUser) {
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);
        await saveUser(targetUser);
      }

      return NextResponse.json({ ok: true, message: "Friend request declined" });
    }

    // ====== LIST INCOMING REQUESTS ======
    if (action === "list") {
      let requests: FriendRequestDoc[] = [];

      if (adminDb) {
        try {
          const snapshot = await adminDb.collection("friend_requests")
            .where("recipientId", "==", currentUserId)
            .where("status", "==", "pending")
            .get();

          requests = snapshot.docs.map((d) => d.data() as FriendRequestDoc);
          console.log(`[friend-requests] Found ${requests.length} pending requests for ${currentUserId}`);
        } catch (err) {
          console.error("[friend-requests] Failed to list requests:", err);
        }
      }

      // Fallback: check in-memory registry for incoming requests
      if (requests.length === 0) {
        const currentUser = userRegistry.get(currentUserId);
        if (currentUser && currentUser.incomingRequests.length > 0) {
          for (const senderId of currentUser.incomingRequests) {
            const sender = userRegistry.get(senderId);
            if (sender) {
              requests.push({
                id: `registry-${senderId}`,
                senderId,
                senderName: sender.name,
                recipientId: currentUserId,
                status: "pending",
                timestamp: sender.registeredAt,
              });
            }
          }
        }
      }

      // Enrich with sender profile info
      const enrichedRequests = await Promise.all(
        requests.map(async (req) => {
          const sender = await fetchUser(req.senderId);
          return {
            id: req.id,
            senderId: req.senderId,
            senderName: req.senderName || sender?.name || "User",
            senderEmail: sender?.email || "",
            senderUniversity: sender?.university || "",
            senderAvatarUrl: sender?.avatarUrl || null,
            senderIsPrivate: sender?.isPrivate || false,
            status: req.status,
            timestamp: req.timestamp,
          };
        })
      );

      return NextResponse.json({ ok: true, requests: enrichedRequests });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[friend-requests] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to process friend request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
