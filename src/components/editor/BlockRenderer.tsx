"use client";

import type { Block } from "@/lib/types";
import {
  HeadingBlock,
  ParagraphBlock,
  ToggleBlock,
  CalloutBlock,
  ListBlock,
  QuoteBlock,
  CodeBlock,
  ImageBlock,
  EmbedBlock,
  TableBlock,
  DividerBlock,
  AIAssistantBlock,
} from "./blocks/BlockComponents";

interface Props {
  block: Block;
  onChange: (block: Block) => void;
  onSummarise?: (blockId: string) => void;
}

export function BlockRenderer({ block, onChange, onSummarise }: Props) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} onChange={onChange} />;
    case "paragraph":
      return <ParagraphBlock block={block} onChange={onChange} />;
    case "toggle":
      return <ToggleBlock block={block} onChange={onChange} />;
    case "callout":
      return <CalloutBlock block={block} onChange={onChange} />;
    case "bulleted_list":
    case "numbered_list":
      return <ListBlock block={block} onChange={onChange} />;
    case "quote":
      return <QuoteBlock block={block} onChange={onChange} />;
    case "code":
      return <CodeBlock block={block} onChange={onChange} />;
    case "image":
      return <ImageBlock block={block} onChange={onChange} />;
    case "embed":
      return <EmbedBlock block={block} onChange={onChange} />;
    case "table":
      return <TableBlock block={block} onChange={onChange} />;
    case "divider":
      return <DividerBlock />;
    case "ai_assistant":
      return (
        <AIAssistantBlock
          block={block}
          onChange={onChange}
          onSummarise={onSummarise}
        />
      );
    default:
      return (
        <div className="text-red-500">Unknown block type: {(block as Block).type}</div>
      );
  }
}
