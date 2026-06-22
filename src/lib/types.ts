export interface BlockMetadata {
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  embedding?: number[];
}

export interface Block {
  id: string;
  type: "heading" | "paragraph" | "toggle" | "callout" | "bulleted_list" | "numbered_list" | "quote" | "code" | "image" | "video" | "embed" | "table" | "divider" | "ai_assistant";
  data: Record<string, any>;
  children?: Block[];
  metadata: BlockMetadata;
}

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  icon?: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  blockId: string;
  pageId: string;
  snippet: string;
  score: number;
}

export interface GraphSuggestion {
  title: string;
  definition: string;
}
