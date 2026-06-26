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

    // If Firestore returned nothing, use the in-memory registry
    const sourceUsers = firestoreUsers.length > 0
      ? firestoreUsers
      : Array.from(userRegistry.values());

    if (sourceUsers.length === 0) {
      return NextResponse.json({
        ok: true,
        users: [],
        incomingRequestCount: 0,
        message: "No users found. Make sure your friend has logged in and visited the Friend page.",
      });
    }

    // Get current user's relationship data
    const currentUserFromFirestore = firestoreUsers.find((u) => u.id === currentUserId);
    const currentUserFromRegistry = userRegistry.get(currentUserId);
    const currentUserData = currentUserFromFirestore || currentUserFromRegistry;

    const currentUserFriends = currentUserData?.friends || [];
    const currentUserFollowing = currentUserData?.following || [];
    const currentUserIncomingRequests = currentUserData?.incomingRequests || currentUserData?.friendRequests || [];
    const currentUserOutgoingRequests = currentUserData?.outgoingRequests || [];

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
      source: firestoreUsers.length > 0 ? "firestore" : "registry",
      totalUsers: sourceUsers.length,
    });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
