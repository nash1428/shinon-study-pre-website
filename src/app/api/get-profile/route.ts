import { NextRequest, NextResponse } from "next/server";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/study-space-aeb52/databases/(default)/documents";

export async function POST(req: NextRequest) {
  try {
    const { idToken, uid } = await req.json();

    if (!idToken || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${idToken}`,
      },
    });

    if (res.status === 404) {
      // Profile doesn't exist yet
      return NextResponse.json({ ok: true, profile: null });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("[get-profile] Firestore REST error:", res.status, errText);
      return NextResponse.json({ error: "Firestore read failed", status: res.status }, { status: 500 });
    }

    const data = await res.json();
    const fields = data.fields || {};

    // Convert Firestore fields back to plain object
    const profile: Record<string, string | boolean | null> = {};
    for (const [key, value] of Object.entries(fields)) {
      const v = value as { stringValue?: string; booleanValue?: boolean; nullValue?: null };
      if (v.nullValue !== undefined) {
        profile[key] = null;
      } else if (v.booleanValue !== undefined) {
        profile[key] = v.booleanValue;
      } else if (v.stringValue !== undefined) {
        profile[key] = v.stringValue;
      }
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[get-profile] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
