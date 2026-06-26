import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { userRegistry, fetchAllUsersFromFirestore, FIRESTORE_BASE } from "../register-user/route";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "task" | "note" | "schedule" | "friend";
  meta?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query, currentUserId, idToken } = await req.json();

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ ok: true, results: { tasks: [], notes: [], schedules: [], friends: [] } });
    }

    const term = query.toLowerCase().trim();

    // Run searches in parallel
    const [taskResults, noteResults, scheduleResults, friendResults] = await Promise.all([
      searchTasks(term),
      searchNotes(term),
      searchSchedules(term),
      searchFriends(term, currentUserId, idToken),
    ]);

    return NextResponse.json({
      ok: true,
      results: {
        tasks: taskResults,
        notes: noteResults,
        schedules: scheduleResults,
        friends: friendResults,
      },
      total: taskResults.length + noteResults.length + scheduleResults.length + friendResults.length,
    });
  } catch (err) {
    console.error("[global-search] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function searchTasks(term: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try Firestore via Admin SDK
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("tasks").limit(50).get();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const title = data.title || "";
        const content = data.content || "";
        const deadline = data.deadline || "";
        if (title.toLowerCase().includes(term) || content.toLowerCase().includes(term) || deadline.toLowerCase().includes(term)) {
          results.push({
            id: docSnap.id,
            title,
            subtitle: content ? content.slice(0, 60) : undefined,
            type: "task",
            meta: deadline ? `Due: ${deadline}` : undefined,
          });
        }
      });
      return results;
    } catch {}
  }

  // Fallback: localStorage is client-side, can't search server-side
  return results;
}

async function searchNotes(term: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("notes").limit(50).get();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const title = data.title || "";
        const content = data.fullContent || data.content || "";
        const category = data.category || "";
        if (title.toLowerCase().includes(term) || content.toLowerCase().includes(term) || category.toLowerCase().includes(term)) {
          results.push({
            id: docSnap.id,
            title,
            subtitle: content ? content.slice(0, 60) + "..." : undefined,
            type: "note",
            meta: category || undefined,
          });
        }
      });
      return results;
    } catch {}
  }

  return results;
}

async function searchSchedules(term: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (adminDb) {
    try {
      const snapshot = await adminDb.collection("events").limit(50).get();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const title = data.title || "";
        const location = data.location || "";
        const date = data.date || "";
        if (title.toLowerCase().includes(term) || location.toLowerCase().includes(term) || date.toLowerCase().includes(term)) {
          results.push({
            id: docSnap.id,
            title,
            subtitle: location ? `at ${location}` : undefined,
            type: "schedule",
            meta: date,
          });
        }
      });
      return results;
    } catch {}
  }

  return results;
}

async function searchFriends(term: string, currentUserId: string, idToken: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try Firestore via Admin SDK
  let allUsers: ReturnType<typeof Array.from> = [];
  if (idToken) {
    const firestoreUsers = await fetchAllUsersFromFirestore(idToken);
    allUsers = firestoreUsers;
  } else {
    allUsers = Array.from(userRegistry.values());
  }

  for (const user of allUsers as Array<{ id: string; name: string; email: string; university: string }>) {
    if (user.id === currentUserId) continue;
    if (user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term) || (user.university || "").toLowerCase().includes(term)) {
      results.push({
        id: user.id,
        title: user.name,
        subtitle: user.email,
        type: "friend",
        meta: user.university || undefined,
      });
    }
  }

  return results.slice(0, 10);
}
