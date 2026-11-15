import { store, type MapId, type SurveyRows } from './store';

export const surveyGrid = 32;
const surveyRadius: Record<MapId, number> = { home: 175, airport: 235, city: 375, wadi: 420, atacama: 390, haughton: 390, 'death-valley': 390, mcmurdo: 390 };

export function isSurveyed(rows: SurveyRows | undefined, x: number, y: number) {
  const column = Math.floor(x / surveyGrid);
  return rows?.[Math.floor(y / surveyGrid)]?.some(([left, right]) => column >= left && column < right) ?? false;
}

export function revealMap(map: MapId, bounds: { w: number; h: number }, x: number, y: number) {
  const { explored = {} } = store.get().game;
  const rows = explored[map] ?? {};
  const radius = surveyRadius[map];
  let updated: typeof rows | undefined;

  for (let row = Math.max(0, Math.floor((y - radius) / surveyGrid)); row < Math.ceil(Math.min(y + radius, bounds.h) / surveyGrid); row++) {
    const dy = (row + 0.5) * surveyGrid - y;
    if (Math.abs(dy) >= radius) continue;
    const halfWidth = Math.sqrt(radius * radius - dy * dy);
    const left = Math.max(0, Math.floor((x - halfWidth) / surveyGrid));
    const right = Math.min(Math.ceil(bounds.w / surveyGrid), Math.ceil((x + halfWidth) / surveyGrid));
    const previous = rows[row] ?? [];
    if (left >= right || previous.some(([a, b]) => a <= left && b >= right)) continue;

    const merged: [number, number][] = [];
    for (const [a, b] of [...previous, [left, right] as [number, number]].sort(([a], [b]) => a - b)) {
      const last = merged[merged.length - 1];
      if (last && last[1] >= a) last[1] = Math.max(last[1], b);
      else merged.push([a, b]);
    }
    (updated ??= { ...rows })[row] = merged;
  }
  if (updated) store.game({ explored: { ...explored, [map]: updated } });
}
