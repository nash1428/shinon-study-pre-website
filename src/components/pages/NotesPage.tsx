"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText, Plus, Upload, Layers, X, FileUp, HelpCircle,
  Trash2, Mic, Loader2, ListPlus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, Settings2,
  Video, Play, Link2, File, Save, Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentNotes as initialNotes, type NoteItem, type AnkiCard, type QuizQuestion } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/lib/AuthContext";
import { saveNoteToFirestore, saveTaskToFirestore } from "@/lib/notesService";
import RichContent from "@/components/RichContent";

type WidthMode = "standard";

const initialCategories: string[] = [];

export default function NotesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("studyspace_notes", initialNotes);
  const [categories, setCategories] = useLocalStorage<string[]>("studyspace_categories", initialCategories);

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [widthMode, setWidthMode] = useState<WidthMode>("standard");
  const [newCategory, setNewCategory] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // Multi-file attachments (PDF, PPTX, Video file, Video URL)
  interface Attachment {
    id: string;
    name: string;
    type: "pdf" | "pptx" | "video" | "url";
    data?: string; // base64 data URL for files
    url?: string;  // URL for video links
    size?: string;
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [pdfText, setPdfText] = useState<string>("");

  // Full-width editor mode
  const [fullWidthEditor, setFullWidthEditor] = useState(false);
  const [noteViewMode, setNoteViewMode] = useState<"view" | "edit">("view");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save function
  const autoSave = useCallback((noteId: number, updatedFields: Partial<NoteItem>) => {
    // Clear previous timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    setAutoSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(async () => {
      // Update localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("studyspace_notes") || "[]");
        const updated = existing.map((n: NoteItem) => n.id === noteId ? { ...n, ...updatedFields } : n);
        localStorage.setItem("studyspace_notes", JSON.stringify(updated));
      } catch {}

      // Save to Firestore
      if (user) {
        try {
          const allNotes = JSON.parse(localStorage.getItem("studyspace_notes") || "[]");
          const note = allNotes.find((n: NoteItem) => n.id === noteId);
          if (note) await saveNoteToFirestore(user.uid, note);
        } catch {}
      }

      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500); // Save 1.5 seconds after typing stops
  }, [user]);

  // Update note field and trigger auto-save
  const updateNoteField = (noteId: number, field: string, value: string) => {
    setNotes(notes.map((n) => n.id === noteId ? { ...n, [field]: value } : n));
    autoSave(noteId, { [field]: value });
  };

  // Flashcard deck state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Category management
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

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

  // All categories for display (with "All" prepended)
  const allCategories = ["All", ...categories];

  // Filter notes by category
  const filteredNotes = activeCategory === "All"
    ? notes
    : notes.filter((n) => (n.category || "") === activeCategory);

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle("");
    setNewBody("");
    setNewCategory("");
    setAttachments([]);
    setVideoUrl("");
    setShowVideoUrlInput(false);
    setPdfText("");
    setInlineTaskTitle("");
    setInlineTaskDeadline("");
  };

  // Category management functions
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) return;
    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName("");
  };

  const handleStartEditCategory = (cat: string) => {
    setEditingCategory(cat);
    setEditingCategoryName(cat);
  };

  const handleSaveEditCategory = () => {
    if (!editingCategoryName.trim() || !editingCategory) return;
    if (categories.includes(editingCategoryName.trim())) {
      setEditingCategory(null);
      return;
    }
    const updated = categories.map((c) => (c === editingCategory ? editingCategoryName.trim() : c));
    setCategories(updated);
    // Update notes that used the old category name
    setNotes(notes.map((n) => (n.category === editingCategory ? { ...n, category: editingCategoryName.trim() } : n)));
    if (activeCategory === editingCategory) setActiveCategory(editingCategoryName.trim());
    if (newCategory === editingCategory) setNewCategory(editingCategoryName.trim());
    setEditingCategory(null);
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
    // Clear the category from notes that used it
    setNotes(notes.map((n) => (n.category === cat ? { ...n, category: "" } : n)));
    if (activeCategory === cat) setActiveCategory("All");
    if (newCategory === cat) setNewCategory("");
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
    try {
      const existing = JSON.parse(localStorage.getItem("studyspace_tasks_all") || "[]");
      localStorage.setItem("studyspace_tasks_all", JSON.stringify([...existing, newTask]));
    } catch {}
    if (user) {
      saveTaskToFirestore(user.uid, { ...newTask, source: "note_inline" }).catch(() => {});
    }
    setInlineTaskTitle("");
    setInlineTaskDeadline("");
  };

  const handleCreate = (tag: string) => {
    if (!newTitle.trim()) return;
    const firstPdf = attachments.find((a) => a.type === "pdf");
    const newNote: NoteItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tag,
      category: newCategory.trim() || "",
      excerpt: newBody.trim().slice(0, 80) + (newBody.trim().length > 80 ? "..." : "") || (attachments.length > 0 ? `${attachments.length} attachment(s)` : "Click to view..."),
      fullContent: newBody.trim() || undefined,
      fullWidth: true,
      pdfData: firstPdf?.data || undefined,
      pdfName: firstPdf?.name || undefined,
    };
    setNotes([newNote, ...notes]);
    if (user) {
      saveNoteToFirestore(user.uid, newNote).catch(() => {});
    }
    closeModal();
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (expandedNoteId === id) setExpandedNoteId(null);
    if (fullWidthEditor && expandedNoteId === id) {
      setFullWidthEditor(false);
    }
  };

  const handleToggleExpand = (id: number) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (expandedNoteId === id && fullWidthEditor) {
      setFullWidthEditor(false);
      setExpandedNoteId(null);
    } else {
      setExpandedNoteId(id);
      setFullWidthEditor(true);
      setNoteViewMode("view");
      setFlashcardIndex(0);
      setFlashcardFlipped(false);
      setQuizAnswers({});
      setMaterialOpen(false);
      if (note.pdfData) {
        setAttachments([{
          id: `loaded-${note.id}`,
          name: note.pdfName || "PDF",
          type: "pdf" as const,
          data: note.pdfData,
          size: "",
        }]);
        setPdfText(`PDF: ${note.pdfName || "PDF"}`);
      } else {
        setAttachments([]);
        setPdfText("");
      }
    }
  };

  // Flashcard navigation
  const handlePrevCard = () => {
    setFlashcardFlipped(false);
    setFlashcardIndex((prev) => Math.max(0, prev - 1));
  };
  const handleNextCard = () => {
    setFlashcardFlipped(false);
    if (expandedNote?.ankiCards && expandedNote.ankiCards.length > 0) {
      setFlashcardIndex((prev) => Math.min(expandedNote.ankiCards!.length - 1, prev + 1));
    }
  };
  const handleFlipCard = () => setFlashcardFlipped(!flashcardFlipped);

  // Multi-file upload handler (PDF, PPTX, Video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase();
    const fileSize = `${(file.size / 1024).toFixed(0)}KB`;

    let attachmentType: Attachment["type"] = "pdf";
    if (fileExt === "pdf") attachmentType = "pdf";
    else if (fileExt === "pptx" || fileExt === "ppt") attachmentType = "pptx";
    else if (["mp4", "webm", "mov", "avi", "mkv"].includes(fileExt || "")) attachmentType = "video";
    else return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: fileName,
        type: attachmentType,
        data: reader.result as string,
        size: fileSize,
      };
      setAttachments((prev) => [...prev, newAttachment]);
      if (attachmentType === "pdf") {
        setPdfText(`PDF: ${fileName} (${fileSize})`);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be uploaded again
    e.target.value = "";
  };

  // Add video URL
  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) return;
    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: videoUrl.trim(),
      type: "url",
      url: videoUrl.trim(),
    };
    setAttachments((prev) => [...prev, newAttachment]);
    setVideoUrl("");
    setShowVideoUrlInput(false);
  };

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
              setNewBody((prev) => (prev ? prev + "\n\n" + data.summary : data.summary));
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

  // Build uploaded material context from attachments
  const buildUploadedMaterial = () => {
    const pdfAtt = attachments.find((a) => a.type === "pdf");
    if (pdfAtt) {
      return { type: "pdf" as const, extractedText: pdfText, url: undefined };
    }
    const pptxAtt = attachments.find((a) => a.type === "pptx");
    if (pptxAtt) {
      return { type: "powerpoint" as const, extractedText: `PowerPoint: ${pptxAtt.name} (${pptxAtt.size})`, url: undefined };
    }
    const videoAtt = attachments.find((a) => a.type === "video" || a.type === "url");
    if (videoAtt) {
      return { type: "video" as const, extractedText: undefined, url: videoAtt.url || videoAtt.name };
    }
    return undefined;
  };

  // Anki generation — saves to the current note being created
  const handleGenerateAnki = async () => {
    const hasFile = attachments.length > 0;
    const hasNotes = newBody.trim().length > 0;
    if (!hasFile && !hasNotes) return;

    setGeneratingAnki(true);
    try {
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generateType: "anki",
          uploadedMaterial: buildUploadedMaterial(),
          noteContent: newBody,
          count: ankiCount,
        }),
      });
      const data = await res.json();
      if (data.ankiCards?.length > 0) {
        const noteId = Date.now();
        const newNote: NoteItem = {
          id: noteId,
          title: newTitle.trim() || "Untitled Note",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Note",
          category: newCategory,
          excerpt: `${data.ankiCards.length} AI-generated flashcards`,
          fullContent: newBody.trim() || undefined,
          fullWidth: true,
          pdfData: attachments.find((a) => a.type === "pdf")?.data || undefined,
          pdfName: attachments.find((a) => a.type === "pdf")?.name || undefined,
          ankiCards: data.ankiCards,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        if (user) saveNoteToFirestore(user.uid, newNote).catch(() => {});
        // Close modal first, then open the note after state updates
        closeModal();
        // Use setTimeout to ensure notes state has updated before opening
        setTimeout(() => {
          setExpandedNoteId(noteId);
          setFullWidthEditor(true);
          setFlashcardIndex(0);
          setFlashcardFlipped(false);
        }, 100);
      }
    } catch (err) {
      console.error("[generateAnki] Failed:", err);
    }
    setGeneratingAnki(false);
  };

  // Quiz generation — saves to the current note being created
  const handleGenerateQuiz = async () => {
    const hasFile = attachments.length > 0;
    const hasNotes = newBody.trim().length > 0;
    if (!hasFile && !hasNotes) return;

    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generateType: "quiz",
          uploadedMaterial: buildUploadedMaterial(),
          noteContent: newBody,
          count: quizCount,
        }),
      });
      const data = await res.json();
      if (data.quizQuestions?.length > 0) {
        const noteId = Date.now();
        const newNote: NoteItem = {
          id: noteId,
          title: newTitle.trim() || "Untitled Note",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Note",
          category: newCategory,
          excerpt: `${data.quizQuestions.length} AI-generated questions`,
          fullContent: newBody.trim() || undefined,
          fullWidth: true,
          pdfData: attachments.find((a) => a.type === "pdf")?.data || undefined,
          pdfName: attachments.find((a) => a.type === "pdf")?.name || undefined,
          quizQuestions: data.quizQuestions,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        if (user) saveNoteToFirestore(user.uid, newNote).catch(() => {});
        closeModal();
        setTimeout(() => {
          setExpandedNoteId(noteId);
          setFullWidthEditor(true);
          setFlashcardIndex(0);
          setFlashcardFlipped(false);
        }, 100);
      }
    } catch (err) {
      console.error("[generateQuiz] Failed:", err);
    }
    setGeneratingQuiz(false);
  };

  const expandedNote = expandedNoteId ? notes.find((n) => n.id === expandedNoteId) : null;

  // ====== FULL WIDTH NOTE VIEW (View mode → Edit mode) ======
  if (fullWidthEditor && expandedNote) {
    const currentCard = expandedNote.ankiCards?.[flashcardIndex];

    return (
      <div className="fixed inset-0 z-[70] bg-ivory overflow-y-auto" style={{ marginLeft: "var(--sidebar-width, 16rem)" }}>
        <div className="mx-auto max-w-6xl px-8 py-8">
          {/* Top bar: Back + View/Edit toggle + Auto-save */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => { setFullWidthEditor(false); setExpandedNoteId(null); setNoteViewMode("view"); }}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-ink shadow-[var(--shadow-soft)] transition-colors hover:bg-ivory-warm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Notes
            </button>
            <div className="flex items-center gap-3">
              {noteViewMode === "edit" && (
                <div className="flex items-center gap-1.5 text-xs">
                  {autoSaveStatus === "saving" && <span className="flex items-center gap-1 text-ink-muted"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
                  {autoSaveStatus === "saved" && <span className="flex items-center gap-1 text-moss"><Check className="h-3 w-3" /> Saved</span>}
                  {autoSaveStatus === "idle" && <span className="flex items-center gap-1 text-ink-muted/50"><Save className="h-3 w-3" /> Auto-save</span>}
                </div>
              )}
              {/* View / Edit toggle */}
              <div className="flex rounded-xl border border-ivory-deep overflow-hidden">
                <button
                  onClick={() => setNoteViewMode("view")}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${noteViewMode === "view" ? "bg-moss text-white" : "bg-white text-ink-muted hover:bg-ivory-warm"}`}
                >
                  View
                </button>
                <button
                  onClick={() => setNoteViewMode("edit")}
                  className={`flex items-center gap-1 px-4 py-2 text-xs font-medium transition-colors ${noteViewMode === "edit" ? "bg-moss text-white" : "bg-white text-ink-muted hover:bg-ivory-warm"}`}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
              <button
                onClick={() => { handleDeleteNote(expandedNote.id); setFullWidthEditor(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-500"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ====== NOTE TITLE (shared) ====== */}
          <div className="mb-2">
            {noteViewMode === "edit" ? (
              <input
                type="text"
                value={expandedNote.title}
                onChange={(e) => updateNoteField(expandedNote.id, "title", e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-ink focus:outline-none border-b-2 border-transparent focus:border-moss/30 transition-colors px-0 py-1"
                placeholder="Note title..."
              />
            ) : (
              <h1 className="text-3xl font-bold text-ink">{expandedNote.title}</h1>
            )}
          </div>

          {/* Metadata row */}
          <div className="mb-6 flex items-center gap-3 text-xs text-ink-muted">
            <FileText className="h-3 w-3" />
            {expandedNote.date}
            {noteViewMode === "edit" ? (
              <select
                value={expandedNote.category || ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    const newCat = prompt("Enter new category name:");
                    if (newCat && newCat.trim() && !categories.includes(newCat.trim())) {
                      setCategories([...categories, newCat.trim()]);
                      updateNoteField(expandedNote.id, "category", newCat.trim());
                    }
                  } else {
                    updateNoteField(expandedNote.id, "category", e.target.value);
                  }
                }}
                className="rounded-lg border border-ivory-deep bg-white px-2 py-1 text-xs text-ink focus:border-moss/30 focus:outline-none"
              >
                <option value="">No category</option>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                <option value="__new__">+ Add new category...</option>
              </select>
            ) : (
              expandedNote.category && <span className="rounded-full bg-ivory-warm px-2 py-0.5 text-[9px]">{expandedNote.category}</span>
            )}
            {expandedNote.ankiCards && expandedNote.ankiCards.length > 0 && (
              <span className="rounded-full bg-moss/5 px-2 py-0.5 text-[9px] text-moss">{expandedNote.ankiCards.length} cards</span>
            )}
            {expandedNote.quizQuestions && expandedNote.quizQuestions.length > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] text-blue-500">{expandedNote.quizQuestions.length} quiz</span>
            )}
          </div>

          {/* ====== VIEW MODE: Split-screen layout ====== */}
          {noteViewMode === "view" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Materials + Note Content (read-only) */}
              <div className="space-y-4">
                {/* PDF / Materials — collapsible */}
                {expandedNote.pdfData && (
                  <div className="rounded-xl border border-ivory-deep/40 overflow-hidden">
                    <button
                      onClick={() => setMaterialOpen(!materialOpen)}
                      className="w-full bg-red-50 px-3 py-2.5 text-xs font-medium text-red-500 flex items-center justify-between hover:bg-red-100 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileUp className="h-3.5 w-3.5" /> {expandedNote.pdfName || "PDF Document"}
                      </span>
                      {materialOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {materialOpen && (
                      <iframe src={expandedNote.pdfData} className="h-[500px] w-full" title={expandedNote.pdfName || "PDF"} />
                    )}
                  </div>
                )}

                {/* Attachments from edit mode */}
                {noteViewMode === "view" && attachments.length > 0 && !expandedNote.pdfData && (
                  <div className="rounded-xl border border-ivory-deep/40 overflow-hidden">
                    {attachments.map((att) => (
                      <div key={att.id} className="px-3 py-2 flex items-center gap-2 border-b border-ivory-deep/30 last:border-0">
                        {att.type === "pdf" && <FileUp className="h-4 w-4 text-red-400" />}
                        {att.type === "pptx" && <File className="h-4 w-4 text-orange-500" />}
                        {att.type === "video" && <Video className="h-4 w-4 text-blue-500" />}
                        <span className="flex-1 truncate text-xs text-ink">{att.name}</span>
                        <button onClick={() => setPreviewAttachment(att)} className="flex items-center gap-1 text-xs text-moss hover:text-moss-dark">
                          <Play className="h-3 w-3" /> Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note content (read-only, rendered) */}
                {expandedNote.fullContent ? (
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Note Content</h3>
                    <RichContent content={expandedNote.fullContent} />
                  </div>
                ) : (
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40 text-center">
                    <p className="text-sm text-ink-muted italic">No content yet. Click "Edit" to add content.</p>
                  </div>
                )}
              </div>

              {/* RIGHT: Anki Cards + Quiz (interactive) */}
              <div className="space-y-6">
                {/* Anki Flashcards */}
                {expandedNote.ankiCards && expandedNote.ankiCards.length > 0 && currentCard && (
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
                    <h3 className="mb-3 text-sm font-semibold text-ink">Anki Cards ({flashcardIndex + 1} / {expandedNote.ankiCards.length})</h3>
                    <div className="flashcard-container mb-4" style={{ height: "280px" }}>
                      <div
                        className={`flashcard-inner h-full w-full cursor-pointer ${flashcardFlipped ? "flipped" : ""}`}
                        onClick={handleFlipCard}
                      >
                        <div className="flashcard-face rounded-2xl bg-white border-2 border-moss/20 shadow-[var(--shadow-card)] p-6">
                          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide text-moss">Question</span>
                          <p className="text-center text-lg font-medium text-ink px-4">{currentCard.front}</p>
                          <span className="absolute bottom-3 text-[10px] text-ink-muted">Click to flip</span>
                        </div>
                        <div className="flashcard-face flashcard-back rounded-2xl bg-moss/5 border-2 border-moss/30 shadow-[var(--shadow-card)] p-6">
                          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">Answer</span>
                          <p className="text-center text-base text-ink-soft px-4">{currentCard.back}</p>
                          <span className="absolute bottom-3 text-[10px] text-ink-muted">Click to flip back</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={handlePrevCard} disabled={flashcardIndex === 0}
                        className="flex items-center gap-1 rounded-lg border border-ivory-deep px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-ivory-warm disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>
                      <span className="text-xs text-ink-muted">Card {flashcardIndex + 1} of {expandedNote.ankiCards.length}</span>
                      <button onClick={handleNextCard} disabled={flashcardIndex >= (expandedNote.ankiCards.length - 1)}
                        className="flex items-center gap-1 rounded-lg border border-ivory-deep px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-ivory-warm disabled:opacity-30 disabled:cursor-not-allowed">
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Quiz */}
                {expandedNote.quizQuestions && expandedNote.quizQuestions.length > 0 && (
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
                    <h3 className="mb-3 text-sm font-semibold text-ink">Quiz ({expandedNote.quizQuestions.length} questions)</h3>
                    <div className="space-y-4">
                      {expandedNote.quizQuestions.map((q, i) => {
                        const selected = quizAnswers[i];
                        const answered = selected !== undefined;
                        return (
                          <div key={i} className="rounded-xl bg-blue-50/30 p-4">
                            <p className="text-sm font-semibold text-ink mb-2">Q{i + 1}: {q.question}</p>
                            <div className="space-y-1.5">
                              {q.options.map((opt, j) => {
                                const isSelected = selected === j;
                                const isCorrect = j === q.answer;
                                const showResult = answered && (isSelected || isCorrect);
                                return (
                                  <button
                                    key={j}
                                    onClick={() => { if (!answered) setQuizAnswers({ ...quizAnswers, [i]: j }); }}
                                    disabled={answered}
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                                      !answered
                                        ? "bg-white border border-ivory-deep hover:border-moss/30 hover:bg-moss/5 cursor-pointer"
                                        : isCorrect
                                        ? "bg-moss/10 border border-moss text-moss font-medium"
                                        : isSelected
                                        ? "bg-red-50 border border-red-300 text-red-500"
                                        : "bg-white border border-ivory-deep text-ink-soft opacity-60"
                                    }`}
                                  >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                      !answered ? "border-ivory-deep" : isCorrect ? "border-moss bg-moss text-white" : isSelected ? "border-red-400 bg-red-400 text-white" : "border-ivory-deep"
                                    }`}>{String.fromCharCode(65 + j)}</span>
                                    {opt}
                                    {showResult && isCorrect && <Check className="ml-auto h-4 w-4 text-moss" />}
                                    {showResult && isSelected && !isCorrect && <X className="ml-auto h-4 w-4 text-red-500" />}
                                  </button>
                                );
                              })}
                            </div>
                            {answered && (
                              <p className={`mt-2 text-xs ${selected === q.answer ? "text-moss font-medium" : "text-red-500"}`}>
                                {selected === q.answer ? "✓ Correct!" : `✗ Correct answer: ${String.fromCharCode(65 + q.answer)}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Reset quiz button */}
                    {Object.keys(quizAnswers).length > 0 && (
                      <button
                        onClick={() => setQuizAnswers({})}
                        className="mt-3 text-xs text-ink-muted hover:text-ink underline"
                      >
                        Reset answers
                      </button>
                    )}
                  </div>
                )}

                {/* Empty state for study tools */}
                {!expandedNote.ankiCards?.length && !expandedNote.quizQuestions?.length && (
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40 text-center">
                    <Layers className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
                    <p className="text-sm text-ink-muted">No study materials yet.</p>
                    <p className="mt-1 text-xs text-ink-muted/60">Click "Edit" to generate Anki cards and quizzes with AI.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ====== EDIT MODE: Inline editing (existing) ====== */
            <>
              {/* 1. File Upload */}
              <div className="mb-4">
                <div onClick={() => pdfInputRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-ivory-deep p-4 text-center transition-colors hover:border-moss/30 hover:bg-moss/5">
                  <FileUp className="mx-auto mb-1 h-6 w-6 text-ink-muted" />
                  <p className="text-[11px] text-ink-muted">Add PDF, PowerPoint, or Video</p>
                </div>
                {attachments.map((att) => (
                  <div key={att.id} className="mt-2 flex items-center gap-2 rounded-lg bg-ivory-warm/40 px-3 py-2">
                    {att.type === "pdf" && <FileUp className="h-4 w-4 text-red-400" />}
                    {att.type === "pptx" && <File className="h-4 w-4 text-orange-500" />}
                    {att.type === "video" && <Video className="h-4 w-4 text-blue-500" />}
                    <span className="flex-1 truncate text-xs text-ink">{att.name}</span>
                    <button onClick={() => setPreviewAttachment(att)} className="text-ink-muted hover:text-moss"><Play className="h-3 w-3" /></button>
                    <button onClick={() => handleRemoveAttachment(att.id)} className="text-ink-muted hover:text-red-500"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {expandedNote.pdfData && !attachments.find(a => a.data === expandedNote.pdfData) && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50/40 px-3 py-2">
                    <FileUp className="h-4 w-4 text-red-400" />
                    <span className="flex-1 truncate text-xs text-ink">{expandedNote.pdfName || "PDF"}</span>
                    <button onClick={() => setPreviewAttachment({ id: expandedNote.id.toString(), name: expandedNote.pdfName || "PDF", type: "pdf", data: expandedNote.pdfData })} className="text-ink-muted hover:text-moss"><Play className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              {/* 2. AI Generation buttons */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1 rounded-xl border border-moss/20 bg-moss/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-moss" />
                      <span className="text-[11px] font-medium text-ink">Anki Cards (AI)</span>
                    </div>
                    <input type="number" min={1} max={20} value={ankiCount}
                      onChange={(e) => setAnkiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-10 rounded-md border border-ivory-deep bg-white px-1 py-0.5 text-[10px] text-ink focus:border-moss/30 focus:outline-none" />
                  </div>
                  <button onClick={async () => {
                    setGeneratingAnki(true);
                    try {
                      const res = await fetch("/api/generate-study-materials", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ generateType: "anki", uploadedMaterial: buildUploadedMaterial(), noteContent: expandedNote.fullContent || "", count: ankiCount }),
                      });
                      const data = await res.json();
                      console.log("[generateAnki edit] Response:", data.ankiCards?.length, "cards");
                      if (data.ankiCards?.length > 0) {
                        setNotes(prevNotes => prevNotes.map((n) => n.id === expandedNote.id ? { ...n, ankiCards: data.ankiCards } : n));
                        if (user) {
                          saveNoteToFirestore(user.uid, { ...expandedNote, ankiCards: data.ankiCards }).catch(() => {});
                        }
                        setFlashcardIndex(0);
                        setFlashcardFlipped(false);
                        setNoteViewMode("view");
                      }
                    } catch (err) { console.error("[generateAnki]", err); }
                    setGeneratingAnki(false);
                  }} disabled={(!expandedNote.fullContent?.trim() && attachments.length === 0) || generatingAnki}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-moss px-2 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                    {generatingAnki ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                    {generatingAnki ? "Generating..." : `Generate ${ankiCount}`}
                  </button>
                </div>
                <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium text-ink">Quiz (AI)</span>
                    </div>
                    <input type="number" min={1} max={20} value={quizCount}
                      onChange={(e) => setQuizCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-10 rounded-md border border-ivory-deep bg-white px-1 py-0.5 text-[10px] text-ink focus:border-blue-300 focus:outline-none" />
                  </div>
                  <button onClick={async () => {
                    setGeneratingQuiz(true);
                    try {
                      const res = await fetch("/api/generate-study-materials", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ generateType: "quiz", uploadedMaterial: buildUploadedMaterial(), noteContent: expandedNote.fullContent || "", count: quizCount }),
                      });
                      const data = await res.json();
                      console.log("[generateQuiz edit] Response:", data.quizQuestions?.length, "questions");
                      if (data.quizQuestions?.length > 0) {
                        setNotes(prevNotes => prevNotes.map((n) => n.id === expandedNote.id ? { ...n, quizQuestions: data.quizQuestions } : n));
                        if (user) {
                          saveNoteToFirestore(user.uid, { ...expandedNote, quizQuestions: data.quizQuestions }).catch(() => {});
                        }
                        setQuizAnswers({});
                        setNoteViewMode("view");
                      }
                    } catch (err) { console.error("[generateQuiz]", err); }
                    setGeneratingQuiz(false);
                  }} disabled={(!expandedNote.fullContent?.trim() && attachments.length === 0) || generatingQuiz}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-500 px-2 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50">
                    {generatingQuiz ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3 w-3" />}
                    {generatingQuiz ? "Generating..." : `Generate ${quizCount}`}
                  </button>
                </div>
              </div>

              {/* 3. Note Content — inline editable */}
              <div className="mb-6">
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                  <span>Note content</span>
                  <span className="text-[10px] text-ink-muted/50">Supports $math$ and ```mermaid graphs</span>
                </label>
                <textarea
                  value={expandedNote.fullContent || ""}
                  onChange={(e) => {
                    updateNoteField(expandedNote.id, "fullContent", e.target.value);
                    const excerpt = e.target.value.trim().slice(0, 80) + (e.target.value.trim().length > 80 ? "..." : "");
                    setNotes(notes.map((n) => n.id === expandedNote.id ? { ...n, fullContent: e.target.value, excerpt } : n));
                  }}
                  placeholder="Type your note content here..."
                  rows={10}
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10 resize-y min-h-[200px] font-mono"
                />
                {expandedNote.fullContent && (
                  <div className="mt-3 rounded-xl bg-ivory-warm/30 p-4 border border-ivory-deep/30">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Preview</p>
                    <RichContent content={expandedNote.fullContent} />
                  </div>
                )}
              </div>

              {/* 4. Add Task */}
              <div className="rounded-xl border border-ivory-deep bg-ivory-warm/20 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <ListPlus className="h-3.5 w-3.5" /> Add Task
                </label>
                <div className="flex gap-2">
                  <input type="text" value={inlineTaskTitle} onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInlineTask()} placeholder="Task title..."
                    className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                  <input type="date" value={inlineTaskDeadline} onChange={(e) => setInlineTaskDeadline(e.target.value)}
                    className="rounded-lg border border-ivory-deep bg-white px-2 py-2 text-xs text-ink-soft focus:outline-none" />
                  <button onClick={handleAddInlineTask} disabled={!inlineTaskTitle.trim()}
                    className="flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ====== NORMAL NOTES LIST VIEW ======
  return (
    <div className="page-enter">
      <input ref={pdfInputRef} type="file" accept=".pdf,.pptx,.ppt,.mp4,.webm,.mov,.avi,.mkv" onChange={handleFileUpload} className="hidden" />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("notes.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("notes.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Category manager button */}
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              showCategoryManager ? "border-moss/30 bg-moss/5 text-moss" : "border-ivory-deep text-ink-soft hover:bg-ivory-warm/50"
            }`}
            title="Manage categories"
          >
            <Settings2 className="h-4 w-4" />
            Categories
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-moss-dark">
            <Plus className="h-4 w-4" /> New Note
          </button>
        </div>
      </div>

      {/* Category Manager Panel */}
      {showCategoryManager && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] border border-ivory-deep/40">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Manage Categories</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                {editingCategory === cat ? (
                  <>
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEditCategory()}
                      className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-1.5 text-sm text-ink focus:border-moss/30 focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleSaveEditCategory} className="flex h-7 w-7 items-center justify-center rounded-lg bg-moss text-white hover:bg-moss-dark">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 rounded-lg bg-ivory-warm/40 px-3 py-1.5 text-sm text-ink">{cat}</span>
                    <span className="text-[10px] text-ink-muted">{notes.filter((n) => (n.category || "General") === cat).length} notes</span>
                    <button onClick={() => handleStartEditCategory(cat)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-moss/5 hover:text-moss">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Add new category */}
          <div className="mt-3 flex gap-2 border-t border-ivory-deep/40 pt-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="New category name..."
              className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      )}

      {/* Category tabs — Notion-database style, synced with categories */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-ivory-deep/40 pb-3">
        {allCategories.map((cat) => (
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
                  {note.ankiCards?.length ? `${note.ankiCards.length} flashcards` : note.quizQuestions?.length ? `${note.quizQuestions.length} quiz questions` : note.excerpt}
                </p>
              </div>
            </div>

            <p className="mt-2 text-[10px] text-moss">Click to open →</p>

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
            className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-[var(--shadow-float)] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">New Note</h2>
              <div className="flex items-center gap-2">
                <button onClick={closeModal} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1. Title + Category */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Note title</label>
                  <input type="text" autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Chapter 3 Review"
                    className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                </div>
                <div className="w-40">
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Category</label>
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Type or select..."
                    list="category-list" className="w-full rounded-xl border border-ivory-deep bg-white px-3 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                  <datalist id="category-list">
                    {categories.map((cat) => (<option key={cat} value={cat} />))}
                  </datalist>
                </div>
              </div>

              {/* 2. File Upload (PDF, PPTX, Video) */}
              <div>
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-ivory-deep p-4 text-center transition-colors hover:border-moss/30 hover:bg-moss/5"
                >
                  <FileUp className="mx-auto mb-1 h-6 w-6 text-ink-muted" />
                  <p className="text-[11px] text-ink-muted">Click to upload PDF, PowerPoint, or Video</p>
                  <p className="mt-0.5 text-[10px] text-ink-muted/60">.pdf, .pptx, .mp4, .webm</p>
                </div>

                {/* Video URL input toggle */}
                <button
                  onClick={() => setShowVideoUrlInput(!showVideoUrlInput)}
                  className="mt-2 flex items-center gap-1 text-[10px] text-moss hover:text-moss-dark"
                >
                  <Link2 className="h-3 w-3" /> Add video URL instead
                </button>
                {showVideoUrlInput && (
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddVideoUrl()}
                      placeholder="https://youtube.com/... or video URL"
                      className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                    <button onClick={handleAddVideoUrl} disabled={!videoUrl.trim()}
                      className="flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                )}

                {/* Attachment list */}
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((att) => (
                      <div key={att.id} className="group flex items-center gap-2 rounded-lg bg-ivory-warm/40 px-3 py-2">
                        {att.type === "pdf" && <FileUp className="h-4 w-4 shrink-0 text-red-400" />}
                        {att.type === "pptx" && <File className="h-4 w-4 shrink-0 text-orange-500" />}
                        {att.type === "video" && <Video className="h-4 w-4 shrink-0 text-blue-500" />}
                        {att.type === "url" && <Link2 className="h-4 w-4 shrink-0 text-blue-500" />}
                        <span className="flex-1 truncate text-xs text-ink">{att.name}</span>
                        {att.size && <span className="text-[10px] text-ink-muted">{att.size}</span>}
                        <button
                          onClick={() => setPreviewAttachment(att)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:bg-moss/5 hover:text-moss"
                          title="Preview"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-500"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. AI Generation buttons — horizontal row */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-moss/20 bg-moss/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-moss" />
                      <span className="text-[11px] font-medium text-ink">Anki Cards (AI)</span>
                    </div>
                    <input type="number" min={1} max={20} value={ankiCount}
                      onChange={(e) => setAnkiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-10 rounded-md border border-ivory-deep bg-white px-1 py-0.5 text-[10px] text-ink focus:border-moss/30 focus:outline-none" />
                  </div>
                  <button onClick={handleGenerateAnki} disabled={(!newBody.trim() && attachments.length === 0) || generatingAnki}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-moss px-2 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                    {generatingAnki ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                    {generatingAnki ? "..." : `Generate ${ankiCount}`}
                  </button>
                </div>
                <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium text-ink">Quiz (AI)</span>
                    </div>
                    <input type="number" min={1} max={20} value={quizCount}
                      onChange={(e) => setQuizCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="w-10 rounded-md border border-ivory-deep bg-white px-1 py-0.5 text-[10px] text-ink focus:border-blue-300 focus:outline-none" />
                  </div>
                  <button onClick={handleGenerateQuiz} disabled={(!newBody.trim() && attachments.length === 0) || generatingQuiz}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-500 px-2 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50">
                    {generatingQuiz ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3 w-3" />}
                    {generatingQuiz ? "..." : `Generate ${quizCount}`}
                  </button>
                </div>
              </div>

              {/* 4. Note Content */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                  <span>Note content</span>
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
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Type your note content here, or use Audio Summary to generate from audio..."
                  rows={6}
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10 resize-y min-h-[160px]"
                />
              </div>

              {/* 5. Add Task */}
              <div className="rounded-xl border border-ivory-deep bg-ivory-warm/20 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <ListPlus className="h-3.5 w-3.5" /> Add Task
                </label>
                <div className="flex gap-2">
                  <input type="text" value={inlineTaskTitle} onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInlineTask()} placeholder="Task title..."
                    className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10" />
                  <input type="date" value={inlineTaskDeadline} onChange={(e) => setInlineTaskDeadline(e.target.value)}
                    className="rounded-lg border border-ivory-deep bg-white px-2 py-2 text-xs text-ink-soft focus:outline-none" />
                  <button onClick={handleAddInlineTask} disabled={!inlineTaskTitle.trim()}
                    className="flex items-center gap-1 rounded-lg bg-moss px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>

              <button onClick={() => handleCreate("Note")} disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-moss py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-white p-4 shadow-[var(--shadow-float)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{previewAttachment.name}</h3>
              <button onClick={() => setPreviewAttachment(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* PDF viewer */}
            {previewAttachment.type === "pdf" && previewAttachment.data && (
              <iframe src={previewAttachment.data} className="h-[600px] w-full rounded-xl border border-ivory-deep" title={previewAttachment.name} />
            )}

            {/* PPTX viewer — show as download link (can't render inline) */}
            {previewAttachment.type === "pptx" && previewAttachment.data && (
              <div className="flex flex-col items-center py-12">
                <File className="mb-3 h-12 w-12 text-orange-500" />
                <p className="mb-2 text-sm text-ink-muted">PowerPoint files can't be previewed inline.</p>
                <a href={previewAttachment.data} download={previewAttachment.name}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600">
                  <FileUp className="h-4 w-4" /> Download {previewAttachment.name}
                </a>
              </div>
            )}

            {/* Video file player */}
            {previewAttachment.type === "video" && previewAttachment.data && (
              <video controls className="h-[600px] w-full rounded-xl border border-ivory-deep">
                <source src={previewAttachment.data} />
              </video>
            )}

            {/* Video URL player (YouTube or direct link) */}
            {previewAttachment.type === "url" && previewAttachment.url && (
              <div className="flex flex-col items-center">
                {previewAttachment.url.includes("youtube.com") || previewAttachment.url.includes("youtu.be") ? (
                  <iframe
                    src={previewAttachment.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    className="h-[600px] w-full rounded-xl border border-ivory-deep"
                    title={previewAttachment.name}
                    allowFullScreen
                  />
                ) : (
                  <video controls className="h-[600px] w-full rounded-xl border border-ivory-deep">
                    <source src={previewAttachment.url} />
                  </video>
                )}
                <a href={previewAttachment.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs text-moss hover:text-moss-dark">
                  <Link2 className="h-3 w-3" /> Open original link
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
