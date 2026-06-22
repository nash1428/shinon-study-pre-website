export interface Block {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "toggle"
    | "callout"
    | "bulleted_list"
    | "numbered_list"
    | "quote"
    | "code"
    | "image"
    | "video"
    | "embed"
    | "table"
    | "divider"
    | "ai_assistant";
  data: Record<string, any>;
  children?: Block[];
}

export type BlockType = Block["type"];

export const BLOCK_TYPES: BlockType[] = [
  "heading",
  "paragraph",
  "toggle",
  "callout",
  "bulleted_list",
  "numbered_list",
  "quote",
  "code",
  "image",
  "video",
  "embed",
  "table",
  "divider",
  "ai_assistant",
];

export function createBlock(type: BlockType, overrides: Partial<Block> = {}): Block {
  const defaults: Record<BlockType, Record<string, any>> = {
    heading: { text: "", level: 2 },
    paragraph: { text: "" },
    toggle: { title: "" },
    callout: { text: "", icon: "💡" },
    bulleted_list: { text: "" },
    numbered_list: { text: "" },
    quote: { text: "" },
    code: { text: "", language: "typescript" },
    image: { src: "", alt: "" },
    video: { src: "" },
    embed: { url: "" },
    table: { headers: ["", ""], rows: [] },
    divider: {},
    ai_assistant: { prompt: "" },
  };

  return {
    id: crypto.randomUUID(),
    type,
    data: { ...defaults[type] },
    children: type === "toggle" || type === "callout" ? [] : undefined,
    ...overrides,
  };
}

export function validateBlock(block: unknown): block is Block {
  if (typeof block !== "object" || block === null) return false;
  const b = block as Record<string, unknown>;
  if (typeof b.id !== "string") return false;
  if (typeof b.type !== "string") return false;
  if (!BLOCK_TYPES.includes(b.type as BlockType)) return false;
  if (typeof b.data !== "object" || b.data === null) return false;
  if (b.children !== undefined && !Array.isArray(b.children)) return false;
  return true;
}

export function validatePage(page: unknown): page is Block[] {
  if (!Array.isArray(page)) return false;
  return page.every(validateBlock);
}
