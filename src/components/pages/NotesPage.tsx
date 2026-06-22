"use client";

import { FileText, Plus, Upload, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStudy } from "@/lib/StudyContext";

export default function NotesPage() {
  const { t } = useTranslation();
  const { notes } = useStudy();

  return (
    <div className="page-enter">
      <h1 className="mb-1 text-3xl font-bold text-ink">{t("notes.title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t("notes.subtitle")}</p>

      {/* Action buttons */}
      <div className="mb-6 flex gap-3">
        <button className="flex items-center gap-2 rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-sage-600">
          <Upload className="h-4 w-4" />
          {t("notes.importPdf")}
        </button>
        <button className="flex items-center gap-2 rounded-xl bg-lavender-300 px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-lavender-400">
          <Layers className="h-4 w-4" />
          {t("notes.createAnki")}
        </button>
      </div>

      {/* Note cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`cursor-pointer rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
              note.lectureId ? "ring-1 ring-sage-200" : ""
            }`}
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
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <FileText className="h-3 w-3" />
                {note.date}
              </div>
              {note.lectureId && (
                <span className="text-[10px] font-medium text-sage-600">
                  {t("sidebar.home")} ←
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
