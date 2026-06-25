import { NextRequest, NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const { searchTerm, currentUserId } = await req.json();

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ ok: true, users: [] });
    }

    if (!db) {
      console.warn("[search-users] Firestore not configured");
      return NextResponse.json({ ok: true, users: [] });
    }

    const term = searchTerm.toLowerCase().trim();

    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(50));
    const snapshot = await getDocs(q);

    // Fetch current user's data for relationship checks
    let currentUserData: { followers?: string[]; following?: string[]; friends?: string[]; friendRequests?: string[] } = {};
    try {
      const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
      if (currentUserDoc.exists()) {
        const d = currentUserDoc.data();
        currentUserData = {
          followers: d.followers || [],
          following: d.following || [],
          friends: d.friends || [],
          friendRequests: d.friendRequests || [],
        };
      }
    } catch {}

    const results = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const userId = docSnap.id;
        return {
          id: userId,
          name: data.name || "",
          email: data.email || "",
          university: data.university || "",
          avatarUrl: data.avatarUrl || null,
          isPrivate: data.isPrivate || false,
          followers: data.followers || [],
          following: data.following || [],
          friends: data.friends || [],
          friendRequests: data.friendRequests || [],
          // Relationship status from current user's perspective
          isFriend: (currentUserData.friends || []).includes(userId),
          isFollowing: (currentUserData.following || []).includes(userId),
          hasPendingRequest: (currentUserData.friendRequests || []).includes(userId) || (data.friendRequests || []).includes(currentUserId),
        };
      })
      .filter((user) => {
        if (user.id === currentUserId) return false;
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      })
      .slice(0, 10);

    return NextResponse.json({ ok: true, users: results });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
