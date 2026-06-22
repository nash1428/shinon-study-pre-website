import { render, screen } from "@testing-library/react";
import { CalloutBlock } from "../src/components/blocks/CalloutBlock";

describe("CalloutBlock", () => {
  it("renders the callout text and icon", () => {
    render(
      <CalloutBlock
        block={{ id: "1", type: "callout", data: { text: "Important note", icon: "⚠️" } }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Important note")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });
});
