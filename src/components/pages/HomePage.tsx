"use client";

import { Sparkles, MapPin, Clock } from "lucide-react";
import { userData, motivationalQuotes, todaySchedule } from "@/lib/data";

export default function HomePage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const quote = motivationalQuotes[0];

  return (
    <div className="page-enter px-5 py-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {greeting}, {userData.name}! 👋
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <Sparkles className="h-3.5 w-3.5 text-sage-500" />
          {quote}
        </p>
      </div>

      {/* Profile Card */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-xl font-bold text-sage-700">
            {userData.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">{userData.name}</h2>
            <p className="flex items-center gap-1 text-xs text-ink-soft">
              <MapPin className="h-3 w-3" />
              {userData.university}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">{userData.semester}</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Today's Schedule</h3>
        <div className="space-y-2">
          {todaySchedule.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-[var(--shadow-soft)]"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  item.color === "sage" ? "bg-sage-400" : "bg-lavender-300"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.course}</p>
                <p className="text-xs text-ink-muted">{item.room}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-ink-soft">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
