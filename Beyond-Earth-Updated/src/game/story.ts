import { audio } from './audio';
import { AIRPORT_ENTRY, AIRPORT_SIZE, pendingDestinations, missions as MISSIONS } from './config';
import { FIELD_SITES, FIELD_SURVEY_GRANT, FIELD_SURVEY_READINGS, fieldReadingCount, fieldSiteFor, fieldSurveyFlag } from './research';
export { missions as MISSIONS } from './config';
import {
  bus, FIELD_MAPS, freshSave, live, STAGES, store,
  type DialogueLine, type MapId, type Panel, type SaveData, type Stage, type UIState,
} from './store';

export const stageIdx = (s: Stage) => STAGES.indexOf(s);
export const atLeast = (s: Stage) => stageIdx(store.get().game.stage) >= stageIdx(s);
export const CHALLENGE_SPONSOR = 'Aster Reach Aerospace';

export function missionText(g: SaveData): { title: string; text: string } {
  const m = MISSIONS[g.stage];
  if (g.map === 'airport') {
    const flights = pendingDestinations(g);
    if (flights.length) return {
      title: 'Board Your Flight',
      text: flights.length === 1 ? `Head to Gate ${flights[0].gate} for ${flights[0].place}, or book other destinations at a kiosk.`
        : `You have ${flights.length} boarding passes. Choose a destination at its gate.`,
    };
  }
  const site = fieldSiteFor(g.map);
  if (g.stage === 'wadi' && g.map === 'wadi' && site) return { title: `Investigate ${site.name}`, text: `Open Field Records at the sample collector in the equipment ring. Readings logged ${fieldReadingCount(g.samples, site)}/${FIELD_SURVEY_READINGS}.` };
  if (site && g.map !== 'wadi') return { title: `Explore ${site.place}`, text: 'Press E at a tool in the central ring. Open Field Records at the sample collector or check J for trial results.' };
  return m;
}

export function clock(min: number) {
  const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function journal(text: string) {
  const g = store.get().game;
  store.game({ journal: [{ time: clock(g.minutes), text }, ...g.journal].slice(0, 80) });
}

export function awardFieldSurveyGrants() {
  const game = store.get().game;
  const completed = Object.values(FIELD_SITES).filter((site) =>
    !game.flags[fieldSurveyFlag(site.id)] && fieldReadingCount(game.samples, site) >= FIELD_SURVEY_READINGS);
  if (!completed.length) return false;

  const flags = { ...game.flags };
  for (const site of completed) flags[fieldSurveyFlag(site.id)] = true;
  const amount = completed.length * FIELD_SURVEY_GRANT;
  store.game({ wallet: game.wallet + amount, flags });
  for (const site of completed) journal(`Field survey grant for ${site.place}: +${FIELD_SURVEY_GRANT} USD.`);
  toast(`Field survey grant: +${amount.toLocaleString()} USD`);
  audio.play('reward');
  return true;
}

export function setStage(s: Stage) {
  const g = store.get().game;
  if (stageIdx(s) <= stageIdx(g.stage)) return;
  store.game({ stage: s });
  const m = missionText({ ...g, stage: s });
  store.ui({ banner: { title: m.title, text: m.text, key: Date.now() } });
  journal(`New mission: ${m.title}`);
  audio.play('confirm');
}

export function setFlag(k: string, v = true) {
  const g = store.get().game;
  if (g.flags[k] === v) return;
  store.game({ flags: { ...g.flags, [k]: v } });
}

export function reviewMarsResearch() {
  const g = store.get().game;
  if (!g.flags.marsViewed) {
    setFlag('marsViewed');
    journal('Reviewed Mars reference data and the Earth analog atlas.');
  }
  if (g.stage === 'refs') setStage('family');
  if (!g.flags.marsViewed || g.stage === 'refs') saveProgress();
}

let onDialogueDone: (() => void) | null = null;
export function cancelDialogue() {
  // Closing a conversation must not award its completion or advance the story.
  onDialogueDone = null;
  store.ui({ dialogue: null });
  audio.play('close');
}
export function say(lines: DialogueLine[], done?: () => void) {
  onDialogueDone = done ?? null;
  store.ui({ dialogue: { lines, i: 0, opened: performance.now() }, prompt: null });
  audio.play('open');
}
export function advanceDialogue() {
  const d = store.get().ui.dialogue;
  if (!d) return;
  if (performance.now() - d.opened < 180) return;
  if (d.i < d.lines.length - 1) {
    store.ui({ dialogue: { ...d, i: d.i + 1, opened: performance.now() } });
    audio.play('blip');
  } else {
    finishDialogue();
  }
}

export function finishDialogue() {
  if (!store.get().ui.dialogue) return;
  const done = onDialogueDone;
  onDialogueDone = null;
  store.ui({ dialogue: null });
  audio.play('close');
  done?.();
}

export function openPanel(p: Panel, extra: Partial<Pick<UIState, 'researchSite' | 'flightDestination'>> = {}) {
  store.ui({ panel: p, prompt: null, ...extra });
  audio.play('open');
}
export function closePanel() {
  const ui = store.get().ui;
  if (ui.panelReturn) { store.ui({ panel: ui.panelReturn, panelReturn: null }); audio.play('close'); return; }
  store.ui({ panel: null, researchSite: null, flightDestination: undefined });
  audio.play('close');
}

export function toast(text: string) { store.ui({ toast: { text, key: Date.now() } }); }

export function warp(map: MapId, x: number, y: number, fadeOut = true) { bus.emit('warp', { map, x, y, fadeOut }); }

const PROGRESS_KEY = 'beyond-earth-save-v1';

export function readProgress(): SaveData | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null');
    if (!saved || saved.v !== 1 || !STAGES.includes(saved.stage) ||
        !['home', 'city', 'airport', ...FIELD_MAPS].includes(saved.map) ||
        !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return null;
    const game: SaveData = { ...freshSave(), ...saved };
    if (!saved.flags?.legacyDemoCleared) {
      game.samples = Object.fromEntries(Object.entries(game.samples).filter(([, sample]) => sample.measurement.evidence !== 'demo'));
      game.submissions = game.submissions.filter((submission) => submission.refId !== 'mars-demo');
      game.journal = game.journal.filter(({ text }) => !text.endsWith('(demo).') &&
        !text.startsWith('Submitted comparison vs Mars · fictional reference terrain:'));
      game.flags = { ...game.flags, legacyDemoCleared: true };
    }
    if (game.stage === 'refs' && game.flags.marsViewed) game.stage = 'family';
    if (game.map === 'airport' && (game.x >= AIRPORT_SIZE.w - 17 || game.y >= AIRPORT_SIZE.h - 2)) {
      return { ...game, ...AIRPORT_ENTRY };
    }
    return game;
  } catch {
    return null;
  }
}

export function saveProgress() {
  const state = store.get();
  if (state.screen !== 'game') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...state.game, map: live.map, x: Math.round(live.x), y: Math.round(live.y),
    }));
  } catch {
    // Browser storage may be unavailable.
  }
}

export function continueGame() {
  const saved = readProgress();
  if (!saved) return;
  begin(saved);
  if (awardFieldSurveyGrants()) saveProgress();
}

function begin(g: SaveData) {
  live.map = g.map; live.x = g.x; live.y = g.y;
  store.set({
    screen: 'game', game: g,
    ui: { ...store.get().ui, panel: null, panelReturn: null, dialogue: null, prompt: null, banner: null, mapOverview: false, fade: false, flightDestination: undefined, tutorialAt: store.get().settings.showTutorial ? Date.now() : 0 },
  });
  audio.start();
}
export function newGame() {
  const g = freshSave();
  begin(g);
  saveProgress();
  setTimeout(() => store.ui({ banner: { title: MISSIONS.sleep.title, text: MISSIONS.sleep.text, key: Date.now() } }), 900);
}
export function quitToTitle() {
  saveProgress();
  store.set({ screen: 'title', ui: { ...store.get().ui, panel: null, dialogue: null, prompt: null } });
  audio.setMood('title');
}
