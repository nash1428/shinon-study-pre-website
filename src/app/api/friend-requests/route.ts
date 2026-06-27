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

async function fetchUser(uid: string, idToken?: string): Promise<RegisteredUser | null> {
  // Try Admin SDK first
  if (adminDb) {
    try {
      const docSnap = await adminDb.collection("users").doc(uid).get();
      if (docSnap.exists) {
        const data = docSnap.data()!;
        return {
          id: docSnap.id, name: data.name || "", email: data.email || "",
          university: data.university || "", avatarUrl: data.avatarUrl || null,
          isPrivate: data.isPrivate || false, showTodayTasks: data.showTodayTasks ?? true,
          showTodaySchedule: data.showTodaySchedule ?? true, followers: data.followers || [],
          following: data.following || [], friends: data.friends || [],
          friendRequests: data.incomingRequests || data.friendRequests || [],
          incomingRequests: data.incomingRequests || data.friendRequests || [],
          outgoingRequests: data.outgoingRequests || [], focusCount: data.focusCount || 0,
          focusMinutes: data.focusMinutes || 0, totalPoints: data.totalPoints || 0,
          registeredAt: data.registeredAt || data.updatedAt || "",
        };
      }
    } catch {}
  }

  // Fallback: REST API with ID token
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const f = data.fields || {};
        const getString = (k: string) => (f[k] as { stringValue?: string })?.stringValue || "";
        const getBool = (k: string) => (f[k] as { booleanValue?: boolean })?.booleanValue || false;
        const getArray = (k: string) => {
          const v = f[k] as { arrayValue?: { values?: { stringValue: string }[] } } | undefined;
          return v?.arrayValue?.values?.map((i) => i.stringValue).filter(Boolean) || [];
        };
        const av = f["avatarUrl"] as { stringValue?: string; nullValue?: unknown } | undefined;
        return {
          id: uid, name: getString("name"), email: getString("email"),
          university: getString("university"),
          avatarUrl: av?.nullValue !== undefined ? null : (av?.stringValue || null),
          isPrivate: getBool("isPrivate"), showTodayTasks: getBool("showTodayTasks") ?? true,
          showTodaySchedule: getBool("showTodaySchedule") ?? true,
          followers: getArray("followers"), following: getArray("following"),
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

  return userRegistry.get(uid) || null;
}

async function saveUser(user: RegisteredUser, idToken?: string): Promise<void> {
  userRegistry.set(user.id, user);
  
  // Try Admin SDK
  if (adminDb) {
    try {
      await adminDb.collection("users").doc(user.id).set({
        followers: user.followers, following: user.following, friends: user.friends,
        incomingRequests: user.incomingRequests || user.friendRequests,
        outgoingRequests: user.outgoingRequests,
        friendRequests: user.incomingRequests || user.friendRequests,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return;
    } catch {}
  }

  // Fallback: REST API with ID token
  if (idToken) {
    try {
      const stringField = (v: string) => ({ stringValue: v });
      const arrayField = (arr: string[]) => ({ arrayValue: { values: arr.map((s) => ({ stringValue: s })) } });
      const fields = {
        id: stringField(user.id),
        followers: arrayField(user.followers),
        following: arrayField(user.following),
        friends: arrayField(user.friends),
        incomingRequests: arrayField(user.incomingRequests || user.friendRequests),
        outgoingRequests: arrayField(user.outgoingRequests),
        friendRequests: arrayField(user.incomingRequests || user.friendRequests),
        updatedAt: stringField(new Date().toISOString()),
      };
      await fetch(`${FIRESTORE_BASE}/users/${user.id}?updateMask.fieldPaths=followers&updateMask.fieldPaths=following&updateMask.fieldPaths=friends&updateMask.fieldPaths=incomingRequests&updateMask.fieldPaths=outgoingRequests&updateMask.fieldPaths=friendRequests&updateMask.fieldPaths=updatedAt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ fields }),
      });
    } catch {}
  }
}

// Create a friend_request doc via REST API
async function createRequestDoc(req: FriendRequestDoc, idToken: string): Promise<boolean> {
  // Try Admin SDK first
  if (adminDb) {
    try {
      await adminDb.collection("friend_requests").doc(req.id).set(req);
      return true;
    } catch {}
  }

  // Fallback: REST API
  try {
    const stringField = (v: string) => ({ stringValue: v });
    const fields = {
      id: stringField(req.id),
      senderId: stringField(req.senderId),
      senderName: stringField(req.senderName),
      recipientId: stringField(req.recipientId),
      status: stringField(req.status),
      timestamp: stringField(req.timestamp),
    };
    const res = await fetch(`${FIRESTORE_BASE}/friend_requests/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ fields }),
    });
    console.log(`[friend-requests] REST createRequestDoc: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[friend-requests] REST createRequestDoc failed:", err);
    return false;
  }
}

// List friend_requests via REST API
async function listRequestDocs(recipientId: string, idToken: string): Promise<FriendRequestDoc[]> {
  // Try Admin SDK first
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("friend_requests")
        .where("recipientId", "==", recipientId)
        .where("status", "==", "pending")
        .get();
      return snapshot.docs.map((d) => d.data() as FriendRequestDoc);
    } catch {}
  }

  // Fallback: REST API — list all and filter (REST API doesn't support compound where)
  try {
    const res = await fetch(`${FIRESTORE_BASE}/friend_requests?pageSize=100`, {
      headers: { "Authorization": `Bearer ${idToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      const requests: FriendRequestDoc[] = [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const getString = (k: string) => (f[k] as { stringValue?: string })?.stringValue || "";
        const req: FriendRequestDoc = {
          id: doc.name.split("/").pop(),
          senderId: getString("senderId"),
          senderName: getString("senderName"),
          recipientId: getString("recipientId"),
          status: getString("status") as "pending" | "accepted" | "declined",
          timestamp: getString("timestamp"),
        };
        if (req.recipientId === recipientId && req.status === "pending") {
          requests.push(req);
        }
      }
      console.log(`[friend-requests] REST list: found ${requests.length} pending for ${recipientId}`);
      return requests;
    } else {
      console.log(`[friend-requests] REST list failed: ${res.status}`);
    }
  } catch (err) {
    console.error("[friend-requests] REST list failed:", err);
  }

  return [];
}

// Update a friend_request doc via REST API
async function updateRequestDoc(requestId: string, status: string, idToken: string): Promise<void> {
  // Try Admin SDK first
  if (adminDb) {
    try {
      await adminDb.collection("friend_requests").doc(requestId).update({ status, timestamp: new Date().toISOString() });
      return;
    } catch {}
  }

  // Fallback: REST API
  try {
    const fields = {
      status: { stringValue: status },
      timestamp: { stringValue: new Date().toISOString() },
    };
    await fetch(`${FIRESTORE_BASE}/friend_requests/${requestId}?updateMask.fieldPaths=status&updateMask.fieldPaths=timestamp`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ fields }),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { action, currentUserId, targetUserId, idToken } = await req.json();

    if (!action || !currentUserId || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[friend-requests] action=${action} from=${currentUserId} to=${targetUserId} idToken=${!!idToken}`);

    // ====== SEND REQUEST ======
    if (action === "send") {
      // Check existing
      const existingReqs = await listRequestDocs(targetUserId, idToken || "");
      const alreadyExists = existingReqs.some((r) => r.senderId === currentUserId);
      // Also check reverse: did current user already send to target?
      const myReqs = await listRequestDocs(currentUserId, idToken || "");
      const sentAlready = myReqs.some((r) => r.senderId === currentUserId && r.recipientId === targetUserId);
      if (alreadyExists || sentAlready) {
        return NextResponse.json({ ok: true, message: "Request already sent" });
      }

      const sender = await fetchUser(currentUserId, idToken);
      const senderName = sender?.name || "User";

      const requestData: FriendRequestDoc = {
        id: `req-${Date.now()}-${currentUserId.slice(-6)}`,
        senderId: currentUserId,
        senderName,
        recipientId: targetUserId,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      // Create friend_request document (Admin SDK → REST API fallback)
      const created = await createRequestDoc(requestData, idToken || "");
      console.log(`[friend-requests] createRequestDoc result: ${created}`);

      // Also update both users' arrays
      const targetUser = await fetchUser(targetUserId, idToken);
      if (targetUser) {
        if (!targetUser.incomingRequests.includes(currentUserId)) {
          targetUser.incomingRequests.push(currentUserId);
          if (!targetUser.friendRequests.includes(currentUserId)) {
            targetUser.friendRequests.push(currentUserId);
          }
        }
        await saveUser(targetUser, idToken);
      }

      if (sender) {
        if (!sender.outgoingRequests.includes(targetUserId)) {
          sender.outgoingRequests.push(targetUserId);
        }
        await saveUser(sender, idToken);
      }

      return NextResponse.json({ ok: true, message: "Friend request sent" });
    }

    // ====== ACCEPT REQUEST ======
    if (action === "accept") {
      // Find and update the friend_request doc
      const incomingReqs = await listRequestDocs(currentUserId, idToken || "");
      const matchingReq = incomingReqs.find((r) => r.senderId === targetUserId);
      if (matchingReq) {
        await updateRequestDoc(matchingReq.id, "accepted", idToken || "");
      }

      // Update both users
      const currentUser = await fetchUser(currentUserId, idToken);
      const targetUser = await fetchUser(targetUserId, idToken);

      if (currentUser && targetUser) {
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        currentUser.outgoingRequests = currentUser.outgoingRequests.filter((id) => id !== targetUserId);
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);
        targetUser.incomingRequests = targetUser.incomingRequests.filter((id) => id !== currentUserId);
        targetUser.friendRequests = targetUser.friendRequests.filter((id) => id !== currentUserId);

        if (!currentUser.friends.includes(targetUserId)) currentUser.friends.push(targetUserId);
        if (!currentUser.followers.includes(targetUserId)) currentUser.followers.push(targetUserId);
        if (!currentUser.following.includes(targetUserId)) currentUser.following.push(targetUserId);
        if (!targetUser.friends.includes(currentUserId)) targetUser.friends.push(currentUserId);
        if (!targetUser.followers.includes(currentUserId)) targetUser.followers.push(currentUserId);
        if (!targetUser.following.includes(currentUserId)) targetUser.following.push(currentUserId);

        await saveUser(currentUser, idToken);
        await saveUser(targetUser, idToken);
      }

      return NextResponse.json({ ok: true, message: "Friend request accepted" });
    }

    // ====== DECLINE REQUEST ======
    if (action === "decline") {
      const incomingReqs = await listRequestDocs(currentUserId, idToken || "");
      const matchingReq = incomingReqs.find((r) => r.senderId === targetUserId);
      if (matchingReq) {
        await updateRequestDoc(matchingReq.id, "declined", idToken || "");
      }

      const currentUser = await fetchUser(currentUserId, idToken);
      const targetUser = await fetchUser(targetUserId, idToken);

      if (currentUser) {
        currentUser.incomingRequests = currentUser.incomingRequests.filter((id) => id !== targetUserId);
        currentUser.friendRequests = currentUser.friendRequests.filter((id) => id !== targetUserId);
        await saveUser(currentUser, idToken);
      }
      if (targetUser) {
        targetUser.outgoingRequests = targetUser.outgoingRequests.filter((id) => id !== currentUserId);
        await saveUser(targetUser, idToken);
      }

      return NextResponse.json({ ok: true, message: "Friend request declined" });
    }

    // ====== LIST INCOMING REQUESTS ======
    if (action === "list") {
      console.log(`[friend-requests] Listing pending requests for ${currentUserId}`);

      // Query friend_requests collection
      let requests = await listRequestDocs(currentUserId, idToken || "");
      console.log(`[friend-requests] Found ${requests.length} from friend_requests collection`);

      // Fallback: check in-memory registry
      if (requests.length === 0) {
        const currentUserReg = userRegistry.get(currentUserId);
        if (currentUserReg && currentUserReg.incomingRequests.length > 0) {
          for (const senderId of currentUserReg.incomingRequests) {
            const senderReg = userRegistry.get(senderId);
            if (senderReg) {
              requests.push({
                id: `registry-${senderId}`,
                senderId, senderName: senderReg.name,
                recipientId: currentUserId, status: "pending",
                timestamp: senderReg.registeredAt,
              });
            }
          }
          console.log(`[friend-requests] Found ${requests.length} from in-memory registry`);
        }
      }

      // Enrich with sender profile info
      const enrichedRequests = await Promise.all(
        requests.map(async (req) => {
          const sender = await fetchUser(req.senderId, idToken);
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
