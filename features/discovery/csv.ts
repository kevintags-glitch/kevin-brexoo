import { z } from "zod";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, commas and newlines in quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export const CSV_COLUMNS = [
  "external_id",
  "title",
  "description",
  "category",
  "location",
  "postcode",
  "stage",
  "estimated_value",
  "timeline",
  "observed_at",
  "source_url",
  "contact_name",
  "contact_email",
  "contact_phone",
  "contact_permission",
] as const;

const CATEGORY_BY_NAME = new Map<string, string>(
  INDUSTRY_TEMPLATES.flatMap((t) => [
    [t.code, t.code],
    [t.name.toLowerCase(), t.code],
  ]),
);

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

export const recordSchema = z.object({
  external_id: z.string().trim().min(1, "external_id is required").max(200),
  title: z.string().trim().min(2, "title is required").max(200),
  description: opt(4000),
  category: z
    .string()
    .trim()
    .transform((v) => (v ? (CATEGORY_BY_NAME.get(v.toLowerCase()) ?? "?") : null))
    .refine((v) => v !== "?", "unknown category (use a service code or name)"),
  location: opt(160),
  postcode: opt(12),
  stage: opt(80),
  estimated_value: z
    .string()
    .trim()
    .transform((v) => (v ? Math.round(Number(v.replace(/[^0-9.]/g, "")) * 100) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "estimated_value must be a number"),
  timeline: opt(80),
  observed_at: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "observed_at must be YYYY-MM-DD"),
  source_url: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => v === null || /^https?:\/\//.test(v), "source_url must start with http(s)://"),
  contact_name: opt(120),
  contact_email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || null)
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "contact_email is not valid"),
  contact_phone: opt(40),
  contact_permission: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => (v || "unknown") as "unknown" | "permitted" | "not_permitted")
    .refine((v) => ["unknown", "permitted", "not_permitted"].includes(v), "contact_permission must be permitted, not_permitted or unknown"),
});

export type ParsedRecord = z.infer<typeof recordSchema>;

/** Validate a CSV export of project records. Returns good rows and per-line errors. */
export function validateCsv(text: string, maxRows = 2000) {
  const rows = parseCsv(text);
  if (!rows.length) return { records: [], errors: ["The file is empty."] };
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const missing = ["external_id", "title"].filter((c) => !header.includes(c));
  if (missing.length) return { records: [], errors: [`Missing required column(s): ${missing.join(", ")}.`] };
  if (rows.length - 1 > maxRows) return { records: [], errors: [`Up to ${maxRows} rows per import.`] };
  const records: ParsedRecord[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  rows.slice(1).forEach((r, i) => {
    const obj = Object.fromEntries(CSV_COLUMNS.map((c) => [c, r[header.indexOf(c)] ?? ""]));
    const parsed = recordSchema.safeParse(obj);
    if (!parsed.success) {
      errors.push(`Line ${i + 2}: ${parsed.error.issues[0]!.message}`);
      return;
    }
    if (seen.has(parsed.data.external_id)) {
      errors.push(`Line ${i + 2}: duplicate external_id ${parsed.data.external_id}`);
      return;
    }
    seen.add(parsed.data.external_id);
    records.push(parsed.data);
  });
  return { records, errors };
}
