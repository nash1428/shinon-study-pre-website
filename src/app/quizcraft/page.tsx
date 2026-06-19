"use client";

import { useState } from "react";

type Question = { q: string; options: string[]; answer: number };

export default function QuizcraftPage() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  async function generate() {
    setLoading(true);
    setFinished(false);
    setCurrent(0);
    setScore(0);
    const res = await fetch("/api/quizcraft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.questions) setQuestions(data.questions);
  }

  function handleAnswer(index: number) {
    if (index === questions[current].answer) setScore((s) => s + 1);
    if (current + 1 >= questions.length) setFinished(true);
    else setCurrent((c) => c + 1);
  }

  if (!questions.length) {
    return (
      <section className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-bold">Quizcraft</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Auto-generated practice questions with instant feedback.
        </p>
        <div className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Topic (e.g., Newton's laws)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            onClick={generate}
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Generate"}
          </button>
        </div>
      </section>
    );
  }

  const q = questions[current];

  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">Quizcraft</h1>
      {finished ? (
        <div className="mt-6 rounded bg-zinc-100 p-6 text-center dark:bg-zinc-900">
          <p className="text-lg font-semibold">
            Score: {score}/{questions.length}
          </p>
          <button
            onClick={() => setQuestions([])}
            className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try another topic
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-lg font-medium">
            Q{current + 1}. {q.q}
          </p>
          <ul className="mt-4 space-y-2">
            {q.options.map((opt, i) => (
              <li key={i}>
                <button
                  onClick={() => handleAnswer(i)}
                  className="w-full rounded border p-3 text-left text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
