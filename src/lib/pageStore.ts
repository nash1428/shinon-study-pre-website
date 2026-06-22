import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PAGES_FILE = path.join(DATA_DIR, "pages.json");

export interface PageRecord {
  id: string;
  content: any[];
  title: string;
  createdAt: string;
  updatedAt: string;
}

let memoryCache: Record<string, PageRecord> | null = null;

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(PAGES_FILE);
    } catch {
      await fs.writeFile(PAGES_FILE, "{}");
    }
  } catch {
    // If filesystem write fails (e.g. read-only env), fallback to memory
  }
}

async function readAll(): Promise<Record<string, PageRecord>> {
  if (memoryCache) return memoryCache;
  await ensureFile();
  try {
    const raw = await fs.readFile(PAGES_FILE, "utf-8");
    const data = JSON.parse(raw);
    // Also hydrate in-memory if read succeeded
    memoryCache = data as Record<string, PageRecord>;
    return memoryCache!;
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, PageRecord>) {
  memoryCache = data;
  try {
    await ensureFile();
    await fs.writeFile(PAGES_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Keep in-memory only
  }
}

export async function listPages(): Promise<PageRecord[]> {
  const all = await readAll();
  return Object.values(all).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getPage(id: string): Promise<PageRecord | null> {
  const all = await readAll();
  return all[id] || null;
}

export async function createPage(content: any[], title?: string): Promise<PageRecord> {
  const all = await readAll();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record: PageRecord = {
    id,
    content: content || [],
    title: title || "Untitled Page",
    createdAt: now,
    updatedAt: now,
  };
  all[id] = record;
  await writeAll(all);
  return record;
}

export async function updatePage(id: string, content: any[], title?: string): Promise<boolean> {
  const all = await readAll();
  if (!all[id]) return false;
  all[id].content = content || [];
  if (title) all[id].title = title;
  all[id].updatedAt = new Date().toISOString();
  await writeAll(all);
  return true;
}

export async function deletePage(id: string): Promise<boolean> {
  const all = await readAll();
  if (!all[id]) return false;
  delete all[id];
  await writeAll(all);
  return true;
}
