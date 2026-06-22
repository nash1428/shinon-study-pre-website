"use client";

import type { CSSProperties } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import type { Block } from "@/lib/types";
import { BlockRenderer } from "./BlockRenderer";

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onSummarise?: (blockId: string) => void;
}

function createParagraphBlock(): Block {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: "paragraph",
    data: { text: "" },
    metadata: { createdAt: now, updatedAt: now },
  };
}

interface SortableBlockProps {
  block: Block;
  onChange: (block: Block) => void;
  onSummarise?: (blockId: string) => void;
  onAddBelow: () => void;
}

function SortableBlock({
  block,
  onChange,
  onSummarise,
  onAddBelow,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative py-0.5 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="absolute -left-8 top-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="cursor-grab rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
          style={{ touchAction: "none" }}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          onClick={onAddBelow}
          title="Add block below"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <BlockRenderer block={block} onChange={onChange} onSummarise={onSummarise} />
    </div>
  );
}

export function BlockEditor({ blocks, onChange, onSummarise }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const updateBlock = (updated: Block) =>
    onChange(blocks.map((b) => (b.id === updated.id ? updated : b)));

  const addBelow = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...blocks];
    next.splice(idx + 1, 0, createParagraphBlock());
    onChange(next);
  };

  const addBlock = () => onChange([...blocks, createParagraphBlock()]);

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((b) => (
            <SortableBlock
              key={b.id}
              block={b}
              onChange={updateBlock}
              onSummarise={onSummarise}
              onAddBelow={() => addBelow(b.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addBlock}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-200 py-2 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-700"
      >
        <Plus className="h-4 w-4" /> Add block
      </button>
    </div>
  );
}
