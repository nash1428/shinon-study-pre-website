"use client";

import { useState } from "react";
import { FileText, Plus, Upload, Layers, X, FileUp, HelpCircle, AlignJustify, Columns2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recentNotes as initialNotes, type NoteItem } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function NotesPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useLocalStorage<NoteItem[]>("studyspace_notes", initialNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [fullWidth, setFullWidth] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle("");
    setNewBody("");
    setFullWidth(false);
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
    };
    setNotes([newNote, ...notes]);
    closeModal();
  };

  const toolButtons = [
    { tag: "PDF", label: t("notes.importPdf"), icon: Upload, color: "bg-lavender-300 hover:bg-lavender-400" },
    { tag: "Anki", label: t("notes.createAnki"), icon: Layers, color: "bg-lavender-300 hover:bg-lavender-400" },
    { tag: "Quiz", label: "Quiz", icon: HelpCircle, color: "bg-lavender-300 hover:bg-lavender-400" },
  ];

  return (
    <div className="page-enter">
      <h1 className="mb-1 text-3xl font-bold text-ink">{t("notes.title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("notes.subtitle")}</p>

      {/* Note cards — full-width notes span the entire row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`cursor-pointer rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
              note.fullWidth ? "sm:col-span-2 lg:col-span-3" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink">{note.title}</h3>
                <p className="mt-1 text-xs text-ink-soft">{note.excerpt}</p>
              </div>
              <div className="ml-3 flex items-center gap-1.5">
                {note.fullWidth && (
                  <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-ink-muted">
                    Wide
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    note.tag === "PDF"
                      ? "bg-red-50 text-red-500"
                      : note.tag === "Anki"
                      ? "bg-sage-50 text-sage-700"
                      : note.tag === "Quiz"
                      ? "bg-blue-50 text-blue-500"
                      : "bg-lavender-100 text-lavender-500"
                  }`}
                >
                  {note.tag}
                </span>
              </div>
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
        onClick={() => setModalOpen(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-sage-500 text-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 active:scale-95 z-50"
        title="New Note"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Note modal — larger, with full-width toggle */}
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
                {/* Full-width toggle */}
                <button
                  onClick={() => setFullWidth(!fullWidth)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    fullWidth
                      ? "border-sage-300 bg-sage-50 text-sage-700"
                      : "border-stone-200 text-ink-muted hover:bg-stone-50"
                  }`}
                  title={fullWidth ? "Full width" : "Standard width"}
                >
                  {fullWidth ? <AlignJustify className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                  {fullWidth ? "Full Width" : "Standard"}
                </button>
                <button
                  onClick={closeModal}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100"
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
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Note content</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Type your note content here..."
                  rows={6}
                  className={`w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-stone-400 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100 resize-y ${
                    fullWidth ? "min-h-[200px]" : "min-h-[140px]"
                  }`}
                />
              </div>

              {/* Inline tool buttons */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Create as</label>
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

              {/* PDF upload placeholder */}
              <div className="rounded-xl border-2 border-dashed border-stone-300 p-4 text-center">
                <FileUp className="mx-auto mb-1 h-6 w-6 text-ink-muted" />
                <p className="text-[11px] text-ink-muted">
                  Click "Import Lecture PDF" to attach a PDF
                </p>
                <p className="mt-0.5 text-[10px] text-ink-muted/60">
                  UI placeholder — file upload coming soon
                </p>
              </div>

              <button
                onClick={() => handleCreate("Note")}
                disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-sage-500 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-600 disabled:opacity-50"
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
