import type { Dataset, ResearchRecord } from '@/science/model';
import type { FieldMap, MapId, Sample } from './store';

export const FIELD_READINGS = [
  { id: 'thermo', name: 'Air temperature', attribute: 'temperature' },
  { id: 'hygro', name: 'Relative humidity', attribute: 'humidity' },
  { id: 'gps', name: 'Elevation', attribute: 'elevation' },
  { id: 'clino', name: 'Ground slope', attribute: 'slope' },
  { id: 'scanner', name: 'Surface roughness', attribute: 'roughness' },
  { id: 'geo', name: 'Rock composition', attribute: 'geology' },
  { id: 'soil', name: 'Soil class', attribute: 'soil' },
  { id: 'env', name: 'Local climate', attribute: 'climate' },
  { id: 'resource', name: 'Subsurface resources', attribute: 'resources' },
];

export const WADI_FIELD_SITE = {
  id: 'wadi-excavation', place: 'Wadi Rum', name: 'Wadi Rum Field Survey',
  note: 'Review documented observations from the active dataset.',
};

export const FIELD_SITES = {
  atacama: { id: 'atacama-ice-lab', place: 'Atacama Desert', name: 'Atacama Field Station', note: 'Survey sediments and salts from the dry basin, then compare with Mars.' },
  haughton: { id: 'haughton-field-lab', place: 'Haughton Crater', name: 'Haughton Field Station', note: 'Survey impact-crater terrain, cold ground and candidate subsurface layers.' },
  'death-valley': { id: 'death-valley-lab', place: 'Death Valley', name: 'Death Valley Field Station', note: 'Compare rocky slopes, sand, and wind-shaped deposits with Mars references.' },
  wadi: WADI_FIELD_SITE,
  mcmurdo: { id: 'mcmurdo-field-lab', place: 'McMurdo Dry Valleys', name: 'McMurdo Field Station', note: 'Compare exposed polar terrain and frozen-ground field trials with Mars references.' },
} satisfies Record<FieldMap, typeof WADI_FIELD_SITE>;

export function fieldSiteFor(map: MapId) {
  return FIELD_SITES[map as FieldMap];
}

export function samplesForSite(samples: Record<string, Sample>, site: typeof WADI_FIELD_SITE) {
  return Object.fromEntries(Object.entries(samples).filter(([, sample]) =>
    sample.site === site.id || (site.id === WADI_FIELD_SITE.id && /wadi rum/i.test(sample.location))));
}

export const FIELD_SURVEY_GRANT = 450;
export const FIELD_SURVEY_READINGS = 3;
export const fieldSurveyFlag = (siteId: string) => `field-survey-paid:${siteId}`;

export function fieldReadingCount(samples: Record<string, Sample>, site: typeof WADI_FIELD_SITE) {
  return new Set(Object.values(samplesForSite(samples, site))
    .filter((sample) => sample.measurement?.value != null)
    .map((sample) => sample.attribute)).size;
}

/** Choose the Earth record for a field location by body + location, never by hardcoded ID. */
export function earthRecordFor(ds: Dataset | null, place = 'wadi rum'): ResearchRecord | null {
  if (!ds) return null;
  const earth = ds.records.filter((r) => r.body === 'earth');
  const re = new RegExp(place, 'i');
  return earth.find((r) => re.test(r.location) || re.test(r.name)) ?? null;
}

export function formatValue(v: number | string | null, unit: string) {
  if (v === null || v === undefined || v === '') return 'unavailable';
  return typeof v === 'number' ? `${Number.isInteger(v) ? v : v.toFixed(2)} ${unit}`.trim() : `${v}${unit ? ' ' + unit : ''}`;
}

export const RANKS = [
  { min: 0, name: 'Field Volunteer' }, { min: 1, name: 'Analog Scout' }, { min: 3, name: 'Survey Lead' }, { min: 6, name: 'Principal Investigator' },
];
export const rankFor = (n: number) => [...RANKS].reverse().find((r) => n >= r.min)!.name;
