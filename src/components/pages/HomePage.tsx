"use client";

import { useState, useMemo } from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Clock, MapPin,
  FileText, X, ChevronDown, ChevronUp, Calendar, Loader2, Unlink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/AuthContext";
import { motivationalQuotes } from "@/lib/data";
import { useGoogleCalendar, type GoogleCalendarEvent } from "@/hooks/useGoogleCalendar";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentDay = 22;
const daysInMonth = 30;
const firstDayOffset = 0;
const deadlineDays = [5, 12, 18, 22, 25, 28];

// Placeholder events (used when Google Calendar is not connected)
const placeholderEvents: Record<number, { time: string; title: string; room: string }[]> = {
  5: [{ time: "09:00 AM", title: "Data Structures", room: "Gates 100" }],
  12: [{ time: "11:00 AM", title: "Macroeconomics", room: "Econ 220" }],
  18: [{ time: "02:00 PM", title: "Linear Algebra", room: "Math 340" }],
  22: [
    { time: "09:00 AM", title: "Data Structures", room: "Gates 100" },
    { time: "04:00 PM", title: "Japanese I", room: "Lang 112" },
  ],
  25: [{ time: "11:00 AM", title: "Macroeconomics Midterm", room: "Econ 220" }],
  28: [{ time: "02:00 PM", title: "Linear Algebra Quiz", room: "Math 340" }],
};

const weekSchedule = [
  {
    day: "Monday",
    dayJp: "月曜日",
    events: [
      { time: "09:00 AM - 10:30 AM", title: "Data Structures", room: "Gates 100", color: "sage" },
      { time: "02:00 PM - 03:30 PM", title: "Linear Algebra", room: "Math 340", color: "sage" },
    ],
  },
  {
    day: "Tuesday",
    dayJp: "火曜日",
    events: [
      { time: "11:00 AM - 12:30 PM", title: "Macroeconomics", room: "Econ 220", color: "lavender" },
    ],
  },
  {
    day: "Wednesday",
    dayJp: "水曜日",
    events: [
      { time: "09:00 AM - 10:30 AM", title: "Data Structures — Lab", room: "Gates B1", color: "sage" },
      { time: "04:00 PM - 05:30 PM", title: "Japanese I", room: "Lang 112", color: "lavender" },
    ],
  },
  {
    day: "Thursday",
    dayJp: "木曜日",
    events: [
      { time: "11:00 AM - 12:30 PM", title: "Macroeconomics", room: "Econ 220", color: "lavender" },
      { time: "02:00 PM - 03:30 PM", title: "Linear Algebra", room: "Math 340", color: "sage" },
    ],
  },
  {
    day: "Friday",
    dayJp: "金曜日",
    events: [
      { time: "04:00 PM - 05:30 PM", title: "Japanese I — Oral Practice", room: "Lang 112", color: "lavender" },
    ],
  },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const isJp = i18n.language === "jp";
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "home.greeting.morning" : hour < 18 ? "home.greeting.afternoon" : "home.greeting.evening";

  const googleCal = useGoogleCalendar();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedLecture, setExpandedLecture] = useState<string | null>(null);
  const [lectureNotes, setLectureNotes] = useState<Record<string, { pdfName: string | null; note: string }>>({});

  // Merge Google Calendar events with placeholder events
  const mergedEvents = useMemo(() => {
    const merged: Record<number, { time: string; title: string; room: string }[]> = {};

    // Add placeholder events (only if Google Calendar is not connected)
    if (!googleCal.isConnected) {
      Object.entries(placeholderEvents).forEach(([day, events]) => {
        const dayNum = parseInt(day);
        if (!merged[dayNum]) merged[dayNum] = [];
        merged[dayNum].push(...events);
      });
    }

    // Add Google Calendar events
    Object.entries(googleCal.eventsByDay).forEach(([day, events]) => {
      const dayNum = parseInt(day);
      if (!merged[dayNum]) merged[dayNum] = [];
      events.forEach((event) => {
        const timeStr = event.start
          ? new Date(event.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "All day";
        merged[dayNum].push({
          time: timeStr,
          title: event.title,
          room: event.location || "",
        });
      });
    });

    return merged;
  }, [googleCal.isConnected, googleCal.eventsByDay]);

  const mergedDeadlineDays = useMemo(() => Object.keys(mergedEvents).map(Number), [mergedEvents]);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const handleDayClick = (day: number) => {
    if (mergedDeadlineDays.includes(day)) {
      setSelectedDay(selectedDay === day ? null : day);
    }
  };

  const handleLectureClick = (lectureId: string) => {
    setExpandedLecture(expandedLecture === lectureId ? null : lectureId);
  };

  const updateLectureData = (lectureId: string, data: Partial<{ pdfName: string | null; note: string }>) => {
    setLectureNotes((prev) => ({
      ...prev,
      [lectureId]: { ...prev[lectureId], ...data },
    }));
  };

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {t(greetingKey)}, {profile?.name || "Student"}! 👋
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
              <div className="flex items-center gap-2">
                {/* Google Calendar connect/disconnect button */}
                {googleCal.isConfigured && (
                  googleCal.isConnected ? (
                    <button
                      onClick={googleCal.disconnect}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                      title="Disconnect Google Calendar"
                    >
                      <Unlink className="h-3 w-3" />
                      {isJp ? "切断" : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={googleCal.connect}
                      disabled={googleCal.loading}
                      className="flex items-center gap-1.5 rounded-lg bg-sage-500 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-sage-600 disabled:opacity-50"
                    >
                      {googleCal.loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {isJp ? "Googleカレンダー" : "Google Calendar"}
                    </button>
                  )
                )}
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Error message */}
            {googleCal.error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-500">
                {googleCal.error}
              </div>
            )}

            {/* Connected status badge */}
            {googleCal.isConnected && (
              <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-sage-50 px-3 py-1.5 text-[11px] text-sage-700">
                <Calendar className="h-3 w-3" />
                {isJp ? "Googleカレンダーと連携中" : "Connected to Google Calendar"}
                <span className="text-sage-400">·</span>
                {googleCal.events.length} {isJp ? "件" : "events"}
              </div>
            )}

            <div className="mb-2 grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase text-ink-muted">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                const hasEvent = day !== null && mergedDeadlineDays.includes(day);
                const isToday = day === currentDay;
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={i}
                    onClick={() => day && handleDayClick(day)}
                    disabled={!hasEvent}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all ${
                      day === null
                        ? ""
                        : isSelected
                        ? "bg-sage-500 font-bold text-white shadow-[var(--shadow-soft)]"
                        : isToday
                        ? "bg-sage-100 font-bold text-sage-700 ring-1 ring-sage-300"
                        : hasEvent
                        ? "bg-sage-50 font-medium text-sage-700 hover:bg-sage-100 cursor-pointer"
                        : "text-ink-soft"
                    }`}
                  >
                    {day}
                    {hasEvent && !isSelected && !isToday && (
                      <div className="absolute bottom-1 h-1 w-1 rounded-full bg-sage-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day events popover */}
            {selectedDay && mergedEvents[selectedDay] && (
              <div className="mt-4 rounded-xl bg-sage-50 p-4 ring-1 ring-sage-200">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-sage-700">
                    June {selectedDay}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-sage-400 hover:text-sage-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {mergedEvents[selectedDay].map((event, ei) => (
                    <div key={ei} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                      <div className="h-2 w-2 rounded-full bg-sage-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-ink">{event.title}</p>
                        {event.room && <p className="text-[10px] text-ink-muted">{event.room}</p>}
                      </div>
                      <span className="text-[10px] text-ink-soft">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {weekSchedule.map((day, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex w-[60px] flex-col items-end pt-0.5">
                      <span className="text-xs font-semibold text-ink">
                        {isJp ? day.dayJp : day.day}
                      </span>
                    </div>

                    <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full border-2 border-white ${
                        day.events.length > 0 ? "bg-sage-400" : "bg-stone-300"
                      }`} />
                    </div>

                    <div className="flex-1 space-y-2 pb-1">
                      {day.events.length === 0 ? (
                        <p className="py-1 text-xs text-ink-muted">{t("home.week.noEvents")}</p>
                      ) : (
                        day.events.map((event, ei) => {
                          const lectureId = `${day.day}-${ei}`;
                          const isExpanded = expandedLecture === lectureId;
                          const lectureData = lectureNotes[lectureId] || { pdfName: null, note: "" };

                          return (
                            <div key={ei}>
                              {/* Lecture card (clickable) */}
                              <button
                                onClick={() => handleLectureClick(lectureId)}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all ${
                                  isExpanded
                                    ? "bg-sage-50 ring-1 ring-sage-200"
                                    : "bg-cream-dark hover:bg-stone-100"
                                }`}
                              >
                                <div className={`h-2 w-2 rounded-full shrink-0 ${
                                  event.color === "sage" ? "bg-sage-400" : "bg-lavender-300"
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-ink truncate">{event.title}</p>
                                  <p className="text-[11px] text-ink-muted truncate">{event.time} · {event.room}</p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-ink-muted shrink-0" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />
                                )}
                              </button>

                              {/* Expanded lecture section */}
                              {isExpanded && (
                                <div className="mt-1 rounded-xl bg-sage-50 p-4 ring-1 ring-sage-200">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-16 text-[10px] font-medium text-ink-muted">{isJp ? "講義名" : "Lecture"}</span>
                                      <span className="text-sm text-ink">{event.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3 text-ink-muted" />
                                      <span className="text-xs text-ink-soft">{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3 text-ink-muted" />
                                      <span className="text-xs text-ink-soft">{event.room}</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 border-t border-sage-200/50 pt-3">
                                    <span className="mb-1.5 block text-[10px] font-medium text-ink-muted">
                                      {isJp ? "講義PDF" : "Lecture PDF"}
                                    </span>
                                    {lectureData.pdfName ? (
                                      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                                        <FileText className="h-4 w-4 text-red-400" />
                                        <span className="flex-1 text-xs text-ink">{lectureData.pdfName}</span>
                                        <button
                                          onClick={() => updateLectureData(lectureId, { pdfName: null })}
                                          className="text-ink-muted hover:text-red-400"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => updateLectureData(lectureId, { pdfName: "lecture_notes.pdf" })}
                                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs text-ink-muted hover:border-sage-400 hover:text-sage-600 transition-colors"
                                      >
                                        <FileText className="h-3 w-3" />
                                        {isJp ? "PDFを添付" : "Attach Lecture PDF"}
                                      </button>
                                    )}
                                  </div>

                                  <div className="mt-3 border-t border-sage-200/50 pt-3">
                                    <span className="mb-1 block text-[10px] font-medium text-ink-muted">
                                      {isJp ? "ノート" : "Quick Notes"}
                                    </span>
                                    <textarea
                                      value={lectureData.note}
                                      onChange={(e) => updateLectureData(lectureId, { note: e.target.value })}
                                      placeholder={isJp ? "ここにノートを書く..." : "Type your notes here..."}
                                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100 min-h-[60px] resize-y"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
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
