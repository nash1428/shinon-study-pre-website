"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { todayTasks, upcomingTasks } from "@/lib/data";

interface Task {
  id: number;
  title: string;
  done: boolean;
}

export default function TasksPage() {
  const { t } = useTranslation();
  const [today, setToday] = useState<Task[]>(todayTasks);
  const [upcoming, setUpcoming] = useState<Task[]>(upcomingTasks);

  const toggleTask = (list: "today" | "upcoming", id: number) => {
    const setter = list === "today" ? setToday : setUpcoming;
    const current = list === "today" ? today : upcoming;
    setter(current.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const TaskItem = ({ task, list }: { task: Task; list: "today" | "upcoming" }) => (
    <div
      className={`flex items-center gap-3 py-3.5 transition-opacity ${
        task.done ? "opacity-40" : "opacity-100"
      }`}
    >
      <button
        onClick={() => toggleTask(list, task.id)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
          task.done
            ? "border-sage-500 bg-sage-500"
            : "border-stone-300 bg-white hover:border-sage-400"
        }`}
      >
        {task.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <span
        className={`text-sm transition-all duration-200 ${
          task.done ? "text-ink-muted line-through" : "text-ink"
        }`}
      >
        {task.title}
      </span>
    </div>
  );

  const todayCount = today.filter((t) => !t.done).length;

  return (
    <div className="page-enter">
      <h1 className="text-3xl font-bold text-ink">{t("tasks.title")}</h1>
      <p className="mb-6 text-sm text-ink-soft">
        {todayCount} {t("tasks.remaining")}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("tasks.today")}
          </h2>
          <div className="divide-y divide-stone-100 rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {today.map((task) => (
              <TaskItem key={task.id} task={task} list="today" />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("tasks.upcoming")}
          </h2>
          <div className="divide-y divide-stone-100 rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {upcoming.map((task) => (
              <TaskItem key={task.id} task={task} list="upcoming" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
