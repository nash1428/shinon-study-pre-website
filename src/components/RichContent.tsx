"use client";

import { useEffect, useRef, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "neutral" });

/**
 * RichContent — renders note content with KaTeX math and Mermaid graphs.
 * Supports:
 * - Inline math: $x^2 + y^2 = z^2$
 * - Block math: $$\int_0^1 x^2 dx$$
 * - Mermaid graphs: ```mermaid\ngraph TD\nA-->B\n```
 * - Regular text and paragraphs
 */
export default function RichContent({ content }: { content: string }) {
  const mermaidId = useRef(0);
  const [mermaidSvg, setMermaidSvg] = useState<Record<string, string>>({});

  // Parse content into segments: text, inline-math, block-math, mermaid
  const segments = parseContent(content);

  // Render mermaid diagrams
  useEffect(() => {
    segments.forEach((seg) => {
      if (seg.type === "mermaid" && !mermaidSvg[seg.id]) {
        const id = `mermaid-${seg.id}`;
        mermaid.render(id, seg.content).then((result: { svg: string }) => {
          setMermaidSvg((prev) => ({ ...prev, [seg.id]: result.svg }));
        }).catch(() => {
          setMermaidSvg((prev) => ({ ...prev, [seg.id]: "<p class='text-red-500 text-xs'>Invalid Mermaid diagram</p>" }));
        });
      }
    });
  }, [content]);

  return (
    <div className="space-y-2">
      {segments.map((seg, i) => {
        if (seg.type === "block-math") {
          return (
            <div key={i} className="my-3 overflow-x-auto text-center">
              <BlockMath math={seg.content} />
            </div>
          );
        }
        if (seg.type === "mermaid") {
          return (
            <div key={i} className="my-3 rounded-xl bg-white p-4 border border-ivory-deep/40 overflow-x-auto">
              {mermaidSvg[seg.id] ? (
                <div dangerouslySetInnerHTML={{ __html: mermaidSvg[seg.id] }} />
              ) : (
                <p className="text-xs text-ink-muted">Loading diagram...</p>
              )}
            </div>
          );
        }
        // Text with inline math
        const inlineParts = parseInlineMath(seg.content);
        return (
          <p key={i} className="whitespace-pre-wrap text-base leading-relaxed text-ink-soft">
            {inlineParts.map((part, j) => {
              if (part.type === "math") {
                return <InlineMath key={j} math={part.content} />;
              }
              return <span key={j}>{part.content}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

interface Segment {
  type: "text" | "block-math" | "mermaid";
  content: string;
  id: string;
}

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  let remaining = content;
  let idCounter = 0;

  while (remaining.length > 0) {
    // Check for mermaid block
    const mermaidMatch = remaining.match(/```mermaid\n([\s\S]*?)```/);
    if (mermaidMatch && mermaidMatch.index !== undefined && mermaidMatch.index === 0) {
      segments.push({ type: "mermaid", content: mermaidMatch[1].trim(), id: `m${idCounter++}` });
      remaining = remaining.slice(mermaidMatch[0].length);
      continue;
    }

    // Check for block math $$
    const blockMathMatch = remaining.match(/\$\$([\s\S]*?)\$\$/);
    if (blockMathMatch && blockMathMatch.index !== undefined && blockMathMatch.index === 0) {
      segments.push({ type: "block-math", content: blockMathMatch[1].trim(), id: `b${idCounter++}` });
      remaining = remaining.slice(blockMathMatch[0].length);
      continue;
    }

    // Find next mermaid or block-math
    const nextMermaid = remaining.indexOf("```mermaid");
    const nextBlockMath = remaining.indexOf("$$");

    let nextIndex = remaining.length;
    if (nextMermaid >= 0) nextIndex = Math.min(nextIndex, nextMermaid);
    if (nextBlockMath >= 0) nextIndex = Math.min(nextIndex, nextBlockMath);

    if (nextIndex > 0) {
      segments.push({ type: "text", content: remaining.slice(0, nextIndex), id: `t${idCounter++}` });
      remaining = remaining.slice(nextIndex);
    } else {
      segments.push({ type: "text", content: remaining, id: `t${idCounter++}` });
      remaining = "";
    }
  }

  return segments;
}

function parseInlineMath(text: string): Array<{ type: "text" | "math"; content: string }> {
  const parts: Array<{ type: "text" | "math"; content: string }> = [];
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "math", content: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}
