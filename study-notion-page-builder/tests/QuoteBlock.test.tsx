import { render, screen } from "@testing-library/react";
import { QuoteBlock } from "../src/components/blocks/QuoteBlock";

describe("QuoteBlock", () => {
  it("renders a blockquote with the provided text", () => {
    render(
      <QuoteBlock
        block={{ id: "1", type: "quote", data: { text: "To be or not to be" } }}
        onChange={() => {}}
      />
    );
    const quote = screen.getByText("To be or not to be");
    expect(quote.closest("blockquote")).toBeInTheDocument();
  });
});
