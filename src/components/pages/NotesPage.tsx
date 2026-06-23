"use client";

import { useState } from "react";
import { FileText, Plus, Upload, Layers, X, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentNotes as initialNotes, type NoteItem } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function NotesPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("studyspace_notes", initialNotes);
  const [modalOpen, setModalOpen] = useState<null | "pdf" | "anki" | "note">(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const closeModal = () => {
    setModalOpen(null);
    setNewTitle("");
    setNewBody("");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const tag = modalOpen === "pdf" ? "PDF" : modalOpen === "anki" ? "Anki" : "Note";
    const newNote: NoteItem = {
      id: Date.now(),
      title: newTitle.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tag,
      excerpt: newBody.trim() || (modalOpen === "pdf" ? "PDF lecture notes (click to view)..." : "Anki card deck..."),
    };
    setNotes([newNote, ...notes]);
    closeModal();
  };

  return (
    <div className="page-enter">
      <h1 className="mb-1 text-3xl font-bold text-ink">{t("notes.title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("notes.subtitle")}</p>

      {/* Action buttons (Import PDF + Create Anki remain at top) */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setModalOpen("pdf")}
          className="flex items-center gap-2 rounded-xl bg-lavender-300 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-lavender-400"
        >
          <Upload className="h-4 w-4" />
          {t("notes.importPdf")}
        </button>
        <button
          onClick={() => setModalOpen("anki")}
          className="flex items-center gap-2 rounded-xl bg-lavender-300 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-lavender-400"
        >
          <Layers className="h-4 w-4" />
          {t("notes.createAnki")}
        </button>
      </div>

      {/* Note cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="cursor-pointer rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink">{note.title}</h3>
                <p className="mt-1 text-xs text-ink-soft">{note.excerpt}</p>
              </div>
              <span
                className={`ml-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  note.tag === "PDF"
                    ? "bg-red-50 text-red-500"
                    : note.tag === "Anki"
                    ? "bg-sage-50 text-sage-700"
                    : "bg-lavender-100 text-lavender-500"
                }`}
              >
                {note.tag}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
              <FileText className="h-3 w-3" />
              {note.date}
            </div>
          </div>
        ))}
      </div>

      {/* Floating action button — bottom-right, plus icon only */}
      <button
        onClick={() => setModalOpen("note")}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-sage-500 text-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 active:scale-95 z-50"
        title="New Note"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-float)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">
                {modalOpen === "pdf" ? t("notes.importPdf") : modalOpen === "anki" ? t("notes.createAnki") : "New Note"}
              </h2>
              <button
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  {modalOpen === "anki" ? "Card title" : "Note title"}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={modalOpen === "pdf" ? "e.g., Lecture 5 — Graph Algorithms" : "e.g., Chapter 3 Review"}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              </div>

              {/* Note body / content textarea */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  {modalOpen === "anki" ? "Card content" : "Note content"}
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Type your note content here..."
                  rows={4}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100 resize-y min-h-[100px]"
                />
              </div>

              {modalOpen === "pdf" && (
                <div className="rounded-xl border-2 border-dashed border-stone-300 p-6 text-center">
                  <FileUp className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
                  <p className="text-xs text-ink-muted">
                    Drop a PDF here or click to browse
                  </p>
                  <p className="mt-1 text-[10px] text-ink-muted/60">
                    UI placeholder — file upload coming soon
                  </p>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-sage-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-600 disabled:opacity-50"
              >
                {modalOpen === "pdf" ? "Import" : modalOpen === "anki" ? "Create" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
