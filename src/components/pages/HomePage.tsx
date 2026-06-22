"use client";

import { useState } from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Clock, MapPin,
  FileText, Plus, X, Tag, ChevronDown, ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStudy, type Lecture } from "@/lib/StudyContext";
import { userData, motivationalQuotes } from "@/lib/data";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentDay = 22;
const daysInMonth = 30;
const firstDayOffset = 0;
const deadlineDays = [5, 12, 18, 22, 25, 28];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isJp = i18n.language === "jp";
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "home.greeting.morning" : hour < 18 ? "home.greeting.afternoon" : "home.greeting.evening";
  const { lectures } = useStudy();
  const [expandedLectureId, setExpandedLectureId] = useState<string | null>(null);

  // Group lectures by day
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const daysJp = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"];
  const lecturesByDay = days.map((day, idx) => ({
    day,
    dayJp: daysJp[idx],
    events: lectures.filter((l) => l.day === day),
  }));

  // Calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const toggleExpand = (id: string) => {
    setExpandedLectureId(expandedLectureId === id ? null : id);
  };

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {t(greetingKey)}, {userData.name}! 👋
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
          <Sparkles className="h-4 w-4 text-sage-500" />
          {t("home.quote")}
        </p>
      </div>

      {/* Calendar + Weekly Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Monthly Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{t("home.calendar.title")}</h2>
              <div className="flex gap-1">
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase text-ink-muted">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                const hasEvent = day !== null && deadlineDays.includes(day);
                const isToday = day === currentDay;
                return (
                  <div
                    key={i}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors ${
                      day === null
                        ? ""
                        : isToday
                        ? "bg-sage-500 font-bold text-white"
                        : hasEvent
                        ? "bg-sage-50 font-medium text-sage-700 hover:bg-sage-100"
                        : "text-ink-soft hover:bg-stone-100"
                    }`}
                  >
                    {day}
                    {hasEvent && !isToday && (
                      <div className="absolute bottom-1 h-1 w-1 rounded-full bg-sage-400" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-sage-500" />
                <span className="text-[11px] text-ink-muted">{t("home.calendar.today")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-sage-400" />
                <span className="text-[11px] text-ink-muted">{t("home.calendar.hasEvents")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Vertical Timeline */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-5 text-lg font-semibold text-ink">{t("home.week.title")}</h2>

            <div className="relative">
              <div className="absolute left-[68px] top-2 bottom-2 w-px bg-stone-200" />

              <div className="space-y-4">
                {lecturesByDay.map((day, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Day label */}
                    <div className="flex w-[60px] flex-col items-end pt-0.5">
                      <span className="text-xs font-semibold text-ink">
                        {isJp ? day.dayJp : day.day}
                      </span>
                    </div>

                    {/* Node dot */}
                    <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full border-2 border-white ${
                        day.events.length > 0 ? "bg-sage-400" : "bg-stone-300"
                      }`} />
                    </div>

                    {/* Events */}
                    <div className="flex-1 space-y-2 pb-1">
                      {day.events.length === 0 ? (
                        <p className="py-1 text-xs text-ink-muted">{t("home.week.noEvents")}</p>
                      ) : (
                        day.events.map((event) => (
                          <ExpandedLectureCard
                            key={event.id}
                            lecture={event}
                            isExpanded={expandedLectureId === event.id}
                            onToggle={() => toggleExpand(event.id)}
                            isJp={isJp}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Expandable Lecture Card ---------- */

interface ExpandedLectureCardProps {
  lecture: Lecture;
  isExpanded: boolean;
  onToggle: () => void;
  isJp: boolean;
}

function ExpandedLectureCard({ lecture, isExpanded, onToggle, isJp }: ExpandedLectureCardProps) {
  const { t } = useTranslation();
  const { updateLecture, customTags, addTag } = useStudy();
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editField, setEditField] = useState<string | null>(null);

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      updateLecture(lecture.id, { tags: [...lecture.tags, newTag.trim()] });
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const fieldLabels = {
    name: isJp ? "講義名" : "Lecture Name",
    time: isJp ? "時間" : "Time",
    location: isJp ? "場所" : "Location",
  };

  return (
    <div className={`rounded-xl transition-all duration-200 ${
      isExpanded ? "bg-sage-50 ring-1 ring-sage-200" : "bg-cream-dark"
    }`}>
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
      >
        <div className={`h-2 w-2 rounded-full shrink-0 ${
          lecture.color === "sage" ? "bg-sage-400" : "bg-lavender-300"
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{lecture.name}</p>
          {!isExpanded && (
            <p className="text-[11px] text-ink-muted truncate">{lecture.time} · {lecture.location}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-soft shrink-0">
          <Clock className="h-3 w-3" />
          {lecture.time.split(" - ")[0]}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-ink-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />
        )}
      </button>

      {/* Expanded section */}
      {isExpanded && (
        <div className="border-t border-sage-200/50 px-4 py-3 space-y-3">
          {/* Inline editable fields */}
          {(["name", "time", "location"] as const).map((field) => (
            <div key={field} className="flex items-center gap-2">
              <span className="w-20 text-[11px] font-medium text-ink-muted shrink-0">
                {fieldLabels[field]}
              </span>
              {editField === field ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={lecture[field]}
                  onBlur={(e) => {
                    updateLecture(lecture.id, { [field]: e.target.value });
                    setEditField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateLecture(lecture.id, { [field]: (e.target as HTMLInputElement).value });
                      setEditField(null);
                    }
                  }}
                  className="flex-1 rounded-md border border-sage-300 bg-white px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              ) : (
                <button
                  onClick={() => setEditField(field)}
                  className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-ink hover:bg-white/60"
                >
                  {field === "location" && <MapPin className="h-3 w-3 text-ink-muted" />}
                  {lecture[field]}
                </button>
              )}
            </div>
          ))}

          {/* PDF attachment placeholder */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] font-medium text-ink-muted shrink-0">
              {isJp ? "PDF" : "Lecture PDF"}
            </span>
            <button className="flex items-center gap-1.5 rounded-md border border-dashed border-stone-300 px-3 py-1.5 text-xs text-ink-muted hover:border-sage-400 hover:text-sage-600 transition-colors">
              <FileText className="h-3 w-3" />
              {lecture.pdfUrl ? "View PDF" : isJp ? "PDFを添付" : "Attach PDF"}
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-start gap-2">
            <span className="w-20 pt-1 text-[11px] font-medium text-ink-muted shrink-0">
              {isJp ? "タグ" : "Tags"}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {lecture.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-lavender-100 px-2.5 py-0.5 text-[10px] font-medium text-lavender-500"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {showTagInput ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="CS101"
                    className="w-20 rounded-md border border-sage-300 bg-white px-2 py-0.5 text-[10px] text-ink focus:outline-none focus:ring-2 focus:ring-sage-100"
                  />
                  <button
                    onClick={handleAddTag}
                    className="flex h-5 w-5 items-center justify-center rounded bg-sage-500 text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setShowTagInput(false); setNewTag(""); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-muted hover:bg-stone-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center gap-0.5 rounded-full border border-stone-300 px-2.5 py-0.5 text-[10px] text-ink-muted hover:border-sage-400 hover:text-sage-600 transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  {isJp ? "タグ追加" : "Add Tag"}
                </button>
              )}
            </div>
          </div>

          {/* Note-taking area */}
          <div>
            <span className="mb-1 block text-[11px] font-medium text-ink-muted">
              {isJp ? "ノート" : "Quick Notes"}
            </span>
            <textarea
              value={lecture.note}
              onChange={(e) => updateLecture(lecture.id, { note: e.target.value })}
              placeholder={isJp ? "ここにノートを書く..." : "Type your notes here..."}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100 min-h-[80px] resize-y"
            />
            <p className="mt-1 text-[10px] text-ink-muted">
              {isJp ? "※ノートは自動的にノートページに同期されます" : "Notes auto-sync to the Notes page"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
