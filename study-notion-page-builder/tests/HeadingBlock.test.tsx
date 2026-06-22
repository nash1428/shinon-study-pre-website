import { render, screen } from "@testing-library/react";
import { HeadingBlock } from "../src/components/blocks/HeadingBlock";

describe("HeadingBlock", () => {
  it("renders an h2 element with the provided text", () => {
    render(
      <HeadingBlock
        block={{ id: "1", type: "heading", data: { text: "Hello", level: 2 } }}
        onChange={() => {}}
      />
    );
    const heading = screen.getByText("Hello");
    expect(heading.tagName).toBe("H2");
  });

  it("renders an h1 when level is 1", () => {
    render(
      <HeadingBlock
        block={{ id: "1", type: "heading", data: { text: "Title", level: 1 } }}
        onChange={() => {}}
      />
    );
    const heading = screen.getByText("Title");
    expect(heading.tagName).toBe("H1");
  });
});
