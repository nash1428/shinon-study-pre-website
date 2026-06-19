import { describe, it, expect } from "vitest";

describe("Prototype API routes", () => {
  it("studybook returns outline or summary", async () => {
    const res = await fetch("http://localhost:3000/api/studybook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Test", mode: "outline" }),
    });
    const data = await res.json();
    expect(data.outline || data.summary).toBeTruthy();
  });

  it("quizcraft returns questions array", async () => {
    const res = await fetch("http://localhost:3000/api/quizcraft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Test" }),
    });
    const data = await res.json();
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.questions[0]).toHaveProperty("q");
    expect(data.questions[0]).toHaveProperty("options");
    expect(data.questions[0]).toHaveProperty("answer");
  });

  it("brainmap returns nodes and edges", async () => {
    const res = await fetch("http://localhost:3000/api/brainmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Test" }),
    });
    const data = await res.json();
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
  });

  it("flashforge returns cards", async () => {
    const res = await fetch("http://localhost:3000/api/flashforge");
    const data = await res.json();
    expect(Array.isArray(data.cards)).toBe(true);
    expect(Array.isArray(data.due)).toBe(true);
  });

  it("coursecompass returns resources", async () => {
    const res = await fetch("http://localhost:3000/api/coursecompass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Test" }),
    });
    const data = await res.json();
    expect(Array.isArray(data.resources)).toBe(true);
    expect(data.resources.length).toBeGreaterThan(0);
    expect(data.resources[0]).toHaveProperty("title");
    expect(data.resources[0]).toHaveProperty("url");
    expect(data.resources[0]).toHaveProperty("why");
  });
});
