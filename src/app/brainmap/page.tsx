"use client";

import { useState } from "react";

type NodeItem = { id: string; label: string; x: number; y: number };
type EdgeItem = { from: string; to: string };

export default function BrainmapPage() {
  const [topic, setTopic] = useState("");
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: "1", label: "Main Idea", x: 300, y: 200 },
    { id: "2", label: "Sub-concept A", x: 150, y: 100 },
    { id: "3", label: "Sub-concept B", x: 450, y: 100 },
    { id: "4", label: "Detail 1", x: 100, y: 300 },
    { id: "5", label: "Detail 2", x: 500, y: 300 },
  ]);
  const [edges, setEdges] = useState<EdgeItem[]>([
    { from: "1", to: "2" },
    { from: "1", to: "3" },
    { from: "2", to: "4" },
    { from: "3", to: "5" },
  ]);
  const [loading, setLoading] = useState(false);

  async function generateMap() {
    setLoading(true);
    const res = await fetch("/api/brainmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.nodes && data.edges) {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  }

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mx-auto flex max-w-5xl gap-2 px-4 py-4">
        <input
          className="flex-1 rounded border p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Enter a topic to generate a concept map"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={generateMap}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Generate"}
        </button>
      </div>
      <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-900">
        <svg className="absolute inset-0 h-full w-full">
          {edges.map((e, i) => {
            const fromNode = nodes.find((n) => n.id === e.from)!;
            const toNode = nodes.find((n) => n.id === e.to)!;
            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="currentColor"
                className="text-zinc-400 dark:text-zinc-600"
                strokeWidth={2}
              />
            );
          })}
          {nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x - 60}
                y={n.y - 20}
                width={120}
                height={40}
                rx={8}
                className="fill-white stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-600"
                strokeWidth={1}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                className="fill-zinc-800 text-xs dark:fill-zinc-200"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
