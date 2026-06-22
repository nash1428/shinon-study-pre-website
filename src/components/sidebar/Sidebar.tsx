"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react";
import type { Page } from "@/lib/types";

interface TreeNode {
  page: Page;
  children: TreeNode[];
}

function buildTree(pages: Page[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>();
  pages.forEach((p) => nodes.set(p.id, { page: p, children: [] }));
  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    const parentId = node.page.parentId;
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

interface Props {
  onOpenPage: (id: string) => void;
  activePageId?: string;
}

export default function Sidebar({ onOpenPage, activePageId }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pages");
        if (!res.ok) throw new Error("Failed to load pages");
        const data = (await res.json()) as Page[];
        if (!cancelled) setPages(data);
      } catch (e) {
        console.error("Failed to load pages", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNewPage = async () => {
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", parentId: null }),
      });
      if (!res.ok) throw new Error("Failed to create page");
      const page = (await res.json()) as Page;
      setPages((prev) => [...prev, page]);
    } catch (e) {
      console.error("Failed to create page", e);
    }
  };

  const renderItem = (node: TreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isOpen = !!expanded[node.page.id];
    const isActive = activePageId === node.page.id;
    return (
      <div key={node.page.id}>
        <div
          className={`group flex items-center gap-1 rounded py-1 pr-1 text-sm ${
            isActive
              ? "bg-gray-100 text-gray-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(node.page.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 hover:text-gray-700"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onOpenPage(node.page.id)}
            className="flex flex-1 items-center gap-1.5 truncate text-left"
          >
            {node.page.icon ? (
              <span className="shrink-0 text-sm leading-none">
                {node.page.icon}
              </span>
            ) : (
              <FileText size={14} className="shrink-0 text-gray-400" />
            )}
            <span className="truncate">
              {node.page.title || "Untitled"}
            </span>
          </button>
        </div>
        {hasChildren && isOpen
          ? node.children.map((child) => renderItem(child, depth + 1))
          : null}
      </div>
    );
  };

  const tree = buildTree(pages);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pages
        </span>
        <button
          type="button"
          onClick={handleNewPage}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="New page"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading && pages.length === 0 ? (
          <div className="px-2 py-2 text-sm text-gray-500">Loading…</div>
        ) : tree.length === 0 ? (
          <div className="px-2 py-2 text-sm text-gray-500">No pages yet</div>
        ) : (
          tree.map((node) => renderItem(node, 0))
        )}
      </div>
    </aside>
  );
}
