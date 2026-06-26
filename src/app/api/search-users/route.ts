import { NextRequest, NextResponse } from "next/server";
import { userRegistry, type RegisteredUser, fetchAllUsersFromFirestore, parseFirestoreUser, FIRESTORE_BASE } from "../register-user/route";

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
        message: "No users found. Make sure your friend has logged in and visited the Friend page.",
      });
    }

    // Get current user's relationship data
    let currentUserFriends: string[] = [];
    let currentUserFollowing: string[] = [];
    let currentUserRequests: string[] = [];

    const currentUserFromFirestore = firestoreUsers.find((u) => u.id === currentUserId);
    const currentUserFromRegistry = userRegistry.get(currentUserId);
    const currentUserData = currentUserFromFirestore || currentUserFromRegistry;

    if (currentUserData) {
      currentUserFriends = currentUserData.friends || [];
      currentUserFollowing = currentUserData.following || [];
      currentUserRequests = currentUserData.friendRequests || [];
    }

    const results = sourceUsers
      .filter((user) => {
        if (user.id === currentUserId) return false;
        // If listing all (empty search), return everyone
        if (isListAll) return true;
        // Otherwise filter by name or email
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
        hasPendingRequest: currentUserRequests.includes(user.id) || (user.friendRequests || []).includes(currentUserId) || false,
      }))
      .slice(0, isListAll ? 50 : 10);

    return NextResponse.json({
      ok: true,
      users: results,
      source: firestoreUsers.length > 0 ? "firestore" : "registry",
      totalUsers: sourceUsers.length,
    });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
