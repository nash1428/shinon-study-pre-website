import type { Block, BlockMetadata, Page, SearchResult } from "./types";

const pages = new Map<string, Page>();

function now(): string {
  return new Date().toISOString();
}

function blockText(block: Block): string {
  return Object.values(block.data ?? {})
    .filter((v): v is string => typeof v === "string")
    .join(" ");
}

function findBlock(blocks: Block[], blockId: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    if (block.children) {
      const found = findBlock(block.children, blockId);
      if (found) return found;
    }
  }
  return undefined;
}

export function getPage(id: string): Page | undefined {
  return pages.get(id);
}

export function getAllPages(): Page[] {
  return Array.from(pages.values());
}

export function createPage(title: string, parentId: string | null = null): Page {
  const page: Page = {
    id: crypto.randomUUID(),
    title,
    parentId,
    blocks: [],
    createdAt: now(),
    updatedAt: now(),
  };
  pages.set(page.id, page);
  return page;
}

export function updatePage(
  id: string,
  updates: Partial<Pick<Page, "title" | "icon" | "parentId" | "blocks">>
): Page | undefined {
  const page = pages.get(id);
  if (!page) return undefined;
  if (updates.title !== undefined) page.title = updates.title;
  if (updates.icon !== undefined) page.icon = updates.icon;
  if (updates.parentId !== undefined) page.parentId = updates.parentId;
  if (updates.blocks !== undefined) page.blocks = updates.blocks;
  page.updatedAt = now();
  return page;
}

export function deletePage(id: string): boolean {
  return pages.delete(id);
}

export function updateBlock(
  pageId: string,
  blockId: string,
  updates: Partial<Block>
): boolean {
  const page = pages.get(pageId);
  if (!page) return false;
  const block = findBlock(page.blocks, blockId);
  if (!block) return false;
  if (updates.type) block.type = updates.type;
  if (updates.data) block.data = { ...block.data, ...updates.data };
  if (updates.children !== undefined) block.children = updates.children;
  if (updates.metadata) block.metadata = { ...block.metadata, ...updates.metadata };
  block.metadata.updatedAt = now();
  page.updatedAt = now();
  return true;
}

export function searchBlocks(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SearchResult[] = [];
  const walk = (blocks: Block[], page: Page) => {
    for (const block of blocks) {
      const text = blockText(block).toLowerCase();
      const idx = text.indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(text.length, idx + q.length + 30);
        const snippet =
          (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
        const score = text.split(q).length - 1;
        results.push({ blockId: block.id, pageId: page.id, snippet, score });
      }
      if (block.children) walk(block.children, page);
    }
  };
  for (const page of pages.values()) {
    walk(page.blocks, page);
  }
  return results.sort((a, b) => b.score - a.score);
}

function meta(): BlockMetadata {
  const t = now();
  return { createdAt: t, updatedAt: t };
}

function seed(): void {
  const page: Page = {
    id: crypto.randomUUID(),
    title: "Introduction to Machine Learning",
    parentId: null,
    icon: "📚",
    createdAt: now(),
    updatedAt: now(),
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        data: { text: "Introduction to Machine Learning", level: 1 },
        metadata: meta(),
      },
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        data: {
          text: "Machine learning is a subfield of artificial intelligence that enables systems to learn patterns from data and improve over time without being explicitly programmed.",
        },
        metadata: meta(),
      },
      {
        id: crypto.randomUUID(),
        type: "callout",
        data: {
          text: "Tip: Start with linear regression before moving on to neural networks.",
          icon: "💡",
        },
        children: [],
        metadata: meta(),
      },
      {
        id: crypto.randomUUID(),
        type: "toggle",
        data: { title: "Common algorithms" },
        children: [
          {
            id: crypto.randomUUID(),
            type: "bulleted_list",
            data: { text: "Linear Regression" },
            metadata: meta(),
          },
          {
            id: crypto.randomUUID(),
            type: "bulleted_list",
            data: { text: "Decision Trees" },
            metadata: meta(),
          },
          {
            id: crypto.randomUUID(),
            type: "bulleted_list",
            data: { text: "Neural Networks" },
            metadata: meta(),
          },
        ],
        metadata: meta(),
      },
      {
        id: crypto.randomUUID(),
        type: "code",
        data: {
          text: "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression()\nmodel.fit(X, y)",
          language: "python",
        },
        metadata: meta(),
      },
    ],
  };
  pages.set(page.id, page);
}

seed();
