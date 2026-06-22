import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Notebook — Organised NotebookLM",
  description: "A block-based notebook with AI summarisation, search, and knowledge graph",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
