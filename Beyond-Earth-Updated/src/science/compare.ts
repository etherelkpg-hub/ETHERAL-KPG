import type { ComparisonReport, ComparisonRow, ComparisonRule, Dataset, ResearchRecord } from "./model";

const units: Record<string, { dimension: string; scale: number; offset: number }> = {
  c: { dimension: "temperature", scale: 1, offset: 273.15 },
  "°c": { dimension: "temperature", scale: 1, offset: 273.15 },
  k: { dimension: "temperature", scale: 1, offset: 0 },
  f: { dimension: "temperature", scale: 5 / 9, offset: 255.3722222222222 },
  "°f": { dimension: "temperature", scale: 5 / 9, offset: 255.3722222222222 },
  m: { dimension: "length", scale: 1, offset: 0 },
  km: { dimension: "length", scale: 1000, offset: 0 },
  cm: { dimension: "length", scale: 0.01, offset: 0 },
  mm: { dimension: "length", scale: 0.001, offset: 0 },
  ft: { dimension: "length", scale: 0.3048, offset: 0 },
  deg: { dimension: "angle", scale: 1, offset: 0 },
  "°": { dimension: "angle", scale: 1, offset: 0 },
  degrees: { dimension: "angle", scale: 1, offset: 0 },
  rad: { dimension: "angle", scale: 180 / Math.PI, offset: 0 },
  "%": { dimension: "ratio", scale: 0.01, offset: 0 },
  fraction: { dimension: "ratio", scale: 1, offset: 0 },
  index: { dimension: "index", scale: 1, offset: 0 },
};

export function convertUnit(value: number, from: string, to: string): number | null {
  if (!Number.isFinite(value)) return null;
  const f = from.trim().toLowerCase(), t = to.trim().toLowerCase();
  if (f === t) return value;
  const a = units[f], b = units[t];
  if (!a || !b || a.dimension !== b.dimension) return null;
  return (value * a.scale + a.offset - b.offset) / b.scale;
}

export function compareRecords(earth: ResearchRecord, reference: ResearchRecord, rules: ComparisonRule[]): ComparisonReport {
  const limitations = new Set<string>([
    "Similarity applies only to the selected attributes, not habitability or equivalence to another planet.",
    "Elevation requires a shared datum; climate and temperature require compatible sampling periods. Demo comparisons illustrate mechanics only.",
  ]);
  const validBodies = earth.body === "earth" && reference.body === "mars";
  let weighted = 0, weights = 0;
  const rows: ComparisonRow[] = rules.map(rule => {
    const a = earth.measurements.find(m => m.attribute === rule.attribute);
    const b = reference.measurements.find(m => m.attribute === rule.attribute);
    const row: ComparisonRow = {
      attribute: rule.attribute, earthValue: a?.value ?? null, referenceValue: b?.value ?? null,
      unit: rule.unit, difference: null, score: null, status: "missing",
      explanation: rule.explanation, source: `${a?.source || "Unavailable"} / ${b?.source || "Unavailable"}`,
      evidence: `${a?.evidence || "missing"} / ${b?.evidence || "missing"}`,
    };
    if (a?.evidence === "demo" || b?.evidence === "demo") limitations.add("Contains synthetic demo values used for gameplay.");
    if (!a || !b || a.value === null || b.value === null || a.value === "" || b.value === "") {
      row.explanation = "Measurement unavailable; excluded from the score.";
      return row;
    }
    if (!validBodies || !Number.isFinite(rule.weight) || rule.weight <= 0) {
      row.status = "incompatible";
      row.explanation = "Select an Earth record and a Mars reference with a positive comparison weight.";
      return row;
    }
    if (rule.kind === "numeric") {
      const av = typeof a.value === "number" ? convertUnit(a.value, a.unit, rule.unit) : null;
      const bv = typeof b.value === "number" ? convertUnit(b.value, b.unit, rule.unit) : null;
      if (av === null || bv === null || !Number.isFinite(rule.tolerance) || rule.tolerance <= 0) {
        row.status = "incompatible";
        row.explanation = "Units, numeric values, or tolerance are incompatible; excluded from the score.";
        return row;
      }
      // A declared numeric tolerance does not establish a shared planetary altitude datum.
      if (rule.attribute === "elevation" && (a.evidence !== "demo" || b.evidence !== "demo")) {
        row.status = "incompatible";
        row.explanation = "Cross-planet absolute elevation has no shared datum; compare relative relief using an explicitly defined attribute instead.";
        return row;
      }
      row.earthValue = Number(av.toFixed(6));
      row.referenceValue = Number(bv.toFixed(6));
      row.difference = Math.abs(av - bv);
      row.score = Math.max(0, 1 - row.difference / rule.tolerance);
      row.status = row.difference <= rule.tolerance ? "matching" : "different";
      row.explanation += ` Formula: max(0, 1 − |Earth − reference| / ${rule.tolerance}); weight ${rule.weight}.`;
    } else {
      if (a.unit !== b.unit || typeof a.value !== "string" || typeof b.value !== "string") {
        row.status = "incompatible";
        row.explanation = "Categorical values require the same classification and units.";
        return row;
      }
      row.score = a.value.trim().toLowerCase() === b.value.trim().toLowerCase() ? 1 : 0;
      row.status = row.score === 1 ? "matching" : "different";
      row.explanation += " Exact category equality only; no inferred geological equivalence.";
    }
    weighted += row.score * rule.weight;
    weights += rule.weight;
    return row;
  });
  const comparable = rows.filter(row => row.score !== null).length;
  if (comparable < rules.length) limitations.add("Missing or incompatible measurements were excluded; incomplete evidence limits interpretation.");
  return { rows, score: weights > 0 ? weighted / weights : null, comparable, limitations: [...limitations] };
}

export function evaluateSubmission(report: ComparisonReport, dataset: Dataset): { eligible: boolean; reward: number; reason: string } {
  const eligible = report.score !== null && Number.isFinite(report.score) &&
    report.comparable >= dataset.reward.minComparable && report.score >= dataset.reward.minScore;
  return {
    eligible,
    reward: eligible ? dataset.reward.amount : 0,
    reason: eligible
      ? "Meets the configured game challenge. The reward is fictional in-game currency."
      : `Insufficient evidence or similarity for this challenge. Requires ${dataset.reward.minComparable} comparable attributes and a ${(dataset.reward.minScore * 100).toFixed(0)}% game score.`,
  };
}
