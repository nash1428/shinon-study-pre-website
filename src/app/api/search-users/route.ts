import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, limit } from "firebase/firestore";
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

    // Fetch user profiles from Firestore — we filter client-side since
    // Firestore doesn't support full-text search natively
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(50));
    const snapshot = await getDocs(q);

    const results = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          university: data.university || "",
          avatarUrl: data.avatarUrl || null,
          isPrivate: data.isPrivate || false,
        };
      })
      .filter((user) => {
        // Don't return the current user
        if (user.id === currentUserId) return false;
        // Match by name or email
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      })
      .slice(0, 10); // Limit to 10 results

    return NextResponse.json({ ok: true, users: results });
  } catch (err) {
    console.error("[search-users] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
