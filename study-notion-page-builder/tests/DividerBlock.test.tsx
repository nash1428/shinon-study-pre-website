import { render } from "@testing-library/react";
import { DividerBlock } from "../src/components/blocks/DividerBlock";

describe("DividerBlock", () => {
  it("renders an hr element", () => {
    const { container } = render(<DividerBlock />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });
});
