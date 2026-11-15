import type { FieldTool } from './marsAtlas';
import { FIELD_MAPS, type FieldMap } from './store';
import type { EquipmentArt } from './art/equipment';
import { fieldEquipmentPosition } from './fieldLayout';
import { FIELD_EQUIPMENT, type InventoryTool } from './inventory';

export type TrialTool = Exclude<FieldTool, 'drill'>;
export type TrialSetting = 0 | 1;
export interface FieldRun {
  map: FieldMap;
  tool: TrialTool;
  setting: TrialSetting;
  minute: number;
  result: FieldResult;
}
export interface FieldResult {
  outcome: string;
  metrics: readonly (readonly [string, string])[];
  next: string;
  rankCost?: number;
}

export const FIELD_TOOLS = {
  rover: { name: 'Rover with Mobility Systems', label: 'Rover', art: 'rover', settings: ['Direct approach', 'Surveyed detour'], action: 'Run traverse' },
  spectrum: { name: 'Spectrometer', label: 'Spectrometer', art: 'spectrometer', settings: ['Loose surface sample', 'Exposed outcrop'], action: 'Scan sample' },
  station: { name: 'Environmental Monitoring Station', label: 'Weather station', art: 'environment-station', settings: ['Exposed · daytime', 'Sheltered · dusk'], action: 'Deploy and log' },
  radar: { name: 'Ground-Penetrating Radar (GPR)', label: 'Ground radar', art: 'gpr', settings: ['Reconnaissance line', 'Cross-check line'], action: 'Scan subsurface' },
  mapping: { name: '3D Mapping Instruments', label: '3D mapper', art: '3d-mapping', settings: ['Single pass', 'Overlapping passes'], action: 'Map the terrain' },
  ice: { name: 'Ice Detection Instruments', label: 'Ice detector', art: 'water-ice-detector', settings: ['Surface pass', 'Repeat deeper pass'], action: 'Survey for ice' },
  cameras: { name: 'Navigation Cameras', label: 'Navigation cameras', art: 'navigation-cameras', settings: ['Single view', 'Paired views'], action: 'Capture route images' },
  sampling: { name: 'Sample Collection System', label: 'Sample collector', art: 'sample-collector', settings: ['Loose surface scoop', 'Separate sealed containers'], action: 'Collect and log samples' },
  autonomy: { name: 'Autonomous Navigation Systems', label: 'Autonomous navigation', art: 'autonomous-navigation', settings: ['Follow the route', 'Replan around obstacles'], action: 'Run autonomous navigation' },
  arm: { name: 'Robotic Arm', label: 'Robotic arm', art: 'robotic-arm', settings: ['Extended reach', 'Stabilized close reach'], action: 'Attempt sample transfer' },
  systems: { name: 'Habitat power & communications', art: 'habitat', settings: ['Standard setup', 'Solar buffer + relay'], action: 'Run 24-hour exercise' },
} satisfies Record<TrialTool, { name: string; label?: string; art: EquipmentArt; settings: [string, string]; action: string }>;

type StationTool = Exclude<TrialTool, 'systems'>;
const stations = {
  rover: 'rover', spectrometer: 'spectrum', 'environment-station': 'station', gpr: 'radar',
  '3d-mapping': 'mapping', 'water-ice-detector': 'ice', 'navigation-cameras': 'cameras',
  'sample-collector': 'sampling', 'autonomous-navigation': 'autonomy', 'robotic-arm': 'arm',
} satisfies Record<Exclude<InventoryTool, 'drill'>, StationTool>;

export interface FieldTrialSite {
  id: string;
  map: FieldMap;
  tool: StationTool;
  label: string;
  x: number;
  y: number;
}

export const FIELD_TRIAL_SITES: readonly FieldTrialSite[] = FIELD_MAPS.flatMap((map) =>
  FIELD_EQUIPMENT[map].filter((art) => art !== 'drill').map((art) => {
    const tool = stations[art];
    return { id: map + '-' + tool, map, tool, label: FIELD_TOOLS[tool].label, ...fieldEquipmentPosition(map, art) };
  }));

export const FIELD_CRITERIA = [
  ['Relevance', 'Is the condition required by this test present at this point?'],
  ['Mars similarity', 'Which specific property has a comparable Mars reference?'],
  ['Testing value', 'Which decision does this result help us make?'],
  ['Property coverage', 'What did this trial actually measure?'],
  ['Practical feasibility', 'What access, equipment or follow-up validation is required?'],
] as const;

const fieldConditions = {
  atacama: { slope: 14, traction: 0.62, temperature: 25, wind: 6, dust: 0.34, humidity: 10, daylight: 11, link: 0.76, radar: 0.42,
    minerals: ['Salts and gypsum possible', 'Sulphate-bearing material possible'] },
  haughton: { slope: 21, traction: 0.64, temperature: -8, wind: 9, dust: 0.22, humidity: 37, daylight: 8, link: 0.58, radar: 0.86,
    minerals: ['Mixed impact debris', 'Carbonate-bearing material possible'] },
  'death-valley': { slope: 18, traction: 0.48, temperature: 34, wind: 8, dust: 0.46, humidity: 15, daylight: 10, link: 0.68, radar: 0.60,
    minerals: ['Mixed sand and evaporites possible', 'Silicate-rich rock possible'] },
  wadi: { slope: 19, traction: 0.55, temperature: 29, wind: 7, dust: 0.41, humidity: 16, daylight: 9, link: 0.55, radar: 0.61,
    minerals: ['Quartz-rich sand possible', 'Quartz and feldspar possible'] },
  mcmurdo: { slope: 20, traction: 0.57, temperature: -20, wind: 10, dust: 0.16, humidity: 29, daylight: 12, link: 0.61, radar: 0.72,
    minerals: ['Silicate-rich moraine gravel possible', 'Feldspar and quartz possible'] },
} satisfies Record<FieldMap, {
  slope: number; traction: number; temperature: number; wind: number; dust: number;
  humidity: number; daylight: number; link: number; radar: number; minerals: [string, string];
}>;

export function runFieldTrial({ map, tool, setting }: Pick<FieldRun, 'map' | 'tool' | 'setting'>): FieldResult {
  const c = fieldConditions[map];
  switch (tool) {
    case 'rover': {
      const slope = c.slope - setting * 7;
      const traction = c.traction + setting * 0.17;
      const slip = Math.min(60, Math.round((1 - traction) * slope * 4.5));
      const pass = slip < 33 && slope <= 17;
      const energy = 4 + 1.1 * setting + slip * 0.07;
      return {
        outcome: pass ? 'Waypoint reached' : 'Navigation stopped at the traction limit',
        metrics: [['Maximum slope', slope + '°'], ['Peak slip', slip + '%'], ['Distance', (pass ? 110 + 35 * setting : 53) + ' m'], ['Energy', energy.toFixed(1) + ' Wh']],
        rankCost: pass ? energy : undefined,
        next: pass ? 'Repeat on another terrain and compare the slope, slip and power trade-off.' : 'Try the surveyed detour to reduce slope and avoid loose ground.',
      };
    }
    case 'spectrum':
      return {
        outcome: c.minerals[setting],
        metrics: [['Sample', map.toUpperCase() + '-S' + (setting + 1)], ['Repeat readings', setting ? '3' : '2'], ['Surface contamination', setting ? 'Lower' : 'Higher']],
        next: 'Compare with a published Mars spectrum measured by a compatible instrument. Repeat on a fresh surface to check the identification.',
      };
    case 'station':
      return {
        outcome: 'Environmental observations logged',
        metrics: [['Air temperature', (c.temperature - 11 * setting) + ' °C'], ['Wind speed', (c.wind - 3 * setting) + ' m/s'], ['Relative humidity', (c.humidity + 6 * setting) + '%'], ['Dust index', (c.dust * (1 - 0.55 * setting)).toFixed(2)], ['Light index', setting ? '0.19' : '0.78']],
        next: 'Compare repeat observations with a compatible Mars weather record. Dust and light indices are simulation scales.',
      };
    case 'radar': {
      const clear = c.radar + setting * 0.09 >= 0.67;
      return {
        outcome: clear ? 'A distinct boundary appears under the survey line' : 'Only weak or ambiguous returns',
        metrics: [['Line length', (24 + setting * 8) + ' m'], ['Estimated boundary', clear ? '22–34 cm' : 'Unresolved'], ['Cross-check', setting ? 'Second direction' : 'First line']],
        next: map === 'haughton' && clear ? 'Check the boundary with the drill at Crater Plain. The radar return does not establish whether the material is ice.'
          : map === 'mcmurdo' && clear ? 'Repeat the survey at the ice detection station. A strong radar return can indicate a layer boundary without identifying ground ice.'
          : clear ? 'Use the drill to investigate the change in sediment at this boundary.'
          : 'Repeat the survey before selecting a target. No ice has been established at this point.',
      };
    }
    case 'mapping': {
      const coverage = Math.min(99, Math.round(85 - c.slope + 20 * setting));
      return {
        outcome: coverage >= 85 ? 'Terrain model covers the route' : 'Terrain model has gaps in the route',
        metrics: [['Coverage', coverage + '%'], ['Passes', setting ? '2' : '1'], ['Mapping grid', setting ? '0.25 m' : '0.5 m']],
        next: 'Check slope and gaps in the mapped terrain before choosing a rover route.',
      };
    }
    case 'ice': {
      const repeat = setting === 1;
      return {
        outcome: repeat ? 'Frozen material is a candidate for follow-up' : 'First pass shows an ambiguous response',
        metrics: [['Survey passes', repeat ? '2' : '1'], ['Boundary consistency', repeat ? 'Repeated' : 'Single return'], ['Simulated ground temperature', c.temperature + ' °C']],
        next: 'Compare both passes and record which sections need an independent measurement to identify the material.',
      };
    }
    case 'cameras': {
      const visible = Math.min(99, Math.round(92 - c.dust * 32 + setting * 11));
      return {
        outcome: visible >= 90 ? 'Route features are clear' : 'Some route features need a second view',
        metrics: [['Viewpoints', setting ? '2' : '1'], ['Visible features', visible + '%'], ['Depth estimate', setting ? 'Paired estimate' : 'Single view']],
        next: 'Compare images for obstacles and blind spots before proceeding.',
      };
    }
    case 'sampling':
      return {
        outcome: setting ? 'Samples sealed and logged separately' : 'Surface sample collected',
        metrics: [['Containers', setting ? '2' : '1'], ['Sample type', 'Surface sediment'], ['Mixing risk', setting ? 'Lower' : 'Higher']],
        next: 'Record the collection position and compare the samples at the spectrometer.',
      };
    case 'autonomy': {
      const traverse = runFieldTrial({ map, tool: 'rover', setting });
      return {
        ...traverse,
        metrics: [['Navigation mode', setting ? 'Obstacle replanning' : 'Fixed route'], ...traverse.metrics],
        next: 'Compare the saved trials to see how replanning affected slip, distance and energy.',
      };
    }
    case 'arm': {
      const stable = setting === 1 || c.slope < 18;
      return {
        outcome: stable ? 'Sample transferred to the tray' : 'Transfer stopped at the stability limit',
        metrics: [['Working reach', setting ? '35 cm' : '65 cm'], ['Sample mass transferred', stable ? '120 g' : '0 g'], ['Base slope', c.slope + '°']],
        next: 'Compare with a shorter reach from a stabilized stance.',
      };
    }
    case 'systems': {
      const generated = Math.round(c.daylight * (1 - c.dust * 0.55) * (setting ? 22 : 14));
      const deficit = Math.max(0, 180 - generated - (setting ? 72 : 20));
      const coverage = Math.min(100, Math.round((c.link + setting * 0.31) * 100));
      const pass = deficit === 0 && coverage >= 85;
      return {
        outcome: pass ? 'Power and communications met the scenario targets' : 'Power or communications fell below target',
        metrics: [['Energy from solar', generated + ' Wh'], ['Unserved demand', deficit + ' Wh'], ['Route with signal', coverage + '%'], ['Simulated load', '180 Wh in 24 h']],
        rankCost: pass ? 100 - coverage : undefined,
        next: 'Review power during shadow and communications during the traverse. Real Mars power and life-support tests require validated inputs.',
      };
    }
  }
}
