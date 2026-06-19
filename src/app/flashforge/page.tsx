"use client";

import { useState, useEffect } from "react";

type Card = { id: number; front: string; back: string };

export default function FlashforgePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [due, setDue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  useEffect(() => {
    fetch("/api/flashforge")
      .then((r) => r.json())
      .then((data) => {
        setCards(data.cards || []);
        setDue(data.due || []);
      });
  }, []);

  async function addCard() {
    const res = await fetch("/api/flashforge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front, back }),
    });
    const card = await res.json();
    setCards((prev) => [...prev, card]);
    setDue((prev) => [...prev, card]);
    setFront("");
    setBack("");
  }

  async function grade(quality: number) {
    const card = due[index];
    if (!card) return;
    await fetch("/api/flashforge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, quality }),
    });
    setShowBack(false);
    if (index + 1 >= due.length) {
      setDue((d) => d.filter((c) => c.id !== card.id));
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
  }

  const card = due[index];

  return (
    <section className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Flashforge</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Spaced-repetition flashcards for long-term retention.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <input
          className="rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Front (question)"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <input
          className="rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Back (answer)"
          value={back}
          onChange={(e) => setBack(e.target.value)}
        />
        <button
          onClick={addCard}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Card
        </button>
      </div>

      <p className="mt-4 text-sm text-zinc-500">Cards: {cards.length} | Due: {due.length}</p>

      {card ? (
        <div className="mt-6">
          <div
            onClick={() => setShowBack((s) => !s)}
            className="flex h-56 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-xl font-medium shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            {showBack ? card.back : card.front}
          </div>
          {showBack && (
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={() => grade(0)} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Again</button>
              <button onClick={() => grade(1)} className="rounded bg-yellow-500 px-4 py-2 text-sm text-white hover:bg-yellow-600">Good</button>
              <button onClick={() => grade(2)} className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Easy</button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 text-center text-zinc-500">All caught up!</p>
      )}
    </section>
  );
}
