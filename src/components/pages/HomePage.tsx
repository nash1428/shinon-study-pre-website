"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Clock, MapPin,
  FileText, X, ChevronDown, ChevronUp, Calendar, Loader2, Unlink, Plus, Trash2, Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/AuthContext";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayLabelsEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const dayLabelsJp = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"];

interface LocalEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  source: "local" | "google";
}

interface MergedEvent {
  time: string;
  endTime: string;
  title: string;
  location: string;
  source: "local" | "google";
  localEventId?: string;
}

const placeholderEvents: Record<string, { time: string; title: string; room: string }[]> = {
  "2026-5-5": [{ time: "09:00 AM", title: "Data Structures", room: "Gates 100" }],
  "2026-5-12": [{ time: "11:00 AM", title: "Macroeconomics", room: "Econ 220" }],
  "2026-5-22": [
    { time: "09:00 AM", title: "Data Structures", room: "Gates 100" },
    { time: "04:00 PM", title: "Japanese I", room: "Lang 112" },
  ],
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { profile, user } = useAuth();
  const isJp = i18n.language === "jp";
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "home.greeting.morning" : hour < 18 ? "home.greeting.afternoon" : "home.greeting.evening";

  const googleCal = useGoogleCalendar();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const minDate = useMemo(() => new Date(today.getFullYear() - 1, today.getMonth(), 1), [today]);
  const maxDate = useMemo(() => new Date(today.getFullYear() + 1, today.getMonth(), 1), [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedLecture, setExpandedLecture] = useState<string | null>(null);
  const [lectureNotes, setLectureNotes] = useLocalStorage<Record<string, { pdfName: string | null; note: string }>>("studyspace_lecture_notes", {});

  // Local events (separate from Google Calendar)
  const [localEvents, setLocalEvents] = useLocalStorage<LocalEvent[]>("studyspace_local_events", []);

  // Lecture notes — read from localStorage to show on calendar + timeline
  const [allNotes, setAllNotes] = useLocalStorage<{ id: number; title: string; lectureDate?: string; category?: string }[]>("studyspace_notes", []);

  // Map of lecture notes by date key (for calendar dots + timeline)
  const notesByDate = useMemo(() => {
    const map: Record<string, { id: number; title: string; category?: string }[]> = {};
    allNotes.forEach((n) => {
      if (n.lectureDate) {
        const [y, m, d] = n.lectureDate.split("-").map(Number);
        const key = dateKey(y, m - 1, d);
        if (!map[key]) map[key] = [];
        map[key].push({ id: n.id, title: n.title, category: n.category });
      }
    });
    return map;
  }, [allNotes]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(toISODate(today.getFullYear(), today.getMonth(), today.getDate()));
  const [newEventStart, setNewEventStart] = useState("09:00");
  const [newEventEnd, setNewEventEnd] = useState("10:00");
  const [newEventLocation, setNewEventLocation] = useState("");

  useEffect(() => {
    if (googleCal.isConnected) googleCal.fetchForMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, googleCal.isConnected, googleCal.fetchForMonth]);

  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const firstDayOfMonth = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth]);

  // Calendar cells with leading/trailing dates — only show weeks that contain current month dates
  const calendarCells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = useMemo(() => {
    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
    
    // Leading dates from previous month (only enough to fill the first week)
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({ day: d, month: prevMonth, year: prevMonthYear, isCurrentMonth: false });
    }
    
    // Current month dates
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }
    
    // Trailing dates — only enough to complete the last week (max 6 days)
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const remainingInWeek = (7 - (cells.length % 7)) % 7; // Fill only the current week, not extra rows
    for (let d = 1; d <= remainingInWeek; d++) {
      cells.push({ day: d, month: nextMonth, year: nextMonthYear, isCurrentMonth: false });
    }
    
    return cells;
  }, [firstDayOfMonth, daysInMonth, viewMonth, viewYear]);

  // Build a map of local events by dateKey
  const localEventsByDate = useMemo(() => {
    const map: Record<string, LocalEvent[]> = {};
    localEvents.forEach((evt) => {
      const [y, m, d] = evt.date.split("-").map(Number);
      const key = dateKey(y, m - 1, d);
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, [localEvents]);

  // Merge Google Calendar + placeholder + local events into a unified structure
  const mergedEvents = useMemo(() => {
    const merged: Record<string, MergedEvent[]> = {};
    if (!googleCal.isConnected) {
      Object.entries(placeholderEvents).forEach(([key, events]) => {
        if (!merged[key]) merged[key] = [];
        events.forEach(e => merged[key].push({ time: e.time, endTime: "", title: e.title, location: e.room, source: "google" }));
      });
    }
    Object.entries(googleCal.eventsByDate).forEach(([key, events]) => {
      if (!merged[key]) merged[key] = [];
      events.forEach((event) => {
        merged[key].push({
          time: event.start ? new Date(event.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "All day",
          endTime: event.end ? new Date(event.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
          title: event.title,
          location: event.location || "",
          source: "google",
        });
      });
    });
    // Add local events with proper fields
    Object.entries(localEventsByDate).forEach(([key, events]) => {
      if (!merged[key]) merged[key] = [];
      events.forEach((evt) => {
        merged[key].push({
          time: evt.startTime,
          endTime: evt.endTime,
          title: evt.title,
          location: evt.location,
          source: "local",
          localEventId: evt.id,
        });
      });
    });
    // Sort each day's events by time (normalize different time formats)
    Object.keys(merged).forEach((key) => {
      merged[key].sort((a, b) => {
        // Convert times to comparable 24h format for sorting
        const normalizeTime = (t: string): string => {
          if (!t || t === "All day") return "99:99"; // Sort all-day events last
          // Handle "09:00 AM" / "02:30 PM" format (Google Calendar)
          const match12 = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match12) {
            let h = parseInt(match12[1]);
            const m = match12[2];
            const period = match12[3].toUpperCase();
            if (period === "PM" && h !== 12) h += 12;
            if (period === "AM" && h === 12) h = 0;
            return `${String(h).padStart(2, "0")}:${m}`;
          }
          // Handle "09:00" 24h format (local events)
          return t;
        };
        return normalizeTime(a.time).localeCompare(normalizeTime(b.time));
      });
    });
    return merged;
  }, [googleCal.isConnected, googleCal.eventsByDate, localEventsByDate]);

  const canGoPrev = useMemo(() => viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth()), [viewYear, viewMonth, minDate]);
  const canGoNext = useMemo(() => viewYear < maxDate.getFullYear() || (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth()), [viewYear, viewMonth, maxDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
    setSelectedDateKey(null);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
    setSelectedDateKey(null);
  };

  const handleLectureClick = (id: string) => setExpandedLecture(expandedLecture === id ? null : id);
  const updateLectureData = (id: string, data: Partial<{ pdfName: string | null; note: string }>) =>
    setLectureNotes((prev) => ({ ...prev, [id]: { ...prev[id], ...data } }));

  const openAddEventModal = (dateStr?: string) => {
    setEditingEventId(null);
    setNewEventTitle("");
    setNewEventDate(dateStr || toISODate(viewYear, viewMonth, selectedDateKey ? parseInt(selectedDateKey.split("-")[2]) : today.getDate()));
    setNewEventStart("09:00");
    setNewEventEnd("10:00");
    setNewEventLocation("");
    setShowAddEvent(true);
  };

  const openEditEventModal = (evt: LocalEvent) => {
    setEditingEventId(evt.id);
    setNewEventTitle(evt.title);
    setNewEventDate(evt.date);
    setNewEventStart(evt.startTime);
    setNewEventEnd(evt.endTime);
    setNewEventLocation(evt.location);
    setShowAddEvent(true);
  };

  const handleSaveEvent = () => {
    if (!newEventTitle.trim()) return;
    if (editingEventId) {
      // Edit existing
      const updated = localEvents.map((e) => e.id === editingEventId ? {
        ...e,
        title: newEventTitle.trim(),
        date: newEventDate,
        startTime: newEventStart,
        endTime: newEventEnd,
        location: newEventLocation.trim(),
      } : e);
      setLocalEvents(updated);
      // Sync to Firestore
      const evt = updated.find((e) => e.id === editingEventId);
      if (evt && user && db) {
        setDoc(doc(db, "events", evt.id), { ...evt, userId: user.uid }, { merge: true }).catch(() => {});
      }
    } else {
      // Add new
      const newEvent: LocalEvent = {
        id: `local-${Date.now()}`,
        title: newEventTitle.trim(),
        date: newEventDate,
        startTime: newEventStart,
        endTime: newEventEnd,
        location: newEventLocation.trim(),
        source: "local",
      };
      setLocalEvents([...localEvents, newEvent]);
      // Sync to Firestore
      if (user && db) {
        setDoc(doc(db, "events", newEvent.id), { ...newEvent, userId: user.uid }).catch(() => {});
      }
    }
    setNewEventTitle("");
    setNewEventLocation("");
    setEditingEventId(null);
    setShowAddEvent(false);
  };

  const handleDeleteLocalEvent = (id: string) => {
    setLocalEvents(localEvents.filter((e) => e.id !== id));
    // Also delete from Firestore
    if (db) {
      deleteDoc(doc(db, "events", id)).catch(() => {});
    }
  };

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
      refDay = (today.getFullYear() === viewYear && today.getMonth() === viewMonth) ? today.getDate() : 1;
    }
    const refDate = new Date(refYear, refMonth, refDay);
    const dow = refDate.getDay();
    const monday = new Date(refYear, refMonth, refDay - (dow === 0 ? 6 : dow - 1));
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
        key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
        label: dayLabelsEn[i], labelJp: dayLabelsJp[i],
      });
    }
    return days;
  }, [selectedDateKey, viewYear, viewMonth, today]);

  const monthLabel = isJp ? `${viewYear}年${viewMonth + 1}月` : `${monthsEn[viewMonth]} ${viewYear}`;

  // Events for today's vertical timeline
  const timelineEvents = useMemo(() => {
    const d = new Date();
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEvents = mergedEvents[key];
    if (dayEvents && dayEvents.length > 0) {
      return [{
        date: key,
        dateLabel: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        events: dayEvents,
      }];
    }
    return [];
  }, [mergedEvents]);

  // Helper: find LocalEvent from merged event for edit/delete
  const findLocalEvent = (evt: MergedEvent): LocalEvent | undefined => {
    if (evt.localEventId) return localEvents.find((e) => e.id === evt.localEventId);
    return undefined;
  };

  return (
    <div className="page-enter space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">
          {t(greetingKey)}, {profile?.name || "Student"}
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          {t("home.quote")}
        </p>
      </div>

      {/* Calendar + Weekly Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Monthly Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddEventModal()}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-moss text-white transition-colors hover:bg-moss-dark"
                  title={isJp ? "追加" : "Add Event"}
                >
                  <Plus className="h-4 w-4" />
                </button>
                {googleCal.isConfigured && (
                  googleCal.isConnected ? (
                    <button onClick={googleCal.disconnect} className="flex items-center gap-1.5 rounded-lg border border-ivory-deep px-2.5 py-1 text-[11px] font-medium text-stone hover:bg-maple/10 hover:text-maple transition-colors">
                      <Unlink className="h-3 w-3" />{isJp ? "切断" : "Disconnect"}
                    </button>
                  ) : (
                    <button onClick={googleCal.connect} disabled={googleCal.loading} className="flex items-center gap-1.5 rounded-lg bg-moss px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50">
                      {googleCal.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                      {isJp ? "Googleカレンダー" : "Google Calendar"}
                    </button>
                  )
                )}
                <button onClick={handlePrevMonth} disabled={!canGoPrev} className="flex h-7 w-7 items-center justify-center rounded-lg text-stone hover:bg-ivory-warm transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={handleNextMonth} disabled={!canGoNext} className="flex h-7 w-7 items-center justify-center rounded-lg text-stone hover:bg-ivory-warm transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {googleCal.error && <div className="mb-3 rounded-lg bg-maple/10 px-3 py-2 text-[11px] text-maple">{googleCal.error}</div>}

            {googleCal.isConnected && (
              <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-moss/5 px-3 py-1.5 text-[11px] text-moss">
                <Calendar className="h-3 w-3" />
                {isJp ? "Googleカレンダーと連携中" : "Connected to Google Calendar"}
                <span className="text-moss/40">·</span>
                {googleCal.events.length} {isJp ? "件" : "events"}
              </div>
            )}

            <div className="mb-2 grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase text-ink-muted">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, i) => {
                const key = dateKey(cell.year, cell.month, cell.day);
                const dayEvents = mergedEvents[key];
                const hasEvent = !!dayEvents;
                const isToday = key === todayKey;
                const isSelected = key === selectedDateKey;
                return (
                  <button key={i} onClick={() => setSelectedDateKey(isSelected ? null : key)}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all ${
                      isSelected ? "bg-moss font-bold text-white shadow-[var(--shadow-soft)]"
                      : isToday ? "bg-moss/10 font-bold text-moss ring-1 ring-moss/30"
                      : hasEvent ? "bg-gold/5 font-medium text-moss hover:bg-gold/10 cursor-pointer"
                      : cell.isCurrentMonth ? "text-ink hover:bg-ivory-warm/50 cursor-pointer"
                      : "text-ink-muted/40 hover:bg-ivory-warm/30 cursor-pointer"}`}>
                    {cell.day}
                    {hasEvent && !isSelected && !isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-gold" />}
                    {notesByDate[key] && notesByDate[key].length > 0 && !isSelected && !isToday && <div className="absolute bottom-1 left-[60%] h-1 w-1 rounded-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>

            {selectedDateKey && mergedEvents[selectedDateKey] && (
              <div className="mt-4 rounded-xl bg-gold/5 p-4 ring-1 ring-gold/20">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-sm font-semibold text-moss">
                    {monthsEn[parseInt(selectedDateKey.split("-")[1])]} {parseInt(selectedDateKey.split("-")[2])}
                  </h3>
                  <button onClick={() => setSelectedDateKey(null)} className="text-gold hover:text-gold-dark"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="space-y-2">
                  {mergedEvents[selectedDateKey].map((event, ei) => {
                    const localEvt = findLocalEvent(event);
                    return (
                      <div key={ei} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${event.source === "local" ? "bg-moss" : "bg-gold"}`} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-ink">{event.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                            <span>{event.time}{event.endTime ? `–${event.endTime}` : ""}</span>
                            {event.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{event.location}</span>}
                          </div>
                        </div>
                        {localEvt && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditEventModal(localEvt)} className="text-ink-muted hover:text-moss" title="Edit">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => handleDeleteLocalEvent(localEvt.id)} className="text-ink-muted hover:text-red-500" title="Delete">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-ivory-deep/40 pt-3">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-moss" /><span className="text-[11px] text-ink-muted">{t("home.calendar.today")}</span></div>
              <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-gold" /><span className="text-[11px] text-ink-muted">{t("home.calendar.hasEvents")}</span></div>
              <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-blue-500" /><span className="text-[11px] text-ink-muted">Lecture notes</span></div>
            </div>
          </div>
        </div>

        {/* Weekly Timeline (Vertical Calendar) */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
            <h2 className="mb-5 font-serif text-lg font-semibold text-ink">{t("home.week.title")}</h2>
            <div className="relative">
              <div className="absolute left-[68px] top-2 bottom-2 w-px bg-ivory-deep" />
              <div className="space-y-4">
                {weekDays.map((dayInfo, idx) => {
                  const dayEvents = mergedEvents[dayInfo.key] || [];
                  const isDaySelected = selectedDateKey === dayInfo.key;
                  const isToday = dayInfo.key === todayKey;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex w-[60px] flex-col items-end pt-0.5">
                        <button onClick={() => setSelectedDateKey(isDaySelected ? null : dayInfo.key)} className={`text-xs font-semibold transition-colors ${isDaySelected ? "text-moss" : "text-ink hover:text-moss"}`}>
                          {isJp ? dayInfo.labelJp : dayInfo.label}
                        </button>
                        <span className="text-[10px] text-ink-muted">{monthsEn[dayInfo.month].slice(0, 3)} {dayInfo.day}</span>
                      </div>
                      <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full border-2 border-white ${dayEvents.length > 0 ? "bg-moss" : "bg-stone-light"} ${isDaySelected ? "ring-2 ring-moss/20" : ""} ${isToday ? "ring-2 ring-moss/30" : ""}`} />
                      </div>
                      <div className={`flex-1 space-y-2 pb-1 rounded-xl p-1.5 -m-1.5 transition-colors ${isDaySelected ? "bg-moss/5" : ""}`}>
                        {dayEvents.length === 0 ? (
                          <p className="py-1 text-xs text-ink-muted">{t("home.week.noEvents")}</p>
                        ) : (
                          dayEvents.map((event, ei) => {
                            const lectureId = `${dayInfo.key}-${ei}`;
                            const isExpanded = expandedLecture === lectureId;
                            const lectureData = lectureNotes[lectureId] || { pdfName: null, note: "" };
                            const localEvt = findLocalEvent(event);
                            return (
                              <div key={ei} className="group/event">
                                <div className="flex items-center">
                                  <button onClick={() => { handleLectureClick(lectureId); setSelectedDateKey(dayInfo.key); }}
                                    className={`flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all ${isExpanded ? "bg-moss/5 ring-1 ring-moss/20" : "bg-ivory-warm/50 hover:bg-ivory-warm"}`}>
                                    <div className={`h-2 w-2 rounded-full shrink-0 ${event.source === "local" ? "bg-moss" : "bg-gold"}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-ink truncate">{event.title}</p>
                                      <p className="text-[11px] text-ink-muted truncate">
                                        {event.time}{event.endTime ? `–${event.endTime}` : ""}
                                        {event.location ? ` · ${event.location}` : ""}
                                      </p>
                                    </div>
                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-ink-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />}
                                  </button>
                                  {localEvt && (
                                    <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/event:opacity-100">
                                      <button onClick={() => openEditEventModal(localEvt)} className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:text-moss hover:bg-moss/5" title="Edit">
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => handleDeleteLocalEvent(localEvt.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50" title="Delete">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {isExpanded && (
                                  <div className="mt-1 rounded-xl bg-moss/5 p-4 ring-1 ring-moss/20">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2"><span className="w-16 text-[10px] font-medium text-ink-muted">{isJp ? "講義名" : "Lecture"}</span><span className="text-sm text-ink">{event.title}</span></div>
                                      <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-ink-muted" /><span className="text-xs text-ink-soft">{event.time}{event.endTime ? `–${event.endTime}` : ""}</span></div>
                                      {event.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-ink-muted" /><span className="text-xs text-ink-soft">{event.location}</span></div>}
                                    </div>
                                    <div className="mt-3 border-t border-moss/10 pt-3">
                                      <span className="mb-1 block text-[10px] font-medium text-ink-muted">{isJp ? "ノート" : "Quick Notes"}</span>
                                      <textarea value={lectureData.note} onChange={(e) => updateLectureData(lectureId, { note: e.target.value })}
                                        placeholder={isJp ? "ここにノートを書く..." : "Type your notes here..."}
                                        className="w-full rounded-lg border border-ivory-deep bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10 min-h-[60px] resize-y" />
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

      {/* Today's Timeline */}
      <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
        <h2 className="mb-5 font-serif text-lg font-semibold text-ink">
          {isJp ? "今日のタイムライン" : "Today's Timeline"}
        </h2>
        {timelineEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            {isJp ? "今日の予定はありません。" : "No events today."}
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-[80px] top-2 bottom-2 w-0.5 bg-ivory-deep" />
            <div className="space-y-6">
              {timelineEvents.map((dayGroup) => (
                <div key={dayGroup.date} className="flex gap-4">
                  <div className="flex w-[68px] flex-col items-end pt-0.5">
                    <span className="text-xs font-semibold text-ink">{dayGroup.dateLabel.split(",")[0]}</span>
                    <span className="text-[10px] text-ink-muted">{dayGroup.dateLabel.split(",").slice(1).join(",").trim()}</span>
                  </div>
                  <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                    <div className="h-3 w-3 rounded-full border-2 border-white bg-moss shadow-sm" />
                  </div>
                  <div className="flex-1 space-y-2 pb-1">
                    {dayGroup.events.map((evt, ei) => {
                      const localEvt = findLocalEvent(evt);
                      return (
                        <div key={ei} className="group/timeline flex items-center gap-3 rounded-xl bg-ivory-warm/40 px-4 py-3">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-moss">{evt.time}</span>
                            {evt.endTime && <span className="text-[9px] text-ink-muted">{evt.endTime}</span>}
                          </div>
                          <div className="h-8 w-px bg-ivory-deep" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">{evt.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                              {evt.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{evt.location}</span>}
                              <span>{evt.source === "local" ? "Local" : "Google"}</span>
                            </div>
                          </div>
                          {localEvt && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/timeline:opacity-100">
                              <button onClick={() => openEditEventModal(localEvt)} className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:text-moss hover:bg-moss/5" title="Edit">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDeleteLocalEvent(localEvt.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50" title="Delete">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Lecture Notes — notes tagged with today's date */}
        {notesByDate[todayKey] && notesByDate[todayKey].length > 0 && (
          <div className="mt-6 rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
            <h2 className="mb-4 font-serif text-lg font-semibold text-ink flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Today's Lecture Notes
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-500">{notesByDate[todayKey].length}</span>
            </h2>
            <div className="space-y-2">
              {notesByDate[todayKey].map((note) => (
                <div key={note.id} className="flex items-center gap-3 rounded-xl bg-blue-50/30 px-4 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{note.title}</p>
                    {note.category && <p className="text-[11px] text-ink-muted">{note.category}</p>}
                  </div>
                  <span className="text-[10px] text-blue-500">Lecture note</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      {showAddEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={() => { setShowAddEvent(false); setEditingEventId(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-float)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editingEventId ? "Edit Event" : "Add Event"}</h2>
              <button onClick={() => { setShowAddEvent(false); setEditingEventId(null); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Event title</label>
                <input
                  type="text"
                  autoFocus
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Study Group"
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Location</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="e.g., Library Room 204"
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-2.5 text-sm text-ink focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Start time</label>
                  <input
                    type="time"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-2.5 text-sm text-ink focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-muted">End time</label>
                  <input
                    type="time"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full rounded-xl border border-ivory-deep bg-white px-4 py-2.5 text-sm text-ink focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveEvent}
                disabled={!newEventTitle.trim()}
                className="w-full rounded-xl bg-moss py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
              >
                {editingEventId ? "Save Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
