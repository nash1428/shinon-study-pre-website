import { Block, createBlock } from "./blockSchema";

export function importMarkdownToBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        createBlock("code", {
          data: { text: codeLines.join("\n"), language: language || "text" },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("##### ")) {
      blocks.push(
        createBlock("heading", { data: { text: trimmed.slice(6), level: 5 } })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push(
        createBlock("heading", { data: { text: trimmed.slice(5), level: 4 } })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push(
        createBlock("heading", { data: { text: trimmed.slice(4), level: 3 } })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        createBlock("heading", { data: { text: trimmed.slice(3), level: 2 } })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        createBlock("heading", { data: { text: trimmed.slice(2), level: 1 } })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const text = trimmed.slice(2);
      if (text.match(/^[🔔💡⚠️📝🎯]\s/)) {
        const icon = text.charAt(0);
        const calloutText = text.slice(2);
        blocks.push(
          createBlock("callout", { data: { text: calloutText, icon } })
        );
      } else {
        blocks.push(createBlock("quote", { data: { text } }));
      }
      i++;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      blocks.push(
        createBlock("bulleted_list", { data: { text: trimmed.slice(2) } })
      );
      i++;
      continue;
    }

    if (trimmed.match(/^\d+\.\s/)) {
      const text = trimmed.replace(/^\d+\.\s/, "");
      blocks.push(createBlock("numbered_list", { data: { text } }));
      i++;
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      blocks.push(createBlock("divider"));
      i++;
      continue;
    }

    if (trimmed.startsWith("![") && trimmed.includes("](")) {
      const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        blocks.push(
          createBlock("image", { data: { alt: match[1], src: match[2] } })
        );
      }
      i++;
      continue;
    }

    if (trimmed.startsWith("[") && trimmed.includes("](")) {
      const match = trimmed.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        blocks.push(
          createBlock("embed", { data: { url: match[2] } })
        );
      }
      i++;
      continue;
    }

    blocks.push(createBlock("paragraph", { data: { text: trimmed } }));
    i++;
  }

  return blocks;
}
