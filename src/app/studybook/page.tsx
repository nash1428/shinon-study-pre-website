"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function StudybookPage() {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateOutline() {
    setLoading(true);
    const res = await fetch("/api/studybook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, mode: "outline" }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.outline) setContent(data.outline);
  }

  async function summarise() {
    setLoading(true);
    const res = await fetch("/api/studybook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, mode: "summarise" }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.summary) setSummary(data.summary);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Studybook</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Organised, AI-assisted note-taking inspired by NotebookLM.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Enter a study topic (e.g., Photosynthesis)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={generateOutline}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "AI Outline"}
        </button>
      </div>

      <textarea
        className="mt-4 h-64 w-full rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Your notes appear here (editable)…"
      />

      <button
        onClick={summarise}
        disabled={loading || !content.trim()}
        className="mt-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Summarise"}
      </button>

      {content && (
        <article className="prose prose-sm mt-6 max-w-none rounded bg-zinc-50 p-4 dark:bg-zinc-900">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      )}
      {summary && (
        <div className="mt-6 rounded bg-zinc-100 p-4 dark:bg-zinc-800">
          <h2 className="text-lg font-semibold">Key Takeaways</h2>
          <p className="mt-1 text-sm">{summary}</p>
        </div>
      )}
    </section>
  );
}
