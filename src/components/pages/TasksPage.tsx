"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X, Calendar, AlignLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { todayTasks, upcomingTasks, type TaskItem } from "@/lib/data";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Task extends TaskItem {
  content?: string;
  deadline?: string;
}

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isWithinNext7Days(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  return d > today && d <= in7Days;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function dateKey(dateStr: string) {
  return new Date(dateStr).toDateString();
}

export default function TasksPage() {
  const { t } = useTranslation();
  const [allTasks, setAllTasks] = useLocalStorage<Task[]>("studyspace_tasks_all", [
    ...todayTasks.map((t) => ({ ...t, content: "", deadline: "" })),
    ...upcomingTasks.map((t) => ({ ...t, content: "", deadline: "" })),
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // Split tasks: today (deadline is today or no deadline) vs next 7 days vs overdue
  const today = allTasks.filter((task) => !task.deadline || isToday(task.deadline));
  const overdue = allTasks.filter((task) => isOverdue(task.deadline));

  // Group upcoming (next 7 days) tasks by their exact due date
  const next7Days = allTasks.filter((task) => isWithinNext7Days(task.deadline));
  const groupedUpcoming = next7Days
    .reduce<{ dateKey: string; tasks: Task[] }[]>((acc, task) => {
      const key = dateKey(task.deadline!);
      const existing = acc.find((g) => g.dateKey === key);
      if (existing) {
        existing.tasks.push(task);
      } else {
        acc.push({ dateKey: key, tasks: [task] });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());

  const toggleTask = (id: number) => {
    setAllTasks(allTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      done: false,
      content: newTaskContent.trim() || undefined,
      deadline: newTaskDeadline || undefined,
    };
    setAllTasks([...allTasks, newTask]);
    setNewTaskTitle("");
    setNewTaskContent("");
    setNewTaskDeadline("");
    setShowAddForm(false);
  };

  const handleDeleteTask = (id: number) => {
    setAllTasks(allTasks.filter((t) => t.id !== id));
    if (expandedTaskId === id) setExpandedTaskId(null);
  };

  const handleClearCompleted = () => {
    setAllTasks(allTasks.filter((t) => !t.done));
  };

  const TaskRow = ({ task, listLabel }: { task: Task; listLabel: string }) => (
    <div className="group border-b border-stone-100 last:border-0">
      <div className={`flex items-center gap-3 py-3.5 transition-opacity ${task.done ? "opacity-40" : "opacity-100"}`}>
        <button
          onClick={() => toggleTask(task.id)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            task.done
              ? "border-sage-500 bg-moss"
              : "border-ivory-deep bg-white hover:border-sage-400"
          }`}
        >
          {task.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
        >
          <span className={`text-sm transition-all duration-200 ${task.done ? "text-ink-muted line-through" : "text-ink"}`}>
            {task.title}
          </span>
          {task.deadline && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-ivory-warm px-2 py-0.5 text-[10px] font-medium text-ink-muted">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(task.deadline)}
            </span>
          )}
        </div>
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Expanded content */}
      {expandedTaskId === task.id && (
        <div className="pb-3 pl-8 pr-4">
          {task.content && (
            <div className="mb-2 rounded-lg bg-ivory-warm/40 p-2.5">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Content</p>
              <p className="text-xs text-ink-soft">{task.content}</p>
            </div>
          )}
          {task.deadline && (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Calendar className="h-3 w-3" />
              Due: {new Date(task.deadline).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          )}
          {!task.content && !task.deadline && (
            <p className="text-[11px] text-ink-muted">No additional details.</p>
          )}
        </div>
      )}
    </div>
  );

  const todayCount = today.filter((t) => !t.done).length;
  const completedCount = allTasks.filter((t) => t.done).length;

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

      {/* Add task form — with content + deadline fields */}
      {showAddForm && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                placeholder="Task title..."
                className="flex-1 rounded-lg border border-ivory-deep bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
              />
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="rounded-lg border border-ivory-deep bg-white px-3 py-2 text-xs text-ink-soft focus:outline-none focus:border-moss/30"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <AlignLeft className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Task content / details (optional)..."
                  className="w-full rounded-lg border border-ivory-deep bg-white py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="rounded-lg bg-moss px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewTaskTitle(""); setNewTaskContent(""); setNewTaskDeadline(""); }}
                className="rounded-lg px-2 text-ink-muted hover:bg-ivory-warm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overdue tasks */}
      {overdue.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
            Overdue
          </h2>
          <div className="rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} listLabel="overdue" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("tasks.today")}
          </h2>
          <div className="rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
            {today.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">All done! 🎉</p>
            ) : (
              today.map((task) => (
                <TaskRow key={task.id} task={task} listLabel="today" />
              ))
            )}
          </div>
        </div>

        {/* Next 7 Days — grouped by specific due date */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Next 7 Days
          </h2>
          {groupedUpcoming.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
              <p className="py-6 text-center text-sm text-ink-muted">Nothing in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedUpcoming.map((group) => (
                <div key={group.dateKey}>
                  <p className="mb-1.5 px-1 text-[11px] font-semibold text-ink-soft">
                    {formatFullDate(group.dateKey)}
                  </p>
                  <div className="rounded-2xl bg-white px-5 shadow-[var(--shadow-card)]">
                    {group.tasks.map((task) => (
                      <TaskRow key={task.id} task={task} listLabel="upcoming" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
