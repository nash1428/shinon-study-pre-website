import React, { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block, createBlock } from "@/lib/blockSchema";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { BlockToolbar } from "@/components/toolbar/BlockToolbar";

interface SortableBlockProps {
  block: Block;
  onChange: (b: Block) => void;
  onAddBelow: (b: Block) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({
  block,
  onChange,
  onAddBelow,
  onDuplicate,
  onDelete,
  onAddChild,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded px-2 py-1 hover:bg-gray-50"
    >
      <BlockToolbar
        block={block}
        onChange={onChange}
        onAddBelow={onAddBelow}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddChild={onAddChild}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      <BlockRenderer block={block} onChange={onChange} onAddBlock={onAddBelow} />
    </div>
  );
};

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export const PageEditor: React.FC<Props> = ({ blocks, onChange }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getIndex = useCallback(
    (id: string) => blocks.findIndex((b) => b.id === id),
    [blocks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = getIndex(active.id as string);
      const newIndex = getIndex(over.id as string);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
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

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  return (
    <div className="min-h-screen bg-notion-bg">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <div className="rounded-lg bg-white p-8 shadow-notion">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
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
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeBlock ? (
                <div className="rounded bg-white p-2 shadow-lg">
                  <BlockRenderer block={activeBlock} onChange={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-dashed border-gray-300 py-2 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600"
            onClick={() => onChange([...blocks, createBlock("paragraph")])}
          >
            + Add a block
          </button>
        </div>
      </div>
    </div>
  );
};
