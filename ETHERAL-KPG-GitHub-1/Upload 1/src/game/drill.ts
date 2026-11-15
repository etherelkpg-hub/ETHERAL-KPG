import type { FieldMap } from './store';
export type DrillMaterial = 'dry' | 'frozen';
export type DrillMode = 'steady' | 'boost';

export interface DrillPad {
  id: string;
  region: FieldMap;
  name: string;
  temperature: number;
  archived?: boolean;
  layers: readonly { toCm: number; name: string; material: DrillMaterial; load: number }[];
}

export const DRILL_REGIONS = { atacama: 'Atacama Desert', haughton: 'Haughton Crater', 'death-valley': 'Death Valley', wadi: 'Wadi Rum', mcmurdo: 'McMurdo Dry Valleys' };
export const DRILL_PADS: readonly DrillPad[] = [
  { id: 'atacama-basin', region: 'atacama', name: 'Dry Basin', temperature: 22, layers: [
    { toCm: 12, name: 'Loose dry sediment', material: 'dry', load: 0.34 },
    { toCm: 30, name: 'Compact dry sediment', material: 'dry', load: 0.68 },
  ] },
  { id: 'atacama-crust', region: 'atacama', name: 'Salt Crust', archived: true, temperature: 25, layers: [
    { toCm: 8, name: 'Dry sediment', material: 'dry', load: 0.42 },
    { toCm: 22, name: 'Cemented salt crust', material: 'dry', load: 0.94 },
    { toCm: 30, name: 'Dry sediment below crust', material: 'dry', load: 0.56 },
  ] },
  { id: 'haughton-plain', region: 'haughton', name: 'Crater Plain', temperature: -8, layers: [
    { toCm: 10, name: 'Loose surface rubble', material: 'dry', load: 0.48 },
    { toCm: 30, name: 'Frozen sediment', material: 'frozen', load: 0.75 },
  ] },
  { id: 'haughton-rim', region: 'haughton', name: 'Crater Rim', archived: true, temperature: -12, layers: [
    { toCm: 6, name: 'Loose surface rubble', material: 'dry', load: 0.53 },
    { toCm: 30, name: 'Ice-cemented rubble', material: 'frozen', load: 1.14 },
  ] },
  { id: 'death-valley-core', region: 'death-valley', name: 'Basin Core', temperature: 34, layers: [
    { toCm: 16, name: 'Loose basin sand', material: 'dry', load: 0.29 },
    { toCm: 30, name: 'Compacted basin sediment', material: 'dry', load: 0.63 },
  ] },
  { id: 'wadi-core', region: 'wadi', name: 'Sandstone Core', archived: true, temperature: 29, layers: [
    { toCm: 10, name: 'Loose valley sand', material: 'dry', load: 0.31 },
    { toCm: 30, name: 'Consolidated sandstone', material: 'dry', load: 0.79 },
  ] },
  { id: 'mcmurdo-core', region: 'mcmurdo', name: 'Polar Ground Core', archived: true, temperature: -20, layers: [
    { toCm: 11, name: 'Dry surface gravel', material: 'dry', load: 0.35 },
    { toCm: 30, name: 'Ice-cemented sediment', material: 'frozen', load: 0.70 },
  ] },
];

export const DRILL_MODES = {
  steady: { label: 'Steady', capacity: 0.82, idleW: 22, speed: 0.09 },
  boost: { label: 'Boost', capacity: 1.08, idleW: 46, speed: 0.13 },
};
export const DRILL_TARGET_CM = 30;
export const DRILL_BUDGET_WH = 10;

export interface DrillResult {
  padId: string;
  mode: DrillMode;
  depthCm: number;
  energyWh: number;
  seconds: number;
  sample: { name: string; material: DrillMaterial } | null;
  outcome: 'collected' | 'load' | 'battery';
}

export function simulateDrill(pad: DrillPad, mode: DrillMode): DrillResult {
  const settings = DRILL_MODES[mode];
  const result: DrillResult = { padId: pad.id, mode, depthCm: 0, energyWh: 0, seconds: 0, sample: null, outcome: 'collected' };
  for (const layer of pad.layers) {
    const load = layer.load * (1 + Math.max(0, -pad.temperature) * 0.006);
    if (load >= settings.capacity) return { ...result, outcome: 'load' };
    const rate = settings.speed * (1 - 0.55 * load / settings.capacity);
    const power = settings.idleW + 72 * load;
    const required = (layer.toCm - result.depthCm) / rate;
    const available = (DRILL_BUDGET_WH - result.energyWh) * 3600 / power;
    if (required > available) return {
      ...result, depthCm: result.depthCm + rate * available,
      energyWh: DRILL_BUDGET_WH, seconds: result.seconds + available, outcome: 'battery',
    };
    result.depthCm = layer.toCm;
    result.energyWh += power * required / 3600;
    result.seconds += required;
    if (result.depthCm === DRILL_TARGET_CM) result.sample = { name: layer.name, material: layer.material };
  }
  return result;
}

export function drillRecommendation(results: readonly DrillResult[], mode: DrillMode, material: DrillMaterial) {
  const comparable = results.filter((result) => result.mode === mode && DRILL_PADS.some((pad) => pad.id === result.padId));
  const regions = new Set(DRILL_PADS.filter((pad) => comparable.some((run) => run.padId === pad.id)).map((pad) => pad.region));
  if (regions.size < 2) return { status: 'pending' as const };
  const best = comparable.filter((run) => run.outcome === 'collected' && run.sample?.material === material)
    .sort((a, b) => a.energyWh - b.energyWh)[0];
  return best ? { status: 'ready' as const, best } : { status: 'no-match' as const };
}
