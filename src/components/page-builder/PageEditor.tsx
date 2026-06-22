"use client";

import { useState } from "react";
import { Block, createBlock } from "@/lib/blockSchema";
import BlockRenderer from "./BlockRenderer";
import BlockToolbar from "./BlockToolbar";

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function PageEditor({ blocks, onChange }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const getIndex = (id: string) => blocks.findIndex((b) => b.id === id);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggingId) setDropTargetId(id);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setDropTargetId(null);
    if (draggedId === targetId) return;
    const from = getIndex(draggedId);
    const to = getIndex(targetId);
    if (from < 0 || to < 0) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const updateBlock = (id: string, updater: (b: Block) => Block) => {
    onChange(blocks.map((b) => (b.id === id ? updater(b) : b)));
  };

  const addBlockBelow = (id: string, block: Block) => {
    const idx = getIndex(id);
    const next = [...blocks];
    next.splice(idx + 1, 0, block);
    onChange(next);
  };

  const duplicateBlock = (id: string) => {
    const idx = getIndex(id);
    const original = blocks[idx];
    const clone: Block = {
      ...original,
      id: createBlock(original.type).id,
      data: { ...original.data },
      children: original.children
        ? original.children.map((c) => ({
            ...c,
            id: createBlock(c.type).id,
            data: { ...c.data },
          }))
        : undefined,
    };
    const next = [...blocks];
    next.splice(idx + 1, 0, clone);
    onChange(next);
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const addChildBlock = (id: string) => {
    updateBlock(id, (b) => ({
      ...b,
      children: [...(b.children || []), createBlock("paragraph")],
    }));
  };

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <div
          key={block.id}
          className={`group relative rounded border px-2 py-1 transition-colors ${
            dropTargetId === block.id
              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
              : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
          } ${draggingId === block.id ? "opacity-40" : ""}`}
          draggable
          onDragStart={(e) => handleDragStart(e, block.id)}
          onDragOver={(e) => handleDragOver(e, block.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, block.id)}
          data-block-id={block.id}
        >
          <BlockToolbar
            block={block}
            onChange={(updated) => updateBlock(block.id, () => updated)}
            onAddBelow={(b) => addBlockBelow(block.id, b)}
            onDuplicate={() => duplicateBlock(block.id)}
            onDelete={() => deleteBlock(block.id)}
            onAddChild={
              block.type === "toggle" || block.type === "callout"
                ? () => addChildBlock(block.id)
                : undefined
            }
            onDragStart={handleDragStart}
          />
          <BlockRenderer
            block={block}
            onChange={(updated) => updateBlock(block.id, () => updated)}
            onAddBlock={(b) => addBlockBelow(block.id, b)}
          />
        </div>
      ))}
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-dashed border-zinc-300 dark:border-zinc-700 py-2 text-sm text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        onClick={() => onChange([...blocks, createBlock("paragraph")])}
      >
        + Add a block
      </button>
    </div>
  );
}
