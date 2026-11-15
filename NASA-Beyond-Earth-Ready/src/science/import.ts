import type { CelestialBody, Dataset, Evidence, Measurement, ResearchRecord } from "./model";

export type ColumnMapping = Record<"id" | "name" | "location" | "attribute" | "value" | "unit" | "source" | "evidence", string>;

/** RFC-style quoted CSV: supports commas, CRLF and newlines within quoted cells. */
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); if (row.some(v => v.trim())) rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  return rows;
}

export function parseImport(text: string, format: "json" | "csv"): Record<string, unknown>[] {
  if (text.length > 5_000_000) throw new Error("Please import a file smaller than 5 MB.");
  text = text.replace(/^\uFEFF/, "");
  if (format === "csv") {
    const [headers, ...rows] = csvRows(text);
    if (!headers?.length) throw new Error("CSV is empty.");
    const keys = headers.map(h => h.trim());
    if (new Set(keys).size !== keys.length || keys.some(k => !k)) throw new Error("CSV column names must be nonempty and unique.");
    return rows.map((row, i) => {
      if (row.length !== keys.length) throw new Error(`CSV row ${i + 2} has ${row.length} fields; expected ${keys.length}.`);
      return Object.fromEntries(keys.map((key, j) => [key, row[j]]));
    });
  }
  const input: unknown = JSON.parse(text);
  const records = Array.isArray(input) ? input : input && typeof input === "object" && "records" in input ? input.records : null;
  if (!Array.isArray(records)) throw new Error("JSON must contain an array of rows or an object with a records array.");
  return records.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Every JSON row must be an object.");
    const record = item as Record<string, unknown>;
    if (Array.isArray(record.measurements)) {
      const { measurements, ...metadata } = record;
      return measurements.map((m: unknown) => {
        if (!m || typeof m !== "object" || Array.isArray(m)) throw new Error("Every measurement must be an object.");
        return { ...metadata, ...m };
      });
    }
    return [record];
  });
}

export function mapImport(rows: Record<string, unknown>[], mapping: ColumnMapping, body: CelestialBody): { records: ResearchRecord[]; errors: string[]; warnings: string[] } {
  const records = new Map<string, ResearchRecord>(), errors: string[] = [], warnings: string[] = [];
  if (!rows.length) errors.push("No measurements found.");
  rows.forEach((row, index) => {
    const get = (key: keyof ColumnMapping) => row[mapping[key]];
    const string = (key: keyof ColumnMapping) => String(get(key) ?? "").trim();
    const id = string("id"), name = string("name"), attribute = string("attribute");
    if (!id || !name || !attribute) { errors.push(`Row ${index + 1}: ID, name and attribute are required.`); return; }
    const raw = get("value");
    let value: Measurement["value"] = raw === null || raw === undefined || String(raw).trim() === "" ? null : String(raw).trim();
    if (value !== null && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value))) value = Number(value);
    if (typeof value === "number" && !Number.isFinite(value)) { errors.push(`Row ${index + 1}: value must be finite.`); return; }
    if (value === null) warnings.push(`Row ${index + 1}: missing ${attribute}; excluded from comparisons.`);
    const source = string("source");
    const evidence = string("evidence") || "demo";
    if (!["demo", "measured", "reference"].includes(evidence)) { errors.push(`Row ${index + 1}: evidence must be demo, measured or reference.`); return; }
    if (!source) { errors.push(`Row ${index + 1}: a data source is required.`); return; }
    if (typeof value === "number" && !string("unit")) { errors.push(`Row ${index + 1}: numeric measurements need a unit (use index for dimensionless data).`); return; }
    if (!records.has(id)) records.set(id, { id, name, body, location: string("location"), measurements: [] });
    const record = records.get(id)!;
    if (record.name !== name || record.location !== string("location")) {
      errors.push(`Row ${index + 1}: record ${id} has conflicting name or location.`); return;
    }
    if (record.measurements.some(m => m.attribute === attribute)) { errors.push(`Row ${index + 1}: duplicate ${attribute} for ${id}.`); return; }
    record.measurements.push({ attribute, value, unit: string("unit"), source, evidence: evidence as Evidence });
  });
  return { records: [...records.values()], errors, warnings };
}

export function validateDataset(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { valid: false, errors: ["Dataset must be an object."] };
  const data = input as Dataset;
  if (data.version !== 1) errors.push("Unsupported dataset version.");
  if (!Array.isArray(data.records) || !data.records.length) errors.push("At least one record is required.");
  else {
    const ids = new Set<string>();
    data.records.forEach((r, i) => {
      if (!r || typeof r !== "object") { errors.push(`Invalid record ${i + 1}.`); return; }
      if (typeof r.id !== "string" || !r.id.trim() || ids.has(r.id)) errors.push(`Invalid or duplicate record ID at ${i + 1}.`);
      ids.add(r.id);
      if (typeof r.name !== "string" || !r.name.trim() || typeof r.location !== "string" || !["earth", "mars"].includes(r.body)) errors.push(`Invalid metadata for ${r.id}. Expected Earth or Mars.`);
      if (!Array.isArray(r.measurements)) { errors.push(`Missing measurements for ${r.id}.`); return; }
      const attrs = new Set<string>();
      r.measurements.forEach(m => {
        if (!m || typeof m !== "object") { errors.push(`Invalid measurement for ${r.id}.`); return; }
        if (typeof m.attribute !== "string" || !m.attribute.trim() || attrs.has(m.attribute)) errors.push(`Invalid or duplicate attribute for ${r.id}.`);
        attrs.add(m.attribute);
        if (!(m.value === null || typeof m.value === "string" || (typeof m.value === "number" && Number.isFinite(m.value)))) errors.push(`Invalid value for ${r.id}/${m.attribute}.`);
        if (typeof m.unit !== "string" || (typeof m.value === "number" && !m.unit.trim())) errors.push(`Unit required for ${r.id}/${m.attribute}.`);
        if (typeof m.source !== "string" || !m.source.trim() || !["demo", "measured", "reference"].includes(m.evidence)) errors.push(`Source and evidence required for ${r.id}/${m.attribute}.`);
      });
    });
  }
  if (!Array.isArray(data.rules) || !data.rules.length) errors.push("Comparison rules are required.");
  else {
    const attrs = new Set<string>();
    for (const r of data.rules) {
      if (!r || typeof r.attribute !== "string" || !r.attribute.trim() || attrs.has(r.attribute) || !["numeric", "categorical"].includes(r.kind) || typeof r.unit !== "string" || typeof r.explanation !== "string" || !r.explanation.trim() ||
        !Number.isFinite(r.weight) || r.weight <= 0 || !Number.isFinite(r.tolerance) || (r.kind === "numeric" && (r.tolerance <= 0 || !r.unit.trim()))) errors.push("Every rule needs a unique attribute, kind, unit, positive weight, numeric tolerance and explanation.");
      if (r) attrs.add(r.attribute);
    }
  }
  if (!data.reward || !Number.isFinite(data.reward.amount) || data.reward.amount < 0 ||
    !Number.isInteger(data.reward.minComparable) || data.reward.minComparable < 1 ||
    !Number.isFinite(data.reward.minScore) || data.reward.minScore < 0 || data.reward.minScore > 1) errors.push("Invalid reward criteria.");
  return { valid: errors.length === 0, errors };
}

export function mergeRecords(dataset: Dataset, records: ResearchRecord[], body: CelestialBody): Dataset {
  if (records.some(record => record.body !== body)) throw new Error("Imported records do not match the selected celestial body.");
  const merged: Dataset = { ...dataset, records: [...dataset.records.filter(r => r.body !== body), ...records] };
  const validation = validateDataset(merged);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  return merged;
}
