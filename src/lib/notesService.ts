import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { NoteItem, CourseTab } from "./data";

export interface FirestoreNote {
  id: string;
  userId: string;
  title: string;
  category: string;
  tag: string;
  excerpt: string;
  fullContent?: string;
  fullWidth?: boolean;
  pdfData?: string;
  pdfName?: string;
  courseTabs?: CourseTab[];
  ankiCards?: NoteItem["ankiCards"];
  quizQuestions?: NoteItem["quizQuestions"];
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreTask {
  id: string;
  userId: string;
  title: string;
  content?: string;
  done: boolean;
  deadline?: string;
  source: "task_tracker" | "note_inline";
  createdAt: string;
}

// ============ NOTES CRUD ============

export async function saveNoteToFirestore(userId: string, note: NoteItem): Promise<void> {
  if (!db) return;
  const noteRef = doc(db, "notes", String(note.id));
  const firestoreNote: FirestoreNote = {
    id: String(note.id),
    userId,
    title: note.title,
    category: note.category || "General",
    tag: note.tag,
    excerpt: note.excerpt,
    fullContent: note.fullContent,
    fullWidth: note.fullWidth,
    pdfData: note.pdfData,
    pdfName: note.pdfName,
    courseTabs: note.courseTabs,
    ankiCards: note.ankiCards,
    quizQuestions: note.quizQuestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(noteRef, firestoreNote, { merge: true });
}

export async function updateNoteInFirestore(noteId: string, updates: Partial<FirestoreNote>): Promise<void> {
  if (!db) return;
  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteNoteFromFirestore(noteId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "notes", noteId));
}

export async function fetchUserNotes(userId: string): Promise<FirestoreNote[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, "notes"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as FirestoreNote);
  } catch (err) {
    console.error("[fetchUserNotes] Failed:", err);
    return [];
  }
}

// ============ TASKS CRUD ============

export async function saveTaskToFirestore(userId: string, task: {
  id: number;
  title: string;
  content?: string;
  done: boolean;
  deadline?: string;
  source?: "task_tracker" | "note_inline";
}): Promise<void> {
  if (!db) return;
  const taskRef = doc(db, "tasks", String(task.id));
  const firestoreTask: FirestoreTask = {
    id: String(task.id),
    userId,
    title: task.title,
    content: task.content,
    done: task.done,
    deadline: task.deadline,
    source: task.source || "task_tracker",
    createdAt: new Date().toISOString(),
  };
  await setDoc(taskRef, firestoreTask, { merge: true });
}

export async function fetchUserTasks(userId: string): Promise<FirestoreTask[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as FirestoreTask);
  } catch (err) {
    console.error("[fetchUserTasks] Failed:", err);
    return [];
  }
}

export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "tasks", taskId));
}
