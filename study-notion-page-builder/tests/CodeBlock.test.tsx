import { render, screen } from "@testing-library/react";
import { CodeBlock } from "../src/components/blocks/CodeBlock";

describe("CodeBlock", () => {
  it("renders a textarea for code input", () => {
    render(
      <CodeBlock
        block={{ id: "1", type: "code", data: { text: "console.log('hi')", language: "javascript" } }}
        onChange={() => {}}
      />
    );
    const textarea = screen.getByDisplayValue("console.log('hi')");
    expect(textarea.tagName).toBe("TEXTAREA");
  });
});
