import { useState, useEffect, useCallback, useRef } from "react";
import { Block } from "@/lib/blockSchema";
import { getPage, updatePage, createPage } from "@/api/pages";

export function usePage(initialId?: string) {
  const [pageId, setPageId] = useState<string | undefined>(initialId);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPage(id);
      setBlocks(data.content || []);
      setPageId(id);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, []);

  const savePage = useCallback(
    async (newBlocks: Block[]) => {
      if (!pageId) return;
      setSaving(true);
      setError(null);
      try {
        await updatePage(pageId, newBlocks);
      } catch (e: any) {
        setError(e.response?.data?.error || e.message || "Failed to save page");
      } finally {
        setSaving(false);
      }
    },
    [pageId]
  );

  const createNewPage = useCallback(async (initialBlocks: Block[] = []) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createPage(initialBlocks);
      setPageId(data.id);
      setBlocks(initialBlocks);
      return data.id;
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Failed to create page");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBlocks = useCallback(
    (updater: (prev: Block[]) => Block[]) => {
      setBlocks((prev) => {
        const next = updater(prev);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          savePage(next);
        }, 1000);
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
    loading,
    saving,
    error,
    loadPage,
    createNewPage,
    updateBlocks,
    setBlocks,
  };
}
