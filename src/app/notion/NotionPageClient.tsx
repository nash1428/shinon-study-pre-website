"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Block, createBlock } from "@/lib/blockSchema";
import { usePage } from "@/hooks/usePage";
import PageEditor from "@/components/page-builder/PageEditor";
import { exportPageAsMarkdown } from "@/lib/markdownExport";
import { FileDown, Plus, ArrowLeft, Loader2 } from "lucide-react";

export default function NotionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");
  const [mode, setMode] = useState<"list" | "editor">(initialId ? "editor" : "list");
  const [pages, setPages] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [examples, setExamples] = useState<string[]>([]);

  const {
    pageId,
    blocks,
    title,
    loading,
    saving,
    error,
    loadPage,
    createNewPage,
    updateBlocks,
    setTitle,
  } = usePage(initialId || undefined);

  useEffect(() => {
    if (initialId) {
      loadPage(initialId);
    }
  }, [initialId, loadPage]);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      setPages([]);
    }
  }, []);

  const fetchExamples = useCallback(async () => {
    const files = [
      "studybook-overview",
      "quizcraft-bank",
      "brainmap-canvas",
      "flashforge-deck",
      "coursecompass-syllabus",
    ];
    setExamples(files);
  }, []);

  useEffect(() => {
    if (mode === "list") {
      fetchPages();
      fetchExamples();
    }
  }, [mode, fetchPages, fetchExamples]);

  const handleCreate = async () => {
    const id = await createNewPage();
    setMode("editor");
    router.push(`/notion?id=${id}`);
  };

  const handleLoad = async (id: string) => {
    await loadPage(id);
    setMode("editor");
    router.push(`/notion?id=${id}`);
  };

  const handleLoadExample = async (name: string) => {
    try {
      const res = await fetch(`/examples/${name}.json`);
      const data = await res.json();
      const firstHeading = data.find((b: Block) => b.type === "heading");
      const id = await createNewPage(data, firstHeading?.data?.text || `${name} Example`);
      setMode("editor");
      router.push(`/notion?id=${id}`);
    } catch (e) {
      console.error("Failed to load example:", e);
    }
  };

  const handleExport = () => {
    const md = exportPageAsMarkdown(blocks);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newTitle = e.currentTarget.innerText;
    if (newTitle !== title) {
      setTitle(newTitle);
      fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: blocks, title: newTitle }),
      });
    }
  };

  if (mode === "list") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notion Page Builder</h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        </div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create, edit, and organise study pages with a Notion-style block editor.
        </p>

        {pages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Your Pages</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleLoad(p.id)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Updated {new Date(p.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Example Pages</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((name) => (
              <button
                key={name}
                onClick={() => handleLoadExample(name)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-semibold capitalize">{name.replace(/-/g, " ")}</h3>
                <p className="mt-1 text-xs text-zinc-500">Pre-filled demo page</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            setMode("list");
            router.push("/notion");
          }}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <FileDown className="h-4 w-4" />
            Export MD
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div
            contentEditable
            suppressContentEditableWarning
            className="mb-6 text-3xl font-bold focus:outline-none"
            onBlur={handleTitleBlur}
          >
            {title || "Untitled Page"}
          </div>
          <PageEditor blocks={blocks} onChange={(b) => updateBlocks(() => b)} />
        </div>
      )}
    </div>
  );
}
