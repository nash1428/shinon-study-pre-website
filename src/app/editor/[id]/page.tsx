"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import RightPanel from "@/components/panels/RightPanel";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { EditorToolbar } from "@/components/editor/toolbar/EditorToolbar";
import { exportPageAsMarkdown } from "@/lib/markdownExport";
import type { Block, Page } from "@/lib/types";

export default function EditorPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  // Load all pages
  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((data) => {
        setPages(data.pages || []);
        if (data.pages?.length > 0 && !activePageId) {
          setActivePageId(data.pages[0].id);
        }
      });
  }, []);

  // Load active page
  useEffect(() => {
    if (!activePageId) return;
    fetch(`/api/pages/${activePageId}`)
      .then((r) => r.json())
      .then((data) => {
        setActivePage(data);
        setBlocks(data.blocks || []);
      });
  }, [activePageId]);

  const handleBlocksChange = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      if (activePageId) {
        fetch(`/api/blocks/${activePageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: activePageId, updates: { blocks: newBlocks } }),
        });
      }
    },
    [activePageId]
  );

  const handleSummarise = useCallback(
    async (blockId: string) => {
      if (!activePageId) return;
      const res = await fetch("/api/ai/summarise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, pageId: activePageId }),
      });
      const data = await res.json();
      if (data.summary) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId
              ? { ...b, metadata: { ...b.metadata, aiSummary: data.summary } }
              : b
          )
        );
      }
    },
    [activePageId]
  );

  const handleInsertBlock = useCallback(
    (suggestion: { title: string; definition: string }) => {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: "callout",
        data: { text: `${suggestion.title}: ${suggestion.definition}`, icon: "💡" },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      setBlocks((prev) => [...prev, newBlock]);
    },
    []
  );

  const handleExport = useCallback(() => {
    const md = exportPageAsMarkdown(blocks);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activePage?.title || "page"}.md`;
    a.click();
  }, [blocks, activePage]);

  const handleTitleChange = useCallback(
    (title: string) => {
      if (activePage) {
        setActivePage({ ...activePage, title });
        fetch(`/api/blocks/${activePage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: activePage.id, updates: { title } }),
        });
      }
    },
    [activePage]
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0 overflow-y-auto">
        <Sidebar onOpenPage={setActivePageId} activePageId={activePageId || undefined} />
      </aside>

      {/* Main editor */}
      <main className="flex-1 overflow-y-auto">
        <EditorToolbar
          title={activePage?.title || ""}
          onTitleChange={handleTitleChange}
          onAddBlock={() => {
            const newBlock: Block = {
              id: crypto.randomUUID(),
              type: "paragraph",
              data: { text: "" },
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            };
            setBlocks((prev) => [...prev, newBlock]);
          }}
          onSummarise={() => {
            const firstBlock = blocks.find((b) => b.type !== "divider");
            if (firstBlock) handleSummarise(firstBlock.id);
          }}
          onExport={handleExport}
        />
        <div className="max-w-3xl mx-auto px-16 py-8">
          <BlockEditor
            blocks={blocks}
            onChange={handleBlocksChange}
            onSummarise={handleSummarise}
          />
        </div>
      </main>

      {/* Right panel */}
      <aside className="w-80 border-l border-gray-200 bg-gray-50 flex-shrink-0 overflow-y-auto">
        <RightPanel
          selectedText={selectedText}
          onOpenPage={setActivePageId}
          onInsertBlock={handleInsertBlock}
        />
      </aside>
    </div>
  );
}
