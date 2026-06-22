import React, { useState } from "react";
import { Block, BlockType, BLOCK_TYPES, createBlock } from "@/lib/blockSchema";
import { GripVertical, Plus, Copy, Trash2, ChevronDown } from "lucide-react";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  onAddBelow: (b: Block) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  dragHandleProps?: Record<string, any>;
}

const TYPE_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  toggle: "Toggle",
  callout: "Callout",
  bulleted_list: "Bulleted List",
  numbered_list: "Numbered List",
  quote: "Quote",
  code: "Code",
  image: "Image",
  video: "Video",
  embed: "Embed",
  table: "Table",
  divider: "Divider",
  ai_assistant: "AI Assistant",
};

export const BlockToolbar: React.FC<Props> = ({
  block,
  onChange,
  onAddBelow,
  onDuplicate,
  onDelete,
  onAddChild,
  dragHandleProps,
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const changeType = (type: BlockType) => {
    onChange(createBlock(type, { id: block.id, children: block.children }));
    setShowTypeMenu(false);
  };

  return (
    <div className="group/toolbar absolute -left-10 top-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="relative">
        <button
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={() => setShowTypeMenu((s) => !s)}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        {showTypeMenu && (
          <div className="absolute left-0 top-6 z-20 w-40 rounded border border-gray-200 bg-white shadow-lg">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t}
                className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                  t === block.type ? "font-bold text-blue-600" : "text-gray-700"
                }`}
                onClick={() => changeType(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onClick={() => onAddBelow(createBlock("paragraph"))}
        title="Add block below"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onClick={onDuplicate}
        title="Duplicate"
      >
        <Copy className="h-4 w-4" />
      </button>
      {onAddChild && (
        <button
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={onAddChild}
          title="Add child block"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
      <button
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
        onClick={onDelete}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
