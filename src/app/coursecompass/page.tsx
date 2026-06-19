"use client";

import { useState } from "react";

type Resource = { title: string; url: string; why: string };

export default function CoursecompassPage() {
  const [topic, setTopic] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchResources() {
    setLoading(true);
    const res = await fetch("/api/coursecompass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.resources) setResources(data.resources);
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">Coursecompass</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        AI-curated learning paths and peer-reviewed resources.
      </p>
      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Topic (e.g., Linear Algebra)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={fetchResources}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Find"}
        </button>
      </div>
      <ul className="mt-8 space-y-4">
        {resources.map((r, i) => (
          <li key={i} className="rounded border p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {r.title}
            </a>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{r.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
