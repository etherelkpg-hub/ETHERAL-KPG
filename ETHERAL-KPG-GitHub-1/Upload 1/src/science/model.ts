export type CelestialBody = "earth" | "mars";
export type Evidence = "demo" | "measured" | "reference";
export interface Measurement {
  attribute: string;
  value: number | string | null;
  unit: string;
  source: string;
  evidence: Evidence;
  note?: string;
}
export interface ResearchRecord {
  id: string;
  name: string;
  body: CelestialBody;
  location: string;
  measurements: Measurement[];
}
export interface ComparisonRule {
  attribute: string;
  kind: "numeric" | "categorical";
  unit: string;
  tolerance: number;
  weight: number;
  explanation: string;
}
export interface Dataset {
  version: 1;
  records: ResearchRecord[];
  rules: ComparisonRule[];
  reward: { amount: number; minComparable: number; minScore: number };
}
export interface ComparisonRow {
  attribute: string;
  earthValue: number | string | null;
  referenceValue: number | string | null;
  unit: string;
  difference: number | null;
  score: number | null;
  status: "matching" | "different" | "missing" | "incompatible";
  explanation: string;
  source: string;
  evidence: string;
}
export interface ComparisonReport {
  rows: ComparisonRow[];
  score: number | null;
  comparable: number;
  limitations: string[];
}
