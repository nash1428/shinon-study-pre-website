"use client";

import { Block } from "@/lib/blockSchema";
import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import ToggleBlock from "./ToggleBlock";
import CalloutBlock from "./CalloutBlock";
import ListBlock from "./ListBlock";
import QuoteBlock from "./QuoteBlock";
import CodeBlock from "./CodeBlock";
import MediaBlock from "./MediaBlock";
import EmbedBlock from "./EmbedBlock";
import TableBlock from "./TableBlock";
import DividerBlock from "./DividerBlock";
import AIAssistantBlock from "./AIAssistantBlock";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  onAddBlock?: (b: Block) => void;
}

export default function BlockRenderer({ block, onChange, onAddBlock }: Props) {
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
    case "video":
      return <MediaBlock block={block} onChange={onChange} />;
    case "embed":
      return <EmbedBlock block={block} onChange={onChange} />;
    case "table":
      return <TableBlock block={block} onChange={onChange} />;
    case "divider":
      return <DividerBlock />;
    case "ai_assistant":
      return <AIAssistantBlock block={block} onChange={onChange} onAddBlock={onAddBlock} />;
    default:
      return <div className="text-red-500">Unknown block type: {(block as any).type}</div>;
  }
}
