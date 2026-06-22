"use client";

import { FileText, Plus, Upload, Layers } from "lucide-react";
import { recentNotes } from "@/lib/data";

export default function NotesPage() {
  return (
    <div className="page-enter px-5 py-6">
      <h1 className="mb-1 text-2xl font-bold text-ink">Notes</h1>
      <p className="mb-5 text-sm text-ink-soft">Your recent lecture notes & study materials</p>

      {/* Action buttons */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 rounded-xl bg-sage-500 px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-sage-600">
          <Upload className="h-4 w-4" />
          Import PDF
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-lavender-300 px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-lavender-400">
          <Layers className="h-4 w-4" />
          Create Anki
        </button>
      </div>

      {/* Note cards */}
      <div className="space-y-3">
        {recentNotes.map((note) => (
          <div
            key={note.id}
            className="cursor-pointer rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]"
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
                    : "bg-sage-50 text-sage-700"
                }`}
              >
                {note.tag}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
              <FileText className="h-3 w-3" />
              {note.date}
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-sage-500 text-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 active:scale-95">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
