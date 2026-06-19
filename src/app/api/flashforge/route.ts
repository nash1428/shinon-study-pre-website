import { NextResponse } from "next/server";

// In-memory store for MVP (replace with DB later)
let cards: { id: number; front: string; back: string; box: number; nextReview: number }[] = [
  { id: 1, front: "What is the powerhouse of the cell?", back: "Mitochondria", box: 0, nextReview: Date.now() },
  { id: 2, front: "What does DNA stand for?", back: "Deoxyribonucleic acid", box: 0, nextReview: Date.now() },
  { id: 3, front: "Speed of light", back: "299,792,458 m/s", box: 1, nextReview: Date.now() + 86400000 },
];
let nextId = 4;

export async function GET() {
  const due = cards.filter((c) => c.nextReview <= Date.now());
  return NextResponse.json({ cards, due });
}

export async function POST(req: Request) {
  try {
    const { front, back } = await req.json();
    const card = {
      id: nextId++,
      front,
      back,
      box: 0,
      nextReview: Date.now(),
    };
    cards.push(card);
    return NextResponse.json(card);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, quality } = await req.json();
    const card = cards.find((c) => c.id === id);
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (quality < 1) {
      card.box = 0;
    } else {
      card.box += quality;
    }
    const days = Math.max(1, card.box);
    card.nextReview = Date.now() + days * 86400000;
    return NextResponse.json(card);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
