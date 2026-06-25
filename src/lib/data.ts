export const userData = {
  name: "Shinon",
  university: "Stanford University",
  semester: "Spring 2026 · Semester 4",
};

export const motivationalQuotes = [
  "Small steps every day.",
  "Progress over perfection.",
  "One chapter at a time.",
  "You've got this.",
  "Consistency beats intensity.",
];

export const todaySchedule = [
  {
    time: "09:00 AM",
    course: "Data Structures",
    room: "Gates 100",
    color: "sage",
  },
  {
    time: "11:00 AM",
    course: "Macroeconomics",
    room: "Econ 220",
    color: "lavender",
  },
  {
    time: "02:00 PM",
    course: "Linear Algebra",
    room: "Math 340",
    color: "sage",
  },
  {
    time: "04:00 PM",
    course: "Japanese I",
    room: "Lang 112",
    color: "lavender",
  },
];

export type AnkiCard = {
  front: string;
  back: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
};

export type CourseTab = {
  tabId: string;
  courseName: string;
  content: string;
};

export type NoteItem = {
  id: number;
  title: string;
  date: string;
  tag: string;
  category: string;
  excerpt: string;
  fullContent?: string;
  fullWidth?: boolean;
  pdfData?: string;
  pdfName?: string;
  ankiCards?: AnkiCard[];
  quizQuestions?: QuizQuestion[];
  courseTabs?: CourseTab[];
};

export const recentNotes: NoteItem[] = [
  {
    id: 1,
    title: "Graph Traversal Algorithms",
    date: "Jun 21",
    tag: "PDF",
    category: "Computer Science",
    excerpt: "BFS, DFS, Dijkstra's shortest path...",
  },
  {
    id: 2,
    title: "GDP & Inflation",
    date: "Jun 20",
    tag: "Anki",
    category: "Finance",
    excerpt: "CPI, real vs nominal GDP, fiscal policy...",
  },
  {
    id: 3,
    title: "Eigenvalues & Eigenvectors",
    date: "Jun 19",
    tag: "PDF",
    category: "Mathematics",
    excerpt: "Characteristic polynomial, diagonalization...",
  },
  {
    id: 4,
    title: "Genki Lesson 8 — Kanji",
    date: "Jun 18",
    tag: "Anki",
    category: "Japanese",
    excerpt: "読む, 書く, 勉強, 練習...",
  },
];

export type TaskItem = {
  id: number;
  title: string;
  done: boolean;
  content?: string;
  deadline?: string;
};

export const todayTasks: TaskItem[] = [
  { id: 1, title: "Review BFS/DFS lecture notes", done: false },
  { id: 2, title: "Submit Macro Problem Set 3", done: false },
  { id: 3, title: "Practice Japanese kanji — Lesson 8", done: true },
  { id: 4, title: "Watch Linear Algebra lecture 12", done: false },
];

export const upcomingTasks: TaskItem[] = [
  { id: 5, title: "Data Structures midterm prep", done: false },
  { id: 6, title: "Macro essay outline — due Fri", done: false },
  { id: 7, title: "Japanese oral presentation", done: false },
];

export const recentSearches = [
  "Dijkstra's algorithm",
  "Fiscal policy",
  "Eigenvalues",
  "Genki kanji",
  "Big-O notation",
];
