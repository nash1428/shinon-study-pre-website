import { NextRequest, NextResponse } from "next/server";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/study-space-aeb52/databases/(default)/documents";

export async function POST(req: NextRequest) {
  try {
    const { idToken, uid, profile } = await req.json();

    if (!idToken || !uid || !profile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert profile to Firestore document format
    const fields: Record<string, { stringValue?: string; booleanValue?: boolean; nullValue?: null }> = {};
    for (const [key, value] of Object.entries(profile)) {
      if (value === null) {
        fields[key] = { nullValue: null };
      } else if (typeof value === "boolean") {
        fields[key] = { booleanValue: value };
      } else {
        fields[key] = { stringValue: String(value) };
      }
    }

    const res = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[save-profile] Firestore REST error:", res.status, errText);
      return NextResponse.json({ error: "Firestore write failed", status: res.status }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-profile] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
