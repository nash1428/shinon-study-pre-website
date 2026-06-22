import { Block } from "@/lib/blockSchema";

export function exportPageAsMarkdown(page: Block[]): string {
  const lines: string[] = [];

  function renderBlock(block: Block, depth = 0): void {
    const indent = "  ".repeat(depth);
    switch (block.type) {
      case "heading": {
        const level = Math.min(block.data.level || 2, 6);
        const hashes = "#".repeat(level);
        lines.push(`${indent}${hashes} ${block.data.text || ""}`);
        break;
      }
      case "paragraph":
        lines.push(`${indent}${block.data.text || ""}`);
        lines.push("");
        break;
      case "bulleted_list":
        lines.push(`${indent}- ${block.data.text || ""}`);
        break;
      case "numbered_list":
        lines.push(`${indent}1. ${block.data.text || ""}`);
        break;
      case "quote":
        lines.push(`${indent}> ${block.data.text || ""}`);
        lines.push("");
        break;
      case "code": {
        const lang = block.data.language || "";
        lines.push(`${indent}\`\`\`${lang}`);
        lines.push(`${indent}${block.data.text || ""}`);
        lines.push(`${indent}\`\`\``);
        lines.push("");
        break;
      }
      case "callout": {
        const icon = block.data.icon || "💡";
        lines.push(`${indent}> ${icon} ${block.data.text || ""}`);
        lines.push("");
        if (block.children) block.children.forEach((c) => renderBlock(c, depth + 1));
        break;
      }
      case "toggle": {
        lines.push(`${indent}<details>`);
        lines.push(`${indent}<summary>${block.data.title || ""}</summary>`);
        lines.push("");
        if (block.children) block.children.forEach((c) => renderBlock(c, depth + 1));
        lines.push(`${indent}</details>`);
        lines.push("");
        break;
      }
      case "divider":
        lines.push(`${indent}---`);
        lines.push("");
        break;
      case "image": {
        const alt = block.data.alt || "";
        const src = block.data.src || "";
        lines.push(`${indent}![${alt}](${src})`);
        lines.push("");
        break;
      }
      case "table": {
        const headers: string[] = block.data.headers || [];
        const rows: string[][] = block.data.rows || [];
        if (headers.length > 0) {
          lines.push(`${indent}| ${headers.join(" | ")} |`);
          lines.push(`${indent}| ${headers.map(() => "---").join(" | ")} |`);
        }
        rows.forEach((row) => {
          lines.push(`${indent}| ${row.join(" | ")} |`);
        });
        lines.push("");
        break;
      }
      case "embed": {
        const url = block.data.url || "";
        lines.push(`${indent}[Embedded content](${url})`);
        lines.push("");
        break;
      }
      case "video": {
        const src = block.data.src || "";
        lines.push(`${indent}[Video](${src})`);
        lines.push("");
        break;
      }
      case "ai_assistant":
        lines.push(`${indent}<!-- AI Assistant: ${block.data.prompt || ""} -->`);
        lines.push("");
        break;
      default:
        break;
    }
  }

  page.forEach((block) => renderBlock(block));
  return lines.join("\n").trim();
}
