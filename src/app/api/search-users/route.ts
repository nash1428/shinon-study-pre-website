import { NextRequest, NextResponse } from "next/server";
import { userRegistry, type RegisteredUser, fetchAllUsersFromFirestore, FIRESTORE_BASE } from "../register-user/route";

export async function POST(req: NextRequest) {
  try {
    const { searchTerm, currentUserId, idToken } = await req.json();

    const term = (searchTerm || "").toLowerCase().trim();
    const isListAll = !term || term.length < 2;

    // Try Firestore first (via Admin SDK — bypasses security rules)
    let firestoreUsers: RegisteredUser[] = [];
    if (idToken) {
      firestoreUsers = await fetchAllUsersFromFirestore(idToken);
    }

    // MERGE: Always include in-memory registry users, prioritizing registry data
    // (which has the latest connection updates from user-connections actions)
    const registryUsers = Array.from(userRegistry.values());
    const mergedUsersMap = new Map<string, RegisteredUser>();

    // Start with Firestore users
    firestoreUsers.forEach((u) => mergedUsersMap.set(u.id, u));

    // Override/add with registry users (registry has latest connection state)
    registryUsers.forEach((u) => {
      const existing = mergedUsersMap.get(u.id);
      if (existing) {
        // Merge: registry takes priority for connection arrays
        mergedUsersMap.set(u.id, {
          ...existing,
          friends: u.friends.length > existing.friends.length ? u.friends : existing.friends,
          following: u.following.length > existing.following.length ? u.following : existing.following,
          followers: u.followers.length > existing.followers.length ? u.followers : existing.followers,
          incomingRequests: u.incomingRequests.length > existing.incomingRequests.length ? u.incomingRequests : (existing.incomingRequests || existing.friendRequests || []),
          outgoingRequests: u.outgoingRequests.length > existing.outgoingRequests.length ? u.outgoingRequests : existing.outgoingRequests,
          friendRequests: u.incomingRequests.length > (existing.friendRequests || []).length ? u.incomingRequests : (existing.friendRequests || []),
        });
      } else {
        mergedUsersMap.set(u.id, u);
      }
    });

    const sourceUsers = Array.from(mergedUsersMap.values());

    if (sourceUsers.length === 0) {
      return NextResponse.json({
        ok: true,
        users: [],
        incomingRequestCount: 0,
        message: "No users found. Make sure your friend has logged in and visited the Friend page.",
      });
    }

    // Get current user's relationship data — prioritize registry (latest updates)
    const currentUserFromRegistry = userRegistry.get(currentUserId);
    const currentUserFromFirestore = firestoreUsers.find((u) => u.id === currentUserId);

    // Merge current user's data
    const regFriends = currentUserFromRegistry?.friends ?? [];
    const regFollowing = currentUserFromRegistry?.following ?? [];
    const regIncoming = currentUserFromRegistry?.incomingRequests ?? [];
    const regOutgoing = currentUserFromRegistry?.outgoingRequests ?? [];

    const currentUserFriends = regFriends.length > 0
      ? regFriends
      : currentUserFromFirestore?.friends || [];
    const currentUserFollowing = regFollowing.length > 0
      ? regFollowing
      : currentUserFromFirestore?.following || [];
    const currentUserIncomingRequests = regIncoming.length > 0
      ? regIncoming
      : currentUserFromFirestore?.incomingRequests || currentUserFromFirestore?.friendRequests || [];
    const currentUserOutgoingRequests = regOutgoing.length > 0
      ? regOutgoing
      : currentUserFromFirestore?.outgoingRequests || [];

    const results = sourceUsers
      .filter((user) => {
        if (user.id === currentUserId) return false;
        if (isListAll) return true;
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      })
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university,
        avatarUrl: user.avatarUrl,
        isPrivate: user.isPrivate,
        isFriend: currentUserFriends.includes(user.id),
        isFollowing: currentUserFollowing.includes(user.id),
        hasPendingRequest: currentUserOutgoingRequests.includes(user.id) || (user.incomingRequests || user.friendRequests || []).includes(currentUserId),
        focusCount: user.focusCount || 0,
        focusMinutes: user.focusMinutes || 0,
        totalPoints: user.totalPoints || 0,
      }))
      .slice(0, isListAll ? 50 : 10);

    // Build incoming request list (users who sent requests to current user)
    const incomingRequestUsers = currentUserIncomingRequests
      .map((uid) => {
        const user = sourceUsers.find((u) => u.id === uid);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          university: user.university,
          avatarUrl: user.avatarUrl,
          isPrivate: user.isPrivate,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      users: results,
      incomingRequestCount: currentUserIncomingRequests.length,
      incomingRequests: incomingRequestUsers,
      source: firestoreUsers.length > 0 ? "merged" : "registry",
      totalUsers: sourceUsers.length,
    });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
