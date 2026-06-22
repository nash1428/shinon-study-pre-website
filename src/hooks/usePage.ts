"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Block } from "@/lib/blockSchema";

export function usePage(initialId?: string) {
  const [pageId, setPageId] = useState<string | undefined>(initialId);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("Untitled Page");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${id}`);
      if (!res.ok) throw new Error("Page not found");
      const data = await res.json();
      setBlocks(data.page.content || []);
      setTitle(data.page.title || "Untitled Page");
      setPageId(id);
    } catch (e: any) {
      setError(e.message || "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, []);

  const savePage = useCallback(
    async (newBlocks: Block[], newTitle?: string) => {
      if (!pageId) return;
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/pages/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newBlocks, title: newTitle || title }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } catch (e: any) {
        setError(e.message || "Failed to save page");
      } finally {
        setSaving(false);
      }
    },
    [pageId, title]
  );

  const createNewPage = useCallback(async (initialBlocks: Block[] = [], initialTitle = "Untitled Page") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: initialBlocks, title: initialTitle }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      setPageId(data.id);
      setBlocks(initialBlocks);
      setTitle(initialTitle);
      return data.id;
    } catch (e: any) {
      setError(e.message || "Failed to create page");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBlocks = useCallback(
    (updater: (prev: Block[]) => Block[], autoSave = true) => {
      setBlocks((prev) => {
        const next = updater(prev);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (autoSave) {
          debounceRef.current = setTimeout(() => {
            savePage(next);
          }, 1000);
        }
        return next;
      });
    },
    [savePage]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    pageId,
    blocks,
    title,
    loading,
    saving,
    error,
    loadPage,
    createNewPage,
    updateBlocks,
    setBlocks,
    setTitle,
  };
}
