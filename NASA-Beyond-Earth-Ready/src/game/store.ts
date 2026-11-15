import { useSyncExternalStore } from 'react';
import type { Dataset, Measurement } from '@/science/model';
import type { DrillResult } from './drill';
import type { FieldRun } from './fieldTrials';

export const FIELD_MAPS = ['atacama', 'haughton', 'death-valley', 'wadi', 'mcmurdo'] as const;
export type FieldMap = (typeof FIELD_MAPS)[number];
export type MapId = 'home' | 'city' | 'airport' | FieldMap;
export const STAGES = ['sleep', 'email', 'refs', 'family', 'leave', 'city', 'book', 'wadi', 'compare', 'submit', 'done'] as const;
export type Stage = (typeof STAGES)[number];
export type Speaker = 'player' | 'mom' | 'dad' | 'news' | 'staff' | 'narrator';

export interface Sample {
  attribute: string;
  instrument: string;
  site: string;
  recordId: string;
  location: string;
  measurement: Measurement;
  time: string;
}
export interface Submission {
  id: string;
  refId: string;
  refName: string;
  score: number | null;
  comparable: number;
  reward: number;
  eligible: boolean;
  reason: string;
  date: string;
}
export interface Ticket { from: string; to: string; price: number; date: string; flight: string }
export type SurveyRows = Record<number, [number, number][]>;
export interface SaveData {
  v: 1;
  stage: Stage;
  map: MapId;
  x: number;
  y: number;
  flags: Record<string, boolean>;
  wallet: number;
  samples: Record<string, Sample>;
  drillRuns?: DrillResult[];
  fieldRuns?: FieldRun[];
  submissions: Submission[];
  rewardedRefs: string[];
  tickets: Ticket[];
  pendingFlights?: string[];
  visited: string[];
  explored?: Partial<Record<MapId, SurveyRows>>;
  minutes: number;
  journal: { time: string; text: string }[];
}
export interface Settings { master: number; music: number; ambient: number; sfx: number; showTutorial: boolean }
export type Panel =
  | 'pause' | 'settings' | 'computer' | 'inventory' | 'journal' | 'map' | 'booking'
  | 'flight' | 'research' | 'analysis' | 'drill' | 'data' | 'mars-atlas' | 'field-trial' | 'site-comparison' | null;
export interface DialogueLine { speaker: Speaker; text: string; name?: string; portrait?: string }
export interface UIState {
  panel: Panel;
  panelReturn: Panel;
  prompt: string | null;
  dialogue: { lines: DialogueLine[]; i: number; opened: number } | null;
  researchSite: string | null;
  flightDestination?: FieldMap;
  tutorialAt: number;
  banner: { title: string; text: string; key: number } | null;
  toast: { text: string; key: number } | null;
  area: string;
  fade: boolean;
}
export interface State {
  screen: 'title' | 'game';
  ui: UIState;
  game: SaveData;
  settings: Settings;
  dataset: Dataset | null;
  datasetError: string | null;
}

const SETTINGS_KEY = 'beyond-earth-settings-v1';

export function freshSave(): SaveData {
  return {
    v: 1, stage: 'sleep', map: 'home', x: 270, y: 380, flags: { legacyDemoCleared: true }, wallet: 800, samples: {},
    submissions: [], rewardedRefs: [], tickets: [], visited: ['United States'], minutes: 7 * 60 + 12,
    journal: [],
  };
}
function loadSettings(): Settings {
  const d: Settings = { master: 0.8, music: 0.55, ambient: 0.6, sfx: 0.7, showTutorial: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return d; }
}

let state: State = {
  screen: 'title',
  ui: {
    panel: null, panelReturn: null, prompt: null, dialogue: null, researchSite: null, tutorialAt: 0,
    banner: null, toast: null, area: '', fade: false,
  },
  game: freshSave(),
  settings: loadSettings(),
  dataset: null,
  datasetError: null,
};
const listeners = new Set<() => void>();

/** Live, non-reactive values written every frame by Phaser. */
export const live = { x: 0, y: 0, map: 'home' as MapId };

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  ui(patch: Partial<UIState>) { store.set({ ui: { ...state.ui, ...patch } }); },
  game(patch: Partial<SaveData>) { store.set({ game: { ...state.game, ...patch } }); },
  settings(patch: Partial<Settings>) {
    const s = { ...state.settings, ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    store.set({ settings: s });
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(state));
}

type Handler = (payload?: unknown) => void;
const handlers: Record<string, Set<Handler>> = {};
export const bus = {
  on(ev: string, h: Handler) { (handlers[ev] ??= new Set()).add(h); return () => { handlers[ev]?.delete(h); }; },
  emit(ev: string, payload?: unknown) { handlers[ev]?.forEach((h) => h(payload)); },
};

export function isBlocked(): boolean {
  const s = state;
  return s.screen !== 'game' || s.ui.panel !== null || s.ui.dialogue !== null || s.ui.fade;
}
