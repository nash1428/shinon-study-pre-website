import axios from "axios";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

const client = axios.create({
  baseURL: `${API_BASE}/pages`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getPage(id: string) {
  const res = await client.get(`/${id}`);
  return res.data;
}

export async function createPage(page: unknown) {
  const res = await client.post("/", { page });
  return res.data;
}

export async function updatePage(id: string, page: unknown) {
  await client.put(`/${id}`, { page });
}
