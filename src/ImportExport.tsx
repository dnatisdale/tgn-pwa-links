// src/ImportExport.tsx
import React from "react";
import { strings, type Lang } from "./i18n";

export type Row = { name: string; language: string; url: string };

type Props = {
  lang: Lang;
  // Optional: if App provides it, we’ll call it. If not, we’ll just show a toast/alert.
  onBatchAdd?: (rows: Row[]) => void;
};

type ParsedRow = Row & { _valid: boolean; _reason?: string };

function toHttps(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();

  // Auto-fix common cases
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = "https://" + s.slice("http://".length);
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;

  return s;
}

function isValidHttpsUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && !!x.host;
  } catch {
    return false;
  }
}

function parseCSVorTSV(text: string): Row[] {
  // Very simple parser: split lines, then split by comma or tab (if tabs exist, prefer TSV)
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delim = lines.some((l) => l.includes("\t")) ? "\t" : ",";

  // header?
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("name") && (header.includes("language") || header.includes("lang")) && header.includes("url");

  const start = hasHeader ? 1 : 0;
  const rows: Row[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(delim).map((p) => p.trim());
    if (parts.length < 3) continue;
    const [name, language, url] = parts;
    rows.push({ name, language, url });
  }
  return rows;
}

function parseJSON(text: string): Row[] {
  try {
    const v = JSON.parse(text);
    if (Array.isArray(v)) {
      return v
        .map((x) => ({
          name: String(x.name ?? "").trim(),
          language: String(x.language ?? "").trim(),
          url: String(x.url ?? "").trim(),
        }))
        .filter((r) => r.name || r.language || r.url);
    }
    return [];
  } catch {
    return [];
  }
}

function parseByFilename(name: string, text: string): Row[] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".json")) return parseJSON(text);
  if (lower.endsWith(".tsv")) return parseCSVorTSV(text);
  //
