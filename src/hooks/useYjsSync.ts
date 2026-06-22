"use client";

export function useYjsSync(pageId: string) {
  // TODO: Connect to Yjs WebSocket server at ws://localhost:1234
  // For now, returns a no-op sync function
  return { sync: () => {}, connected: false };
}
