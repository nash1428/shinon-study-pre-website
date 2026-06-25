"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, Plus, Upload, Layers, X, FileUp, HelpCircle,
  AlignJustify, Columns2, Trash2, Mic, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentNotes as initialNotes, type NoteItem, type AnkiCard, type QuizQuestion } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function NotesPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("studyspace_notes", initialNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [fullWidth, setFullWidth] = useState(true);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfText, setPdfText] = useState<string>("");
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  // AI feature states
  const [isRecording, setIsRecording] = useState(false);
  const [audioSummarizing, setAudioSummarizing] = useState(false);
  const [generatingAnki, setGeneratingAnki] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle("");
    setNewBody("");
    setFullWidth(true);
    setPdfData(null);
    setPdfName("");
    setPdfText("");
  };

  const handleCreate = (tag: string) => {
    if (!newTitle.trim()) return;
    const newNote: NoteItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tag,
      excerpt: newBody.trim().slice(0, 80) + (newBody.trim().length > 80 ? "..." : "") || (tag === "PDF" ? "PDF lecture notes (click to view)..." : tag === "Anki" ? "Anki card deck..." : "Quiz questions..."),
      fullContent: newBody.trim() || undefined,
      fullWidth,
      pdfData: pdfData || undefined,
      pdfName: pdfName || undefined,
    };
    setNotes([newNote, ...notes]);
    closeModal();
  };

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (expandedNoteId === id) setExpandedNoteId(null);
  };

  // PDF upload handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return;

    setPdfName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPdfData(dataUrl);
      // Extract text from PDF for AI features (simple extraction via pdf.js is complex;
      // we'll pass the note content as context and note that PDF text extraction
      // works best with the AI API)
      setPdfText(`PDF: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
    };
    reader.readAsDataURL(file);
  };

  // Audio recording handler
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        // Send to API
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
        } catch {
          setAudioSummarizing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
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
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, noteContent: newBody, type: "anki" }),
      });
      const data = await res.json();
      if (data.ankiCards && data.ankiCards.length > 0) {
        const ankiNote: NoteItem = {
          id: Date.now(),
          title: newTitle.trim() + " — Anki Cards",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Anki",
          excerpt: `${data.ankiCards.length} AI-generated flashcards`,
          fullContent: data.ankiCards.map((c: AnkiCard) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n"),
          ankiCards: data.ankiCards,
          fullWidth: true,
        };
        setNotes([ankiNote, ...notes]);
      }
    } catch {}
    setGeneratingAnki(false);
  };

  // Quiz generation
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, noteContent: newBody, type: "quiz" }),
      });
      const data = await res.json();
      if (data.quizQuestions && data.quizQuestions.length > 0) {
        const quizNote: NoteItem = {
          id: Date.now(),
          title: newTitle.trim() + " — Quiz",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tag: "Quiz",
          excerpt: `${data.quizQuestions.length} AI-generated questions`,
          fullContent: data.quizQuestions.map((q: QuizQuestion, i: number) => `Q${i + 1}: ${q.question}\n${q.options.map((o: string, j: number) => `  ${j === q.answer ? "✓" : "•"} ${o}`).join("\n")}`).join("\n\n"),
          quizQuestions: data.quizQuestions,
          fullWidth: true,
        };
        setNotes([quizNote, ...notes]);
      }
    } catch {}
    setGeneratingQuiz(false);
  };

  const toolButtons = [
    { tag: "PDF", label: t("notes.importPdf"), icon: Upload, color: "bg-gold/30 hover:bg-gold/40" },
    { tag: "Anki", label: t("notes.createAnki"), icon: Layers, color: "bg-gold/30 hover:bg-gold/40" },
    { tag: "Quiz", label: "Quiz", icon: HelpCircle, color: "bg-gold/30 hover:bg-gold/40" },
  ];

  return (
    <div className="page-enter">
      {/* Hidden PDF input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("notes.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("notes.subtitle")}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-moss-dark"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Note cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`group relative cursor-pointer rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
              note.fullWidth ? "sm:col-span-2 lg:col-span-3" : ""
            }`}
          >
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start justify-between" onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}>
              <div className="flex-1 pr-8">
                <h3 className="text-sm font-semibold text-ink">{note.title}</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  {note.tag === "PDF" && note.pdfData
                    ? "PDF lecture notes (click to view)"
                    : note.excerpt}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-1.5">
                {note.fullWidth && (
                  <span className="rounded-full bg-ivory-warm px-1.5 py-0.5 text-[9px] font-medium text-ink-muted">
                    Wide
                  </span>
                )}
                {note.ankiCards && (
                  <span className="rounded-full bg-moss/5 px-1.5 py-0.5 text-[9px] font-medium text-moss">
                    {note.ankiCards.length} cards
                  </span>
                )}
                {note.quizQuestions && (
                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-500">
                    {note.quizQuestions.length} Qs
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    note.tag === "PDF"
                      ? "bg-red-50 text-red-500"
                      : note.tag === "Anki"
                      ? "bg-moss/5 text-moss"
                      : note.tag === "Quiz"
                      ? "bg-blue-50 text-blue-500"
                      : "bg-gold/10 text-gold-dark"
                  }`}
                >
                  {note.tag}
                </span>
              </div>
            </div>

            {/* Expanded content */}
            {expandedNoteId === note.id && (
              <div className="mt-4 border-t border-ivory-deep/30 pt-4">
                {/* PDF viewer */}
                {note.pdfData && (
                  <div className="mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPdf(viewingPdf === note.id.toString() ? null : note.id.toString());
                      }}
                      className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      {note.pdfName || "View PDF"}
                    </button>
                    {viewingPdf === note.id.toString() && (
                      <iframe
                        src={note.pdfData}
                        className="h-[500px] w-full rounded-xl border border-ivory-deep"
                        title={note.pdfName || "PDF Viewer"}
                      />
                    )}
                  </div>
                )}

                {/* Anki cards */}
                {note.ankiCards && note.ankiCards.length > 0 && (
                  <div className="space-y-2">
                    {note.ankiCards.map((card, i) => (
                      <div key={i} className="rounded-xl bg-ivory-warm/40 p-3">
                        <p className="text-xs font-semibold text-ink">Q: {card.front}</p>
                        <p className="mt-1 text-xs text-ink-soft">A: {card.back}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz questions */}
                {note.quizQuestions && note.quizQuestions.length > 0 && (
                  <div className="space-y-3">
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

                {/* Full text content */}
                {note.fullContent && !note.ankiCards && !note.quizQuestions && (
                  <p className="whitespace-pre-wrap text-xs text-ink-soft">{note.fullContent}</p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
              <FileText className="h-3 w-3" />
              {note.date}
            </div>
          </div>
        ))}
      </div>

      {/* New Note modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className={`rounded-2xl bg-white p-7 shadow-[var(--shadow-float)] transition-all ${
              fullWidth ? "w-full max-w-3xl" : "w-full max-w-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">New Note</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFullWidth(!fullWidth)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    fullWidth
                      ? "border-sage-300 bg-moss/5 text-moss"
                      : "border-ivory-deep text-ink-muted hover:bg-ivory-warm/50"
                  }`}
                  title={fullWidth ? "Full width" : "Standard width"}
                >
                  {fullWidth ? <AlignJustify className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                  {fullWidth ? "Full Width" : "Standard"}
                </button>
                <button
                  onClick={closeModal}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Note title</label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Chapter 3 Review"
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>

              {/* Create buttons (swapped — now above Note Content) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Create</label>
                <div className="flex gap-2">
                  {toolButtons.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.tag}
                        onClick={() => handleCreate(tool.tag)}
                        disabled={!newTitle.trim()}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white shadow-[var(--shadow-soft)] transition-colors disabled:opacity-50 ${tool.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note content (swapped — now below Create) */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                  <span>Note content</span>
                  {/* Audio summarization button */}
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      disabled={audioSummarizing}
                      className="flex items-center gap-1 rounded-lg bg-moss/10 px-2 py-1 text-[10px] font-medium text-moss transition-colors hover:bg-moss/20 disabled:opacity-50"
                      title="Record audio and generate summary"
                    >
                      <Mic className="h-3 w-3" />
                      {audioSummarizing ? "Summarizing..." : "Audio Summary"}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-500 transition-colors animate-pulse"
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Stop Recording
                    </button>
                  )}
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Type your note content here, or use Audio Summary to generate from audio..."
                  rows={6}
                  className={`w-full rounded-xl border border-ivory-deep bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10 resize-y ${
                    fullWidth ? "min-h-[200px]" : "min-h-[140px]"
                  }`}
                />
              </div>

              {/* PDF upload */}
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-ivory-deep p-4 text-center transition-colors hover:border-moss/30 hover:bg-moss/5"
              >
                {pdfData ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileUp className="h-5 w-5 text-moss" />
                    <span className="text-xs font-medium text-ink">{pdfName}</span>
                    <span className="text-[10px] text-moss">✓ Uploaded</span>
                  </div>
                ) : (
                  <>
                    <FileUp className="mx-auto mb-1 h-6 w-6 text-ink-muted" />
                    <p className="text-[11px] text-ink-muted">
                      Click to upload a Lecture PDF
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-muted/60">
                      PDF will be attached and viewable in the note
                    </p>
                  </>
                )}
              </div>

              {/* AI generation buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateAnki}
                  disabled={!newTitle.trim() || generatingAnki}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-moss/30 bg-moss/5 px-3 py-2 text-xs font-medium text-moss transition-colors hover:bg-moss/10 disabled:opacity-50"
                >
                  {generatingAnki ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                  {generatingAnki ? "Generating..." : "Generate Anki (AI)"}
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={!newTitle.trim() || generatingQuiz}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-100 disabled:opacity-50"
                >
                  {generatingQuiz ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5" />}
                  {generatingQuiz ? "Generating..." : "Generate Quiz (AI)"}
                </button>
              </div>

              <button
                onClick={() => handleCreate("Note")}
                disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-moss py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
