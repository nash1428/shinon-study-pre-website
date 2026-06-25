import { NextRequest, NextResponse } from "next/server";

// Module-level user registry (persists while the Node process is running)
// This is a fallback when Firestore is not available
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

    // Register or update the user in the in-memory store
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

    userRegistry.set(userId, userEntry);

    return NextResponse.json({ ok: true, user: { id: userId, name: userEntry.name } });
  } catch (err) {
    console.error("[register-user] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Export the registry for use in search-users route
export { userRegistry, type RegisteredUser };
