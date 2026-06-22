import { render, screen } from "@testing-library/react";
import { ParagraphBlock } from "../src/components/blocks/ParagraphBlock";

describe("ParagraphBlock", () => {
  it("renders a div with the provided text", () => {
    render(
      <ParagraphBlock
        block={{ id: "1", type: "paragraph", data: { text: "Sample paragraph" } }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Sample paragraph")).toBeInTheDocument();
  });
});
