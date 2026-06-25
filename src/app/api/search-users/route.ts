import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Import the in-memory user registry (fallback when Firestore is unavailable)
import { userRegistry, type RegisteredUser } from "../register-user/route";

export async function POST(req: NextRequest) {
  try {
    const { searchTerm, currentUserId } = await req.json();

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ ok: true, users: [] });
    }

    const term = searchTerm.toLowerCase().trim();

    // Try Firestore first
    let firestoreResults: RegisteredUser[] = [];
    if (db) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(50));
        const snapshot = await getDocs(q);
        firestoreResults = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || "",
            email: data.email || "",
            university: data.university || "",
            avatarUrl: data.avatarUrl || null,
            isPrivate: data.isPrivate || false,
            followers: data.followers || [],
            following: data.following || [],
            friends: data.friends || [],
            friendRequests: data.friendRequests || [],
            registeredAt: "",
          } as RegisteredUser;
        });
      } catch (err) {
        console.warn("[search-users] Firestore query failed, using fallback registry");
      }
    }

    // If Firestore returned nothing, use the in-memory registry
    const sourceUsers = firestoreResults.length > 0
      ? firestoreResults
      : Array.from(userRegistry.values());

    if (sourceUsers.length === 0) {
      return NextResponse.json({
        ok: true,
        users: [],
        message: "No users found. Firestore is not configured — ask your friend to log in so they appear in the registry.",
      });
    }

    // Get current user's relationship data
    const currentUser = userRegistry.get(currentUserId);
    const currentUserFriends: string[] = currentUser?.friends || [];
    const currentUserFollowing: string[] = currentUser?.following || [];
    const currentUserRequests: string[] = currentUser?.friendRequests || [];

    const results = sourceUsers
      .filter((user) => {
        if (user.id === currentUserId) return false;
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
        hasPendingRequest: currentUserRequests.includes(user.id) || user.friendRequests?.includes(currentUserId) || false,
      }))
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      users: results,
      source: firestoreResults.length > 0 ? "firestore" : "registry",
    });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
