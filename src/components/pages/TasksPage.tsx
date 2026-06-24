"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { todayTasks, upcomingTasks, type TaskItem } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Task {
  id: number;
  title: string;
  done: boolean;
}

export default function TasksPage() {
  const { t } = useTranslation();
  const [today, setToday] = useLocalStorage<Task[]>("studyspace_tasks_today", todayTasks as Task[]);
  const [upcoming, setUpcoming] = useLocalStorage<Task[]>("studyspace_tasks_upcoming", upcomingTasks as Task[]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskList, setNewTaskList] = useState<"today" | "upcoming">("today");
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleTask = (list: "today" | "upcoming", id: number) => {
    const setter = list === "today" ? setToday : setUpcoming;
    const current = list === "today" ? today : upcoming;
    setter(current.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      done: false,
    };
    if (newTaskList === "today") {
      setToday([...today, newTask]);
    } else {
      setUpcoming([...upcoming, newTask]);
    }
    setNewTaskTitle("");
    setShowAddForm(false);
  };

  const handleClearCompleted = () => {
    setToday(today.filter((t) => !t.done));
    setUpcoming(upcoming.filter((t) => !t.done));
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
            ? "border-sage-500 bg-moss"
            : "border-ivory-deep bg-white hover:border-sage-400"
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
  const completedCount = today.filter((t) => t.done).length + upcoming.filter((t) => t.done).length;

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">{t("tasks.title")}</h1>
          <p className="text-sm text-ink-soft">
            {todayCount} {t("tasks.remaining")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-moss-dark"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="flex items-center gap-1.5 rounded-xl border border-ivory-deep px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      {/* Add task form */}
      {showAddForm && (
        <div className="mt-4 flex gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]">
          <select
            value={newTaskList}
            onChange={(e) => setNewTaskList(e.target.value as "today" | "upcoming")}
            className="rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink-soft focus:outline-none"
          >
            <option value="today">{t("tasks.today")}</option>
            <option value="upcoming">{t("tasks.upcoming")}</option>
          </select>
          <input
            type="text"
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Type a task title..."
            className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className="rounded-lg bg-moss px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddForm(false); setNewTaskTitle(""); }}
            className="rounded-lg px-2 text-ink-muted hover:bg-ivory-warm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("tasks.today")}
          </h2>
          <div className="divide-y divide-stone-100 rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {today.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">All done! 🎉</p>
            ) : (
              today.map((task) => (
                <TaskItem key={task.id} task={task} list="today" />
              ))
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("tasks.upcoming")}
          </h2>
          <div className="divide-y divide-stone-100 rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">Nothing upcoming.</p>
            ) : (
              upcoming.map((task) => (
                <TaskItem key={task.id} task={task} list="upcoming" />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
