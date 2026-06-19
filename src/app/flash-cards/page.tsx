"use client";

import { useState } from "react";

type Card = { front: string; back: string };

export default function FlashCardsPage() {
  const [cards, setCards] = useState<Card[]>([
    { front: "What is the powerhouse of the cell?", back: "Mitochondria" },
    { front: "What does DNA stand for?", back: "Deoxyribonucleic acid" },
    { front: "Speed of light", back: "299,792,458 m/s" },
  ]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  function next() {
    setShowBack(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function prev() {
    setShowBack(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  const card = cards[index];

  return (
    <section className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Flash Cards</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Click the card to reveal the answer.
      </p>
      {card && (
        <div className="mt-8">
          <div
            onClick={() => setShowBack((s) => !s)}
            className="flex h-56 items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-xl font-medium shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            {showBack ? card.back : card.front}
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={prev}
              className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Previous
            </button>
            <button
              onClick={next}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Card {index + 1} of {cards.length}
      </p>
    </section>
  );
}
