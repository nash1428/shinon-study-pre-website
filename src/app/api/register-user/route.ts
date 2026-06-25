import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Module-level user registry (fallback when Firestore is not available)
interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  followers: string[];
  following: string[];
  friends: string[];
  friendRequests: string[];
  registeredAt: string;
}

const userRegistry = new Map<string, RegisteredUser>();

export async function POST(req: NextRequest) {
  try {
    const { idToken, profile } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "ID token required" }, { status: 400 });
    }

    // Verify the ID token using Firebase Auth REST API
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyALUuuY7LAsJBoAZ5ZkG4IDMpiTxLQCQwo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const verifyData = await verifyRes.json();
    const authUser = verifyData.users?.[0];
    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = authUser.localId;
    const email = authUser.email || "";

    // Build the user entry
    const existing = userRegistry.get(userId);
    const userEntry: RegisteredUser = {
      id: userId,
      name: profile?.name || authUser.displayName || email.split("@")[0] || "Student",
      email,
      university: profile?.university || existing?.university || "",
      avatarUrl: profile?.avatarUrl || existing?.avatarUrl || null,
      isPrivate: profile?.isPrivate ?? existing?.isPrivate ?? false,
      followers: existing?.followers || [],
      following: existing?.following || [],
      friends: existing?.friends || [],
      friendRequests: existing?.friendRequests || [],
      registeredAt: existing?.registeredAt || new Date().toISOString(),
    };

    // Save to in-memory registry
    userRegistry.set(userId, userEntry);

    // Also save to Firestore (now that the database exists)
    if (db) {
      try {
        // Check if user already exists in Firestore (preserve relationship arrays)
        const existingDoc = await getDoc(doc(db, "users", userId));
        const existingData = existingDoc.exists() ? existingDoc.data() : {};

        await setDoc(doc(db, "users", userId), {
          id: userId,
          name: userEntry.name,
          email: userEntry.email,
          university: userEntry.university,
          avatarUrl: userEntry.avatarUrl,
          isPrivate: userEntry.isPrivate,
          followers: existingData.followers || userEntry.followers,
          following: existingData.following || userEntry.following,
          friends: existingData.friends || userEntry.friends,
          friendRequests: existingData.friendRequests || userEntry.friendRequests,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn("[register-user] Firestore write failed, using in-memory only:", err);
      }
    }

    return NextResponse.json({ ok: true, user: { id: userId, name: userEntry.name } });
  } catch (err) {
    console.error("[register-user] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Export the registry for use in search-users route
export { userRegistry, type RegisteredUser };
