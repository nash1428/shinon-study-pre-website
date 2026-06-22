import type { GraphSuggestion } from "./types";
import { getOpenAI } from "./openai";

function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function mockSummary(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "Empty block.";
  const firstSentence = trimmed.split(/[.!?]/)[0];
  return firstSentence ? `${firstSentence.trim()}.` : "No summary available.";
}

function mockSuggestions(text: string): GraphSuggestion[] {
  const preview = text.trim().slice(0, 40);
  return [
    {
      title: "Core Concept",
      definition: `Primary idea related to: "${preview}…"`,
    },
    {
      title: "Supporting Detail",
      definition: "A supporting notion that reinforces the main topic.",
    },
    {
      title: "Adjacent Topic",
      definition: "An adjacent field worth exploring next.",
    },
  ];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export async function summariseBlock(text: string): Promise<string> {
  if (!hasOpenAIKey()) return mockSummary(text);
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Summarize the following note content in one concise sentence.",
      },
      { role: "user", content: text },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || mockSummary(text);
}

export async function suggestGraph(text: string): Promise<GraphSuggestion[]> {
  if (!hasOpenAIKey()) return mockSuggestions(text);
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          'You are a knowledge graph assistant. Given the note content, suggest 3 related concepts. Respond with JSON like {"suggestions":[{"title":"","definition":""}]}.',
      },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
  });
  const content = res.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    const arr = parsed.suggestions ?? parsed.items ?? parsed;
    if (Array.isArray(arr)) {
      return arr.slice(0, 3).map((item: { title?: unknown; definition?: unknown }) => ({
        title: String(item?.title ?? ""),
        definition: String(item?.definition ?? ""),
      }));
    }
  } catch {
    return mockSuggestions(text);
  }
  return mockSuggestions(text);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: use text-embedding-3-large
  const dim = 384;
  let s = hashString(text);
  const embedding: number[] = [];
  for (let i = 0; i < dim; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((s % 1000) / 1000);
  }
  return embedding;
}
