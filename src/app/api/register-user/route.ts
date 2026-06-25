import { NextRequest, NextResponse } from "next/server";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/study-space-aeb52/databases/(default)/documents";

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

// In-memory fallback registry
const userRegistry = new Map<string, RegisteredUser>();

/**
 * Fetch all user documents from Firestore via REST API (uses ID token).
 */
async function fetchAllUsersFromFirestore(idToken: string): Promise<RegisteredUser[]> {
  try {
    // Use runQuery to list all documents in the 'users' collection
    const res = await fetch(`${FIRESTORE_BASE}/users`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${idToken}` },
    });

    if (!res.ok) {
      console.warn("[register-user] Firestore list failed:", res.status);
      return [];
    }

    const data = await res.json();
    const docs = data.documents || [];

    return docs.map((doc: { name: string; fields: Record<string, unknown> }) => {
      const fields = doc.fields || {};
      const id = doc.name.split("/").pop() || "";
      return parseFirestoreUser(id, fields);
    });
  } catch (err) {
    console.warn("[register-user] Firestore list error:", err);
    return [];
  }
}

function parseFirestoreUser(id: string, fields: Record<string, unknown>): RegisteredUser {
  const getString = (key: string): string => {
    const v = fields[key] as { stringValue?: string } | undefined;
    return v?.stringValue || "";
  };
  const getBool = (key: string): boolean => {
    const v = fields[key] as { booleanValue?: boolean } | undefined;
    return v?.booleanValue || false;
  };
  const getArray = (key: string): string[] => {
    const v = fields[key] as { arrayValue?: { values?: { stringValue: string }[] } } | undefined;
    if (!v?.arrayValue?.values) return [];
    return v.arrayValue.values.map((item) => item.stringValue).filter(Boolean);
  };

  const avatarField = fields["avatarUrl"] as { stringValue?: string; nullValue?: unknown } | undefined;
  const avatarUrl = avatarField?.nullValue !== undefined ? null : (avatarField?.stringValue || null);

  return {
    id,
    name: getString("name"),
    email: getString("email"),
    university: getString("university"),
    avatarUrl,
    isPrivate: getBool("isPrivate"),
    followers: getArray("followers"),
    following: getArray("following"),
    friends: getArray("friends"),
    friendRequests: getArray("friendRequests"),
    registeredAt: getString("registeredAt") || getString("updatedAt"),
  };
}

/**
 * Convert a RegisteredUser to Firestore REST API fields format.
 */
function toFirestoreFields(user: RegisteredUser): Record<string, unknown> {
  const stringField = (v: string) => ({ stringValue: v });
  const arrayField = (arr: string[]) => ({
    arrayValue: { values: arr.map((s) => ({ stringValue: s })) },
  });

  const fields: Record<string, unknown> = {
    id: stringField(user.id),
    name: stringField(user.name),
    email: stringField(user.email),
    university: stringField(user.university),
    isPrivate: { booleanValue: user.isPrivate },
    followers: arrayField(user.followers),
    following: arrayField(user.following),
    friends: arrayField(user.friends),
    friendRequests: arrayField(user.friendRequests),
    registeredAt: stringField(user.registeredAt || new Date().toISOString()),
    updatedAt: stringField(new Date().toISOString()),
  };

  if (user.avatarUrl) {
    fields.avatarUrl = stringField(user.avatarUrl);
  } else {
    fields.avatarUrl = { nullValue: null };
  }

  return fields;
}

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

    // Fetch existing user data from Firestore (to preserve relationships)
    let existingData: RegisteredUser | null = null;
    try {
      const getRes = await fetch(`${FIRESTORE_BASE}/users/${userId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        existingData = parseFirestoreUser(userId, getData.fields || {});
      }
    } catch {}

    // Also check in-memory registry
    const existing = userRegistry.get(userId);

    // Build the user entry (merge existing + new data)
    const userEntry: RegisteredUser = {
      id: userId,
      name: profile?.name || authUser.displayName || existingData?.name || existing?.name || email.split("@")[0] || "Student",
      email,
      university: profile?.university || existingData?.university || existing?.university || "",
      avatarUrl: profile?.avatarUrl ?? existingData?.avatarUrl ?? existing?.avatarUrl ?? null,
      isPrivate: profile?.isPrivate ?? existingData?.isPrivate ?? existing?.isPrivate ?? false,
      followers: existingData?.followers || existing?.followers || [],
      following: existingData?.following || existing?.following || [],
      friends: existingData?.friends || existing?.friends || [],
      friendRequests: existingData?.friendRequests || existing?.friendRequests || [],
      registeredAt: existingData?.registeredAt || existing?.registeredAt || new Date().toISOString(),
    };

    // Save to in-memory registry
    userRegistry.set(userId, userEntry);

    // Save to Firestore via REST API (uses ID token for auth)
    try {
      const fields = toFirestoreFields(userEntry);
      await fetch(`${FIRESTORE_BASE}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fields }),
      });
    } catch (err) {
      console.warn("[register-user] Firestore REST write failed:", err);
    }

    return NextResponse.json({ ok: true, user: { id: userId, name: userEntry.name } });
  } catch (err) {
    console.error("[register-user] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to register user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Export shared functions and types for other routes
export { userRegistry, type RegisteredUser, fetchAllUsersFromFirestore, parseFirestoreUser, toFirestoreFields, FIRESTORE_BASE };
