import React, { useState } from "react";
import { Block, createBlock } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
  onAddBlock?: (block: Block) => void;
}

export const AIAssistantBlock: React.FC<Props> = ({ block, onChange, onAddBlock }) => {
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    const prompt = block.data.prompt || "";
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      // TODO: replace with real LLM endpoint; add rate-limiting and error handling
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const responseText = data.response || data.summary || data.outline || "No response";

      if (onAddBlock) {
        onAddBlock(
          createBlock("callout", {
            data: { text: responseText, icon: "🤖" },
          })
        );
      }
    } catch (e: any) {
      console.error("AI assistant error:", e);
      if (onAddBlock) {
        onAddBlock(
          createBlock("callout", {
            data: { text: `Error: ${e.message}`, icon: "⚠️" },
          })
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <div className="mb-2 text-sm font-medium text-purple-900">AI Assistant</div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          value={block.data.prompt || ""}
          onChange={(e) =>
            onChange({ ...block, data: { ...block.data, prompt: e.target.value } })
          }
          placeholder="Ask anything..."
        />
        <button
          className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>
    </div>
  );
};
