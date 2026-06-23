"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Clock, MapPin,
  FileText, X, ChevronDown, ChevronUp, Calendar, Loader2, Unlink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/AuthContext";
import { motivationalQuotes } from "@/lib/data";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthsJp = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const dayLabelsEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const dayLabelsJp = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日"];

// Placeholder events keyed by "year-month-day" (used when Google Calendar is not connected)
const placeholderEvents: Record<string, { time: string; title: string; room: string }[]> = {
  "2026-5-5": [{ time: "09:00 AM", title: "Data Structures", room: "Gates 100" }],
  "2026-5-12": [{ time: "11:00 AM", title: "Macroeconomics", room: "Econ 220" }],
  "2026-5-18": [{ time: "02:00 PM", title: "Linear Algebra", room: "Math 340" }],
  "2026-5-22": [
    { time: "09:00 AM", title: "Data Structures", room: "Gates 100" },
    { time: "04:00 PM", title: "Japanese I", room: "Lang 112" },
  ],
  "2026-5-25": [{ time: "11:00 AM", title: "Macroeconomics Midterm", room: "Econ 220" }],
  "2026-5-28": [{ time: "02:00 PM", title: "Linear Algebra Quiz", room: "Math 340" }],
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const isJp = i18n.language === "jp";
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "home.greeting.morning" : hour < 18 ? "home.greeting.afternoon" : "home.greeting.evening";

  const googleCal = useGoogleCalendar();

  // Calendar navigation state — defaults to current month, range: ±1 year
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const minDate = useMemo(() => new Date(today.getFullYear() - 1, today.getMonth(), 1), [today]);
  const maxDate = useMemo(() => new Date(today.getFullYear() + 1, today.getMonth(), 1), [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedLecture, setExpandedLecture] = useState<string | null>(null);
  const [lectureNotes, setLectureNotes] = useLocalStorage<Record<string, { pdfName: string | null; note: string }>>("studyspace_lecture_notes", {});

  // Fetch Google Calendar events when month changes
  useEffect(() => {
    if (googleCal.isConnected) {
      googleCal.fetchForMonth(viewYear, viewMonth);
    }
  }, [viewYear, viewMonth, googleCal.isConnected, googleCal.fetchForMonth]);

  // Calendar math for the current view
  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const firstDayOfMonth = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth]);

  const calendarCells: (number | null)[] = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOfMonth, daysInMonth]);

  // Merge Google Calendar events with placeholder events (keyed by date string)
  const mergedEvents = useMemo(() => {
    const merged: Record<string, { time: string; title: string; room: string }[]> = {};

    if (!googleCal.isConnected) {
      Object.entries(placeholderEvents).forEach(([key, events]) => {
        if (!merged[key]) merged[key] = [];
        merged[key].push(...events);
      });
    }

    Object.entries(googleCal.eventsByDate).forEach(([key, events]) => {
      if (!merged[key]) merged[key] = [];
      events.forEach((event) => {
        const timeStr = event.start
          ? new Date(event.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "All day";
        merged[key].push({
          time: timeStr,
          title: event.title,
          room: event.location || "",
        });
      });
    });

    return merged;
  }, [googleCal.isConnected, googleCal.eventsByDate]);

  const hasEventOnDay = useCallback((day: number) => {
    return !!mergedEvents[dateKey(viewYear, viewMonth, day)];
  }, [mergedEvents, viewYear, viewMonth]);

  // Month navigation with ±1 year clamping
  const canGoPrev = useMemo(() => {
    return viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());
  }, [viewYear, viewMonth, minDate]);

  const canGoNext = useMemo(() => {
    return viewYear < maxDate.getFullYear() || (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());
  }, [viewYear, viewMonth, maxDate]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDateKey(null);
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDateKey(null);
  };

  const handleDayClick = (day: number) => {
    const key = dateKey(viewYear, viewMonth, day);
    if (mergedEvents[key]) {
      setSelectedDateKey(selectedDateKey === key ? null : key);
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

  // Compute the week containing the selected day (or today if nothing selected)
  const weekDays = useMemo(() => {
    let refDay: number;
    let refYear = viewYear;
    let refMonth = viewMonth;

    if (selectedDateKey) {
      const parts = selectedDateKey.split("-");
      refYear = parseInt(parts[0]);
      refMonth = parseInt(parts[1]);
      refDay = parseInt(parts[2]);
    } else {
      // Use today if it's in the current view month, otherwise use the 1st
      if (today.getFullYear() === viewYear && today.getMonth() === viewMonth) {
        refDay = today.getDate();
      } else {
        refDay = 1;
      }
    }

    const refDate = new Date(refYear, refMonth, refDay);
    const dow = refDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Find Monday of this week
    const monday = new Date(refYear, refMonth, refDay - (dow === 0 ? 6 : dow - 1));

    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
        label: dayLabelsEn[i],
        labelJp: dayLabelsJp[i],
      });
    }
    return days;
  }, [selectedDateKey, viewYear, viewMonth, today]);

  const monthLabel = isJp
    ? `${viewYear}年${monthsJp[viewMonth]}`
    : `${monthsEn[viewMonth]} ${viewYear}`;

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
              <h2 className="text-lg font-semibold text-ink">{monthLabel}</h2>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {googleCal.error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-500">
                {googleCal.error}
              </div>
            )}

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
                if (day === null) return <div key={i} />;
                const key = dateKey(viewYear, viewMonth, day);
                const dayEvents = mergedEvents[key];
                const hasEvent = !!dayEvents;
                const isToday = key === todayKey;
                const isSelected = key === selectedDateKey;
                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(day)}
                    disabled={!hasEvent}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all ${
                      isSelected
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
            {selectedDateKey && mergedEvents[selectedDateKey] && (
              <div className="mt-4 rounded-xl bg-sage-50 p-4 ring-1 ring-sage-200">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-sage-700">
                    {monthsEn[viewMonth]} {parseInt(selectedDateKey.split("-")[2])}
                  </h3>
                  <button
                    onClick={() => setSelectedDateKey(null)}
                    className="text-sage-400 hover:text-sage-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {mergedEvents[selectedDateKey].map((event, ei) => (
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
                {weekDays.map((dayInfo, idx) => {
                  const dayEvents = mergedEvents[dayInfo.key] || [];
                  const isDaySelected = selectedDateKey === dayInfo.key;
                  const isToday = dayInfo.key === todayKey;

                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex w-[60px] flex-col items-end pt-0.5">
                        <button
                          onClick={() => setSelectedDateKey(isDaySelected ? null : dayInfo.key)}
                          className={`text-xs font-semibold transition-colors ${
                            isDaySelected ? "text-sage-600" : "text-ink hover:text-sage-500"
                          }`}
                        >
                          {isJp ? dayInfo.labelJp : dayInfo.label}
                        </button>
                        <span className="text-[10px] text-ink-muted">
                          {isJp ? `${dayInfo.month + 1}月${dayInfo.day}日` : `${monthsEn[dayInfo.month].slice(0, 3)} ${dayInfo.day}`}
                        </span>
                      </div>

                      <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full border-2 border-white ${
                          dayEvents.length > 0 ? "bg-sage-400" : "bg-stone-300"
                        } ${isDaySelected ? "ring-2 ring-sage-200" : ""} ${isToday ? "ring-2 ring-sage-300" : ""}`} />
                      </div>

                      <div className={`flex-1 space-y-2 pb-1 rounded-xl p-1.5 -m-1.5 transition-colors ${
                        isDaySelected ? "bg-sage-50" : ""
                      }`}>
                        {dayEvents.length === 0 ? (
                          <p className="py-1 text-xs text-ink-muted">{t("home.week.noEvents")}</p>
                        ) : (
                          dayEvents.map((event, ei) => {
                            const lectureId = `${dayInfo.key}-${ei}`;
                            const isExpanded = expandedLecture === lectureId;
                            const lectureData = lectureNotes[lectureId] || { pdfName: null, note: "" };

                            return (
                              <div key={ei}>
                                <button
                                  onClick={() => {
                                    handleLectureClick(lectureId);
                                    setSelectedDateKey(dayInfo.key);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all ${
                                      isExpanded
                                        ? "bg-sage-50 ring-1 ring-sage-200"
                                        : "bg-cream-dark hover:bg-stone-100"
                                    }`}
                                >
                                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                                    ei % 2 === 0 ? "bg-sage-400" : "bg-lavender-300"
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ink truncate">{event.title}</p>
                                    <p className="text-[11px] text-ink-muted truncate">{event.time}{event.room ? ` · ${event.room}` : ""}</p>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-ink-muted shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />
                                  )}
                                </button>

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
                                      {event.room && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-ink-muted" />
                                          <span className="text-xs text-ink-soft">{event.room}</span>
                                        </div>
                                      )}
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
