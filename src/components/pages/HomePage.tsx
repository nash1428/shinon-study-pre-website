"use client";

import { Sparkles, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { userData, motivationalQuotes, todaySchedule } from "@/lib/data";

// Calendar data
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentDay = 22;
const daysInMonth = 30;
const firstDayOffset = 0; // June 1 is a Sunday
const deadlineDays = [5, 12, 18, 22, 25, 28]; // days with deadlines/classes

// Weekly timeline data
const weekSchedule = [
  {
    day: "Monday",
    events: [
      { time: "09:00 AM", title: "Data Structures", room: "Gates 100", color: "sage" },
      { time: "02:00 PM", title: "Linear Algebra", room: "Math 340", color: "sage" },
    ],
  },
  {
    day: "Tuesday",
    events: [
      { time: "11:00 AM", title: "Macroeconomics", room: "Econ 220", color: "lavender" },
    ],
  },
  {
    day: "Wednesday",
    events: [
      { time: "09:00 AM", title: "Data Structures — Lab", room: "Gates B1", color: "sage" },
      { time: "04:00 PM", title: "Japanese I", room: "Lang 112", color: "lavender" },
    ],
  },
  {
    day: "Thursday",
    events: [
      { time: "11:00 AM", title: "Macroeconomics", room: "Econ 220", color: "lavender" },
      { time: "02:00 PM", title: "Linear Algebra", room: "Math 340", color: "sage" },
    ],
  },
  {
    day: "Friday",
    events: [
      { time: "04:00 PM", title: "Japanese I — Oral Practice", room: "Lang 112", color: "lavender" },
    ],
  },
];

export default function HomePage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const quote = motivationalQuotes[0];

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">
          {greeting}, {userData.name}! 👋
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
          <Sparkles className="h-4 w-4 text-sage-500" />
          {quote}
        </p>
      </div>

      {/* Two-column layout: Calendar + Weekly Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Monthly Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">June 2026</h2>
              <div className="flex gap-1">
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase text-ink-muted">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
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

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-sage-500" />
                <span className="text-[11px] text-ink-muted">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-sage-400" />
                <span className="text-[11px] text-ink-muted">Has events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Vertical Timeline */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-5 text-lg font-semibold text-ink">This Week</h2>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[68px] top-2 bottom-2 w-px bg-stone-200" />

              <div className="space-y-6">
                {weekSchedule.map((day, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Day label + node */}
                    <div className="flex w-[60px] flex-col items-end pt-0.5">
                      <span className="text-xs font-semibold text-ink">{day.day}</span>
                    </div>

                    {/* Node dot on the timeline */}
                    <div className="relative flex w-[16px] shrink-0 justify-center pt-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full border-2 border-white ${
                        day.events.length > 0 ? "bg-sage-400" : "bg-stone-300"
                      }`} />
                    </div>

                    {/* Events */}
                    <div className="flex-1 space-y-2 pb-1">
                      {day.events.length === 0 ? (
                        <p className="py-1 text-xs text-ink-muted">No events</p>
                      ) : (
                        day.events.map((event, ei) => (
                          <div
                            key={ei}
                            className="flex items-center gap-3 rounded-xl bg-cream-dark px-4 py-2.5"
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                event.color === "sage" ? "bg-sage-400" : "bg-lavender-300"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ink">{event.title}</p>
                              <p className="text-[11px] text-ink-muted">{event.room}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                          </div>
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

      {/* Profile card — below */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-xl font-bold text-sage-700">
            {userData.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">{userData.name}</h2>
            <p className="text-xs text-ink-soft">{userData.university}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{userData.semester}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
