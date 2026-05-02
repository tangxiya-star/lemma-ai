// Butterbase REST client (PostgREST-style at /v1/{app_id}/{table}).
// Tables provisioned via Butterbase MCP; types in ./schema are source of truth.

import type { TableName, TableRow } from "./schema";

const BASE_URL = process.env.BUTTERBASE_URL;
const API_KEY = process.env.BUTTERBASE_API_KEY;

function headers(extra?: Record<string, string>): Record<string, string> {
  if (!BASE_URL || !API_KEY) {
    throw new Error("BUTTERBASE_URL and BUTTERBASE_API_KEY must be set");
  }
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(init?.headers as Record<string, string>) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Butterbase ${init?.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`
    );
  }
  // Some PATCH/DELETE return empty body
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function insert<T extends TableName>(
  table: T,
  row: Partial<TableRow[T]>
): Promise<TableRow[T]> {
  // PostgREST returns inserted row when Prefer: return=representation
  const result = await req<TableRow[T] | TableRow[T][]>(`/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  return Array.isArray(result) ? result[0] : result;
}

type Filter = string | number | boolean;
function filterQS(filters: Record<string, Filter>): string {
  const parts = Object.entries(filters).map(([k, v]) => {
    // already-formatted operator (e.g. "eq.value", "gte.2026-01-01")
    const s = String(v);
    if (/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|fts)\./.test(s)) {
      return `${encodeURIComponent(k)}=${encodeURIComponent(s)}`;
    }
    return `${encodeURIComponent(k)}=eq.${encodeURIComponent(s)}`;
  });
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function list<T extends TableName>(
  table: T,
  filters: Record<string, Filter> = {},
  opts: { order?: string; limit?: number; select?: string } = {}
): Promise<TableRow[T][]> {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    const s = String(v);
    q.append(k, /^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|fts)\./.test(s) ? s : `eq.${s}`);
  });
  if (opts.order) q.set("order", opts.order);
  if (opts.limit != null) q.set("limit", String(opts.limit));
  if (opts.select) q.set("select", opts.select);
  const qs = q.toString();
  return req<TableRow[T][]>(`/${table}${qs ? "?" + qs : ""}`);
}

export async function getById<T extends TableName>(
  table: T,
  id: string
): Promise<TableRow[T] | null> {
  const rows = await list(table, { id }, { limit: 1 });
  return rows[0] ?? null;
}

export async function update<T extends TableName>(
  table: T,
  id: string,
  patch: Partial<TableRow[T]>
): Promise<TableRow[T]> {
  const result = await req<TableRow[T][]>(`/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  return Array.isArray(result) ? result[0] : (result as unknown as TableRow[T]);
}

export async function remove<T extends TableName>(table: T, id: string): Promise<void> {
  await req<void>(`/${table}?id=eq.${id}`, { method: "DELETE" });
}
