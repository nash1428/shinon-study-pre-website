"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Lecture {
  id: string;
  day: string;
  dayJp: string;
  name: string;
  time: string;
  location: string;
  color: "sage" | "lavender";
  pdfUrl: string | null;
  tags: string[];
  note: string;
}

export interface Note {
  id: string;
  title: string;
  date: string;
  tag: string;
  excerpt: string;
  lectureId: string;
}

interface StudyContextValue {
  lectures: Lecture[];
  notes: Note[];
  customTags: string[];
  updateLecture: (id: string, updates: Partial<Lecture>) => void;
  addTag: (tag: string) => void;
  addNote: (note: Note) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}

const defaultLectures: Lecture[] = [
  {
    id: "lec-1",
    day: "Monday",
    dayJp: "月曜日",
    name: "Data Structures",
    time: "09:00 AM - 10:30 AM",
    location: "Gates 100",
    color: "sage",
    pdfUrl: null,
    tags: ["CS101"],
    note: "",
  },
  {
    id: "lec-2",
    day: "Monday",
    dayJp: "月曜日",
    name: "Linear Algebra",
    time: "02:00 PM - 03:30 PM",
    location: "Math 340",
    color: "sage",
    pdfUrl: null,
    tags: ["MATH201"],
    note: "",
  },
  {
    id: "lec-3",
    day: "Tuesday",
    dayJp: "火曜日",
    name: "Macroeconomics",
    time: "11:00 AM - 12:30 PM",
    location: "Econ 220",
    color: "lavender",
    pdfUrl: null,
    tags: ["ECON110"],
    note: "",
  },
  {
    id: "lec-4",
    day: "Wednesday",
    dayJp: "水曜日",
    name: "Data Structures — Lab",
    time: "09:00 AM - 10:30 AM",
    location: "Gates B1",
    color: "sage",
    pdfUrl: null,
    tags: ["CS101"],
    note: "",
  },
  {
    id: "lec-5",
    day: "Wednesday",
    dayJp: "水曜日",
    name: "Japanese I",
    time: "04:00 PM - 05:30 PM",
    location: "Lang 112",
    color: "lavender",
    pdfUrl: null,
    tags: ["JPAN101"],
    note: "",
  },
  {
    id: "lec-6",
    day: "Thursday",
    dayJp: "木曜日",
    name: "Macroeconomics",
    time: "11:00 AM - 12:30 PM",
    location: "Econ 220",
    color: "lavender",
    pdfUrl: null,
    tags: ["ECON110"],
    note: "",
  },
  {
    id: "lec-7",
    day: "Thursday",
    dayJp: "木曜日",
    name: "Linear Algebra",
    time: "02:00 PM - 03:30 PM",
    location: "Math 340",
    color: "sage",
    pdfUrl: null,
    tags: ["MATH201"],
    note: "",
  },
  {
    id: "lec-8",
    day: "Friday",
    dayJp: "金曜日",
    name: "Japanese I — Oral Practice",
    time: "04:00 PM - 05:30 PM",
    location: "Lang 112",
    color: "lavender",
    pdfUrl: null,
    tags: ["JPAN101"],
    note: "",
  },
];

const defaultNotes: Note[] = [
  {
    id: "note-1",
    title: "Graph Traversal Algorithms",
    date: "Jun 21",
    tag: "PDF",
    excerpt: "BFS, DFS, Dijkstra's shortest path...",
    lectureId: "",
  },
  {
    id: "note-2",
    title: "GDP & Inflation",
    date: "Jun 20",
    tag: "Anki",
    excerpt: "CPI, real vs nominal GDP, fiscal policy...",
    lectureId: "",
  },
];

const defaultTags = ["CS101", "MATH201", "ECON110", "JPAN101"];

export function StudyProvider({ children }: { children: ReactNode }) {
  const [lectures, setLectures] = useState<Lecture[]>(defaultLectures);
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [customTags, setCustomTags] = useState<string[]>(defaultTags);

  const updateLecture = useCallback((id: string, updates: Partial<Lecture>) => {
    setLectures((prev) =>
      prev.map((lec) => (lec.id === id ? { ...lec, ...updates } : lec))
    );

    // If note was updated, sync to Notes page
    if (updates.note !== undefined) {
      const lecture = lectures.find((l) => l.id === id);
      if (lecture && updates.note.trim()) {
        setNotes((prev) => {
          const existing = prev.find((n) => n.lectureId === id);
          if (existing) {
            return prev.map((n) =>
              n.lectureId === id
                ? { ...n, excerpt: updates.note!.slice(0, 80) + "...", title: lecture.name }
                : n
            );
          }
          return [
            {
              id: `note-${id}`,
              title: lecture.name,
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              tag: lecture.tags[0] || "Note",
              excerpt: updates.note!.slice(0, 80) + "...",
              lectureId: id,
            },
            ...prev,
          ];
        });
      }
    }
  }, [lectures]);

  const addTag = useCallback((tag: string) => {
    setCustomTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }, []);

  const addNote = useCallback((note: Note) => {
    setNotes((prev) => [note, ...prev]);
  }, []);

  return (
    <StudyContext.Provider value={{ lectures, notes, customTags, updateLecture, addTag, addNote }}>
      {children}
    </StudyContext.Provider>
  );
}
