import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/study-space-aeb52/databases/(default)/documents";

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  showTodayTasks: boolean;
  showTodaySchedule: boolean;
  followers: string[];
  following: string[];
  friends: string[];
  friendRequests: string[];
  incomingRequests: string[];
  outgoingRequests: string[];
  focusCount: number;
  focusMinutes: number;
  totalPoints: number;
  registeredAt: string;
}

// In-memory fallback registry
const userRegistry = new Map<string, RegisteredUser>();

/**
 * Fetch all user documents from Firestore via Admin SDK (bypasses security rules).
 */
async function fetchAllUsersFromFirestore(idToken: string): Promise<RegisteredUser[]> {
  // Try Admin SDK first (bypasses security rules)
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("users").limit(50).get();
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          email: data.email || "",
          university: data.university || "",
          avatarUrl: data.avatarUrl || null,
          isPrivate: data.isPrivate || false,
          showTodayTasks: data.showTodayTasks ?? true,
          showTodaySchedule: data.showTodaySchedule ?? true,
          followers: data.followers || [],
          following: data.following || [],
          friends: data.friends || [],
          friendRequests: data.friendRequests || [],
          incomingRequests: data.incomingRequests || data.friendRequests || [],
          outgoingRequests: data.outgoingRequests || [],
          focusCount: data.focusCount || 0,
          focusMinutes: data.focusMinutes || 0,
          totalPoints: data.totalPoints || 0,
          registeredAt: data.registeredAt || data.updatedAt || "",
        } as RegisteredUser;
      });
    } catch (err) {
      console.warn("[register-user] Admin SDK fetch failed, trying REST API");
    }
  }

  // Fallback: Firestore REST API with ID token
  if (idToken) {
    try {
      const res = await fetch(`${FIRESTORE_BASE}/users`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        return docs.map((doc: { name: string; fields: Record<string, unknown> }) => {
          return parseFirestoreUser(doc.name.split("/").pop() || "", doc.fields || {});
        });
      }
    } catch {}
  }

  return [];
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
    showTodayTasks: getBool("showTodayTasks") ?? true,
    showTodaySchedule: getBool("showTodaySchedule") ?? true,
    followers: getArray("followers"),
    following: getArray("following"),
    friends: getArray("friends"),
    friendRequests: getArray("friendRequests") || getArray("incomingRequests"),
    incomingRequests: getArray("incomingRequests") || getArray("friendRequests"),
    outgoingRequests: getArray("outgoingRequests"),
    focusCount: parseInt(getString("focusCount")) || 0,
    focusMinutes: parseInt(getString("focusMinutes")) || 0,
    totalPoints: parseInt(getString("totalPoints")) || 0,
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
    showTodayTasks: { booleanValue: user.showTodayTasks },
    showTodaySchedule: { booleanValue: user.showTodaySchedule },
    followers: arrayField(user.followers),
    following: arrayField(user.following),
    friends: arrayField(user.friends),
    friendRequests: arrayField(user.incomingRequests || user.friendRequests || []),
    incomingRequests: arrayField(user.incomingRequests || user.friendRequests || []),
    outgoingRequests: arrayField(user.outgoingRequests || []),
    focusCount: { integerValue: user.focusCount || 0 },
    focusMinutes: { integerValue: user.focusMinutes || 0 },
    totalPoints: { integerValue: user.totalPoints || 0 },
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
      showTodayTasks: profile?.showTodayTasks ?? existingData?.showTodayTasks ?? existing?.showTodayTasks ?? true,
      showTodaySchedule: profile?.showTodaySchedule ?? existingData?.showTodaySchedule ?? existing?.showTodaySchedule ?? true,
      followers: existingData?.followers || existing?.followers || [],
      following: existingData?.following || existing?.following || [],
      friends: existingData?.friends || existing?.friends || [],
      friendRequests: existingData?.incomingRequests || existingData?.friendRequests || existing?.friendRequests || [],
      incomingRequests: existingData?.incomingRequests || existingData?.friendRequests || existing?.friendRequests || [],
      outgoingRequests: existingData?.outgoingRequests || existing?.outgoingRequests || [],
      focusCount: profile?.focusCount ?? existingData?.focusCount ?? existing?.focusCount ?? 0,
      focusMinutes: profile?.focusMinutes ?? existingData?.focusMinutes ?? existing?.focusMinutes ?? 0,
      totalPoints: profile?.totalPoints ?? existingData?.totalPoints ?? existing?.totalPoints ?? 0,
      registeredAt: existingData?.registeredAt || existing?.registeredAt || new Date().toISOString(),
    };

    // Save to in-memory registry
    userRegistry.set(userId, userEntry);

    // Save to Firestore via Admin SDK (bypasses security rules)
    if (adminDb) {
      try {
        await adminDb.collection("users").doc(userId).set({
          id: userId,
          name: userEntry.name,
          email: userEntry.email,
          university: userEntry.university,
          avatarUrl: userEntry.avatarUrl,
          isPrivate: userEntry.isPrivate,
          showTodayTasks: userEntry.showTodayTasks,
          showTodaySchedule: userEntry.showTodaySchedule,
          followers: userEntry.followers,
          following: userEntry.following,
          friends: userEntry.friends,
          friendRequests: userEntry.incomingRequests || userEntry.friendRequests,
          incomingRequests: userEntry.incomingRequests || userEntry.friendRequests,
          outgoingRequests: userEntry.outgoingRequests,
          focusCount: userEntry.focusCount,
          focusMinutes: userEntry.focusMinutes,
          totalPoints: userEntry.totalPoints,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn("[register-user] Admin SDK write failed:", err);
        // Fallback to REST API
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
        } catch {}
      }
    } else {
      // Fallback: REST API with ID token
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
        console.warn("[register-user] REST API write also failed:", err);
      }
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
