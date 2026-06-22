"use client";

import { Suspense } from "react";
import NotionPageClient from "./NotionPageClient";

export default function NotionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-center text-zinc-400">Loading...</div>}>
      <NotionPageClient />
    </Suspense>
  );
}
