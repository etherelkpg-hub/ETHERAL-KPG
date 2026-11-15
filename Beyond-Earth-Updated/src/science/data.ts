import type { Dataset } from "./model";
import { validateDataset } from "./import";

const STORAGE_KEY = "beyond-earth-research-dataset-v1";

async function fetchDefaults(): Promise<Dataset> {
  const files = ['earth_measurements', 'mars_reference', 'comparison_rules', 'challenge'];
  const [earth, mars, rules, challenge] = await Promise.all(files.map(async file => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${file}.json`);
    if (!response.ok) throw new Error(`Could not load ${file} (${response.status}).`);
    return response.json();
  }));
  if (![earth, mars, rules].every(Array.isArray)) throw new Error('Research records and comparison rules must be JSON arrays.');
  const data: unknown = { version: challenge.version, records: [...earth, ...mars], rules, reward: challenge.reward };
  const validation = validateDataset(data);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  return data as Dataset;
}

export async function loadDataset(): Promise<Dataset> {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return fetchDefaults();
  const parsed = JSON.parse(saved);
  // Preserve imported Earth and Mars records when opening a save from an older version.
  if (Array.isArray(parsed?.records)) parsed.records = parsed.records.filter((record: { body?: string } | null) => record?.body !== 'moon');
  const validation = validateDataset(parsed);
  if (!validation.valid) throw new Error(`Saved research data is invalid. Reset the dataset in Data Management. ${validation.errors.join(" ")}`);
  const stored = parsed as Dataset & { legacyDemoCleared?: boolean };
  const records = stored.legacyDemoCleared ? stored.records : stored.records.flatMap((record) => {
    const measurements = record.measurements.filter((measurement) => measurement.evidence !== 'demo');
    if (record.measurements.length && !measurements.length) return [];
    return [{ ...record, measurements }];
  });
  const dataset = { ...stored, records };
  const regionalIds = ['earth-wadi-rum', 'earth-atacama', 'earth-haughton', 'earth-death-valley', 'earth-mcmurdo'];
  const missing = regionalIds.filter((id) => !dataset.records.some((record) => record.id === id));
  if (!missing.length) return dataset;
  const defaults = await fetchDefaults();
  const added = defaults.records.filter((record) => missing.includes(record.id) &&
    !dataset.records.some((existing) => existing.body === 'earth' && existing.location.toLowerCase().startsWith(record.location.split(',')[0].toLowerCase())));
  return { ...dataset, records: [...dataset.records, ...added] };
}

export function saveDataset(dataset: Dataset): void {
  const validation = validateDataset(dataset);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...dataset, legacyDemoCleared: true }));
  window.dispatchEvent(new CustomEvent("beyond-earth-dataset-updated"));
}

export async function restoreDataset(): Promise<Dataset> {
  const data = await fetchDefaults();
  saveDataset(data);
  return data;
}
