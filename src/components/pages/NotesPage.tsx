"use client";

import { useState, useRef } from "react";
import {
  FileText, Plus, Upload, Layers, X, FileUp, HelpCircle,
  AlignJustify, Columns2, Trash2, Mic, Loader2, ListPlus, ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentNotes as initialNotes, type NoteItem, type AnkiCard, type QuizQuestion, type CourseTab } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/lib/AuthContext";
import { saveNoteToFirestore, saveTaskToFirestore } from "@/lib/notesService";

type WidthMode = "standard" | "full";

const defaultCategories = ["All", "Finance", "Computer Science", "Mathematics", "Japanese", "General"];

export default function NotesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("studyspace_notes", initialNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [widthMode, setWidthMode] = useState<WidthMode>("standard");
  const [newCategory, setNewCategory] = useState("General");
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfText, setPdfText] = useState<string>("");
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // Course tabs within note editor
  const [courseTabs, setCourseTabs] = useState<CourseTab[]>([{ tabId: "tab-1", courseName: "General", content: "" }]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [newCourseName, setNewCourseName] = useState("");

  // Inline task
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [inlineTaskDeadline, setInlineTaskDeadline] = useState("");

  // AI feature states
  const [isRecording, setIsRecording] = useState(false);
  const [audioSummarizing, setAudioSummarizing] = useState(false);
  const [generatingAnki, setGeneratingAnki] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [ankiCount, setAnkiCount] = useState(5);
  const [quizCount, setQuizCount] = useState(5);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Categories derived from notes + defaults
  const categories = Array.from(new Set([
    ...defaultCategories,
    ...notes.map((n) => n.category || "General"),
  ]));

  // Filter notes by category
  const filteredNotes = activeCategory === "All"
    ? notes
    : notes.filter((n) => (n.category || "General") === activeCategory);

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle("");
    setNewBody("");
    setWidthMode("standard");
    setNewCategory("General");
    setPdfData(null);
    setPdfName("");
    setPdfText("");
    setCourseTabs([{ tabId: "tab-1", courseName: "General", content: "" }]);
    setActiveTabId("tab-1");
    setInlineTaskTitle("");
    setInlineTaskDeadline("");
  };

  // Course tab management
  const addCourseTab = () => {
    if (!newCourseName.trim()) return;
    const tabId = `tab-${Date.now()}`;
    setCourseTabs([...courseTabs, { tabId, courseName: newCourseName.trim(), content: "" }]);
    setActiveTabId(tabId);
    setNewCourseName("");
  };

  const updateTabContent = (tabId: string, content: string) => {
    setCourseTabs(courseTabs.map((t) => (t.tabId === tabId ? { ...t, content } : t)));
  };

  const removeCourseTab = (tabId: string) => {
    if (courseTabs.length <= 1) return;
    const filtered = courseTabs.filter((t) => t.tabId !== tabId);
    setCourseTabs(filtered);
    if (activeTabId === tabId) setActiveTabId(filtered[0].tabId);
  };

  // Inline task creation — saves to localStorage (Task Tracker) + Firestore
  const handleAddInlineTask = async () => {
    if (!inlineTaskTitle.trim()) return;
    const taskId = Date.now();
    const newTask = {
      id: taskId,
      title: inlineTaskTitle.trim(),
      done: false,
      content: `From note: ${newTitle}`,
      deadline: inlineTaskDeadline || undefined,
    };

    // Save to localStorage (shared with Task Tracker)
    try {
      const existing = JSON.parse(localStorage.getItem("studyspace_tasks_all") || "[]");
      localStorage.setItem("studyspace_tasks_all", JSON.stringify([...existing, newTask]));
    } catch {}

    // Save to Firestore if user is logged in
    if (user) {
      saveTaskToFirestore(user.uid, { ...newTask, source: "note_inline" }).catch(() => {});
    }

    setInlineTaskTitle("");
    setInlineTaskDeadline("");
  };

  const handleCreate = (tag: string) => {
    if (!newTitle.trim()) return;
    const activeTab = courseTabs.find((t) => t.tabId === activeTabId);
    const combinedContent = courseTabs.map((t) => `[${t.courseName}]\n${t.content}`).join("\n\n");
    const newNote: NoteItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tag,
      category: newCategory,
      excerpt: (activeTab?.content || newBody).trim().slice(0, 80) + ((activeTab?.content || newBody).trim().length > 80 ? "..." : "") || (tag === "PDF" ? "PDF lecture notes (click to view)..." : tag === "Anki" ? "Anki card deck..." : "Quiz questions..."),
      fullContent: combinedContent.trim() || newBody.trim() || undefined,
      fullWidth: widthMode === "full",
      pdfData: pdfData || undefined,
      pdfName: pdfName || undefined,
      courseTabs,
    };
    setNotes([newNote, ...notes]);

    // Save to Firestore
    if (user) {
      saveNoteToFirestore(user.uid, newNote).catch(() => {});
    }

    closeModal();
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (expandedNoteId === id) setExpandedNoteId(null);
  };

  const handleToggleExpand = (id: number) => {
    setExpandedNoteId(expandedNoteId === id ? null : id);
  };

  // PDF upload handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfData(reader.result as string);
      setPdfText(`PDF: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
    };
    reader.readAsDataURL(file);
  };

  // Audio recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setAudioSummarizing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1];
            const res = await fetch("/api/audio-summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: base64, mimeType: "audio/webm" }),
            });
            const data = await res.json();
            if (data.summary) {
              const activeTab = courseTabs.find((t) => t.tabId === activeTabId);
              if (activeTab) {
                updateTabContent(activeTabId, activeTab.content ? activeTab.content + "\n\n" + data.summary : data.summary);
              } else {
                setNewBody((prev) => (prev ? prev + "\n\n" + data.summary : data.summary));
              }
            }
            setAudioSummarizing(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch { setAudioSummarizing(false); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { setIsRecording(false); }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Anki generation
  const handleGenerateAnki = async () => {
    setGeneratingAnki(true);
    try {
      const activeTab = courseTabs.find((t) => t.tabId === activeTabId);
      const content = activeTab?.content || newBody;
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, noteContent: content, type: "anki", count: ankiCount }),
      });
      const data = await res.json();
      if (data.ankiCards?.length > 0) {
        const ankiNote: NoteItem = {
          id: Date.now(), title: newTitle.trim() + " — Anki Cards",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Anki", category: newCategory,
          excerpt: `${data.ankiCards.length} AI-generated flashcards`,
          fullContent: data.ankiCards.map((c: AnkiCard) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n"),
          ankiCards: data.ankiCards, fullWidth: true,
        };
        setNotes([ankiNote, ...notes]);
        if (user) saveNoteToFirestore(user.uid, ankiNote).catch(() => {});
      }
    } catch {}
    setGeneratingAnki(false);
  };

  // Quiz generation
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const activeTab = courseTabs.find((t) => t.tabId === activeTabId);
      const content = activeTab?.content || newBody;
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, noteContent: content, type: "quiz", count: quizCount }),
      });
      const data = await res.json();
      if (data.quizQuestions?.length > 0) {
        const quizNote: NoteItem = {
          id: Date.now(), title: newTitle.trim() + " — Quiz",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Quiz", category: newCategory,
          excerpt: `${data.quizQuestions.length} AI-generated questions`,
          fullContent: data.quizQuestions.map((q: QuizQuestion, i: number) => `Q${i + 1}: ${q.question}\n${q.options.map((o: string, j: number) => `  ${j === q.answer ? "✓" : "•"} ${o}`).join("\n")}`).join("\n\n"),
          quizQuestions: data.quizQuestions, fullWidth: true,
        };
        setNotes([quizNote, ...notes]);
        if (user) saveNoteToFirestore(user.uid, quizNote).catch(() => {});
      }
    } catch {}
    setGeneratingQuiz(false);
  };

  const activeTab = courseTabs.find((t) => t.tabId === activeTabId);

  return (
    <div className="page-enter">
      <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("notes.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("notes.subtitle")}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-moss-dark">
          <Plus className="h-4 w-4" /> New Note
        </button>
      </div>

      {/* Category tabs — Notion-database style */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-ivory-deep/40 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === cat
                ? "bg-moss text-white shadow-[var(--shadow-soft)]"
                : "bg-white text-ink-soft hover:bg-moss/5 hover:text-moss"
            }`}
          >
            {cat}
            <span className={`ml-1.5 text-[9px] ${activeCategory === cat ? "text-white/70" : "text-ink-muted"}`}>
              {cat === "All" ? notes.length : notes.filter((n) => (n.category || "General") === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Note cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => handleToggleExpand(note.id)}
            className={`group relative cursor-pointer rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
              note.fullWidth ? "sm:col-span-2 lg:col-span-3" : ""
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <h3 className="text-sm font-semibold text-ink">{note.title}</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  {note.tag === "PDF" && note.pdfData ? "PDF lecture notes (click to view)" : note.excerpt}
                </p>
                {note.courseTabs && note.courseTabs.length > 1 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {note.courseTabs.map((tab) => (
                      <span key={tab.tabId} className="rounded-full bg-ivory-warm px-1.5 py-0.5 text-[9px] text-ink-muted">{tab.courseName}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {expandedNoteId === note.id && (
              <div className="mt-4 border-t border-ivory-deep/30 pt-4" onClick={(e) => e.stopPropagation()}>
                {/* PDF viewer */}
                {note.pdfData && (
                  <div className="mb-3">
                    <button onClick={() => setViewingPdf(viewingPdf === note.id.toString() ? null : note.id.toString())} className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100">
                      <FileUp className="h-3.5 w-3.5" /> {note.pdfName || "View PDF"}
                    </button>
                    {viewingPdf === note.id.toString() && <iframe src={note.pdfData} className="h-[500px] w-full rounded-xl border border-ivory-deep" title={note.pdfName || "PDF"} />}
                  </div>
                )}

                {/* Course tabs content */}
                {note.courseTabs && note.courseTabs.length > 0 ? (
                  <div className="space-y-3">
                    {note.courseTabs.map((tab) => (
                      <div key={tab.tabId}>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-moss">{tab.courseName}</p>
                        <p className="whitespace-pre-wrap text-xs text-ink-soft">{tab.content || "(empty)"}</p>
                      </div>
                    ))}
                  </div>
                ) : note.fullContent ? (
                  <p className="whitespace-pre-wrap text-xs text-ink-soft">{note.fullContent}</p>
                ) : null}

                {/* Anki cards */}
                {note.ankiCards && note.ankiCards.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {note.ankiCards.map((card, i) => (
                      <div key={i} className="rounded-xl bg-ivory-warm/40 p-3">
                        <p className="text-xs font-semibold text-ink">Q: {card.front}</p>
                        <p className="mt-1 text-xs text-ink-soft">A: {card.back}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz */}
                {note.quizQuestions && note.quizQuestions.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {note.quizQuestions.map((q, i) => (
                      <div key={i} className="rounded-xl bg-blue-50/40 p-3">
                        <p className="text-xs font-semibold text-ink">Q{i + 1}: {q.question}</p>
                        <div className="mt-1.5 space-y-1">
                          {q.options.map((opt, j) => (
                            <p key={j} className={`text-xs ${j === q.answer ? "font-medium text-moss" : "text-ink-soft"}`}>
                              {j === q.answer ? "✓ " : "• "}{opt}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!note.fullContent && !note.ankiCards && !note.quizQuestions && !note.pdfData && !note.courseTabs && (
                  <p className="text-xs text-ink-muted italic">This note has no additional content.</p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
              <FileText className="h-3 w-3" /> {note.date}
              {note.category && <span className="ml-2 rounded-full bg-ivory-warm px-2 py-0.5 text-[9px]">{note.category}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* New Note modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={closeModal}>
          <div
            className={`rounded-2xl bg-white p-7 shadow-[var(--shadow-float)] transition-all ${
              widthMode === "full" ? "w-full max-w-5xl" : "w-full max-w-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">New Note</h2>
              <div className="flex items-center gap-2">
                {/* Width toggle: Standard vs Full Width */}
                <button
                  onClick={() => setWidthMode(widthMode === "full" ? "standard" : "full")}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    widthMode === "full"
                      ? "border-sage-300 bg-moss/5 text-moss"
                      : "border-ivory-deep text-ink-muted hover:bg-ivory-warm/50"
                  }`}
                  title={widthMode === "full" ? "Full width (fills right side)" : "Standard width"}
                >
                  {widthMode === "full" ? <AlignJustify className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                  {widthMode === "full" ? "Full Width" : "Standard"}
                </button>
                <button onClick={closeModal} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Title + Category */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Note title</label>
                  <input type="text" autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Chapter 3 Review"
                    className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                </div>
                <div className="w-40">
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-ivory-deep bg-white px-3 py-3 text-sm text-ink focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10">
                    {defaultCategories.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Course Tabs — Notion-style internal tabs */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Course Tabs</label>
                <div className="rounded-xl border border-ivory-deep overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex items-center gap-1 border-b border-ivory-deep bg-ivory-warm/30 px-2 py-1.5">
                    {courseTabs.map((tab) => (
                      <button
                        key={tab.tabId}
                        onClick={() => setActiveTabId(tab.tabId)}
                        className={`group/tab flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          activeTabId === tab.tabId ? "bg-white text-moss shadow-sm" : "text-ink-muted hover:bg-white/50"
                        }`}
                      >
                        {tab.courseName}
                        {courseTabs.length > 1 && (
                          <span
                            onClick={(e) => { e.stopPropagation(); removeCourseTab(tab.tabId); }}
                            className="text-stone-300 hover:text-red-400"
                          >
                            <X className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    ))}
                    {/* Add new tab */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCourseTab()}
                        placeholder="+ Course"
                        className="w-20 rounded-lg border border-ivory-deep bg-white px-2 py-0.5 text-[10px] text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none"
                      />
                    </div>
                  </div>
                  {/* Active tab content */}
                  <textarea
                    value={activeTab?.content || ""}
                    onChange={(e) => updateTabContent(activeTabId, e.target.value)}
                    placeholder={`Write content for ${activeTab?.courseName || "this course"}...`}
                    rows={5}
                    className="w-full border-0 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none resize-y min-h-[120px]"
                  />
                </div>
              </div>

              {/* Audio summary button */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-ink-muted">Audio Summary</label>
                {!isRecording ? (
                  <button onClick={handleStartRecording} disabled={audioSummarizing}
                    className="flex items-center gap-1 rounded-lg bg-moss/10 px-2 py-1 text-[10px] font-medium text-moss transition-colors hover:bg-moss/20 disabled:opacity-50">
                    <Mic className="h-3 w-3" /> {audioSummarizing ? "Summarizing..." : "Record Audio"}
                  </button>
                ) : (
                  <button onClick={handleStopRecording}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-500 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Stop Recording
                  </button>
                )}
              </div>

              {/* PDF upload */}
              <div onClick={() => pdfInputRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-ivory-deep p-4 text-center transition-colors hover:border-moss/30 hover:bg-moss/5">
                {pdfData ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileUp className="h-5 w-5 text-moss" />
                    <span className="text-xs font-medium text-ink">{pdfName}</span>
                    <span className="text-[10px] text-moss">✓ Uploaded</span>
                  </div>
                ) : (
                  <>
                    <FileUp className="mx-auto mb-1 h-6 w-6 text-ink-muted" />
                    <p className="text-[11px] text-ink-muted">Click to upload a Lecture PDF</p>
                  </>
                )}
              </div>

              {/* Inline Task Creator — syncs with Task Tracker */}
              <div className="rounded-xl border border-ivory-deep bg-ivory-warm/20 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <ListPlus className="h-3.5 w-3.5" /> Add Task (syncs with Task Tracker)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInlineTask()}
                    placeholder="Task title..."
                    className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                  />
                  <input
                    type="date"
                    value={inlineTaskDeadline}
                    onChange={(e) => setInlineTaskDeadline(e.target.value)}
                    className="rounded-lg border border-ivory-deep bg-white px-2 py-2 text-xs text-ink-soft focus:outline-none"
                  />
                  <button
                    onClick={handleAddInlineTask}
                    disabled={!inlineTaskTitle.trim()}
                    className="flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>

              {/* AI generation — Anki */}
              <div className="rounded-xl border border-moss/20 bg-moss/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-moss" />
                    <span className="text-xs font-medium text-ink">Generate Anki Cards (AI)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-ink-muted">Count:</label>
                    <input type="number" min={1} max={20} value={ankiCount}
                      onChange={(e) => setAnkiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-12 rounded-md border border-ivory-deep bg-white px-1.5 py-1 text-xs text-ink focus:border-moss/30 focus:outline-none" />
                  </div>
                </div>
                <button onClick={handleGenerateAnki} disabled={!newTitle.trim() || generatingAnki}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-moss px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                  {generatingAnki ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                  {generatingAnki ? "Generating..." : `Generate ${ankiCount} Anki Cards`}
                </button>
              </div>

              {/* AI generation — Quiz */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-ink">Generate Quiz (AI)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-ink-muted">Count:</label>
                    <input type="number" min={1} max={20} value={quizCount}
                      onChange={(e) => setQuizCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-12 rounded-md border border-ivory-deep bg-white px-1.5 py-1 text-xs text-ink focus:border-blue-300 focus:outline-none" />
                  </div>
                </div>
                <button onClick={handleGenerateQuiz} disabled={!newTitle.trim() || generatingQuiz}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50">
                  {generatingQuiz ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5" />}
                  {generatingQuiz ? "Generating..." : `Generate ${quizCount} Quiz Questions`}
                </button>
              </div>

              <button onClick={() => handleCreate("Note")} disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-moss py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
