import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/study-space-aeb52/databases/(default)/documents";

export async function POST(req: NextRequest) {
  try {
    const { idToken, uid } = await req.json();

    if (!idToken || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try Admin SDK first (bypasses security rules)
    if (adminDb) {
      try {
        const docSnap = await adminDb.collection("users").doc(uid).get();
        if (docSnap.exists) {
          const data = docSnap.data()!;
          const profile: Record<string, string | boolean | null> = {};
          for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined) {
              profile[key] = null;
            } else if (typeof value === "boolean") {
              profile[key] = value;
            } else {
              profile[key] = String(value);
            }
          }
          console.log("[get-profile] Found via Admin SDK for", uid);
          return NextResponse.json({ ok: true, profile });
        }
        // Not found
        return NextResponse.json({ ok: true, profile: null });
      } catch (err) {
        console.warn("[get-profile] Admin SDK failed, trying REST API");
      }
    }

    // Fallback: Firestore REST API with ID token
    const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${idToken}`,
      },
    });

    if (res.status === 404) {
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

    console.log("[get-profile] Found via REST API for", uid);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[get-profile] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to get profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
