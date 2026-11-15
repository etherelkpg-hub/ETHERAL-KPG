import { useEffect, useState } from 'react';
import { loadGameConfig } from '@/game/config';
import { loadDataset } from '@/science/data';
import { audio } from '@/game/audio';
import { bus, store, useStore } from '@/game/store';
import { advanceDialogue, cancelDialogue, closePanel, openPanel, saveProgress } from '@/game/story';
import { Analysis, ResearchKit } from './Research';
import { DrillTrialPanel } from './DrillTrials';
import { FieldTrialPanel, MarsAtlasPanel } from './MarsAtlas';
import { Booking, Flight } from './Travel';
import { Computer } from './Computer';
import { Inventory, Journal, MapPanel, Pause, Settings } from './Menus';
import { DataManager } from './DataManager';
import { Dialogue, typing } from './Dialogue';
import { GameCanvas } from './GameCanvas';
import { Hud } from './Hud';
import { Title } from './Title';
import { SiteComparison } from './SiteComparison';

const shortcutPanels = { KeyI: 'inventory', KeyJ: 'journal', KeyM: 'map' } as const;
const keyboardPanels: readonly string[] = Object.values(shortcutPanels);
const fallbackKeys: Partial<Record<string, string>> = { e: 'KeyE', i: 'KeyI', j: 'KeyJ', m: 'KeyM' };

function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
      const st = store.get();
      if (st.screen !== 'game') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (st.ui.panel === 'flight' || st.ui.fade) return;
        if (st.ui.dialogue) { cancelDialogue(); return; }
        if (st.ui.panel) closePanel(); else openPanel('pause');
        return;
      }
      if (st.ui.fade || st.ui.panel === 'flight') return;
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;

      const code = e.code && e.code !== 'Unidentified' ? e.code : fallbackKeys[e.key.toLowerCase()];
      if (st.ui.dialogue) {
        if (code === 'KeyE' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (typing.active) typing.finish(); else advanceDialogue();
        }
        return;
      }
      if (code === 'KeyE' && st.ui.panel === null) {
        e.preventDefault();
        bus.emit('interact');
        return;
      }
      if (code === 'KeyI' || code === 'KeyJ' || code === 'KeyM') {
        if (st.ui.panel && !keyboardPanels.includes(st.ui.panel)) return;
        e.preventDefault();
        const panel = shortcutPanels[code];
        if (st.ui.panel === panel) closePanel(); else openPanel(panel);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

export function GameRoot() {
  const [configReady, setConfigReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const screen = useStore((s) => s.screen);
  const panel = useStore((s) => s.ui.panel);
  const settings = useStore((s) => s.settings);
  useGlobalKeys();

  useEffect(() => {
    loadGameConfig().then(() => setConfigReady(true)).catch((error: Error) => setConfigError(error.message));
    loadDataset().then((ds) => store.set({ dataset: ds, datasetError: null })).catch((e: Error) => store.set({ datasetError: e.message || String(e) }));
  }, []);
  useEffect(() => { audio.apply(settings); }, [settings]);
  useEffect(() => {
    const id = setInterval(() => {
      const st = store.get();
      if (st.screen !== 'game') return;
      if (!st.ui.panel && !st.ui.dialogue) store.game({ minutes: st.game.minutes + 0.5 });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') saveProgress();
    };
    const id = setInterval(saveProgress, 5000);
    window.addEventListener('pagehide', saveProgress);
    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', saveProgress);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, []);

  if (!configReady) return (
    <div className="fixed inset-0 bg-[#07090b] text-cream flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-pixel text-2xl">NASA: Beyond Earth</h1>
      <p role={configError ? 'alert' : 'status'}>{configError ?? 'Loading your field notebook…'}</p>
      {configError && <button className="keycap" onClick={() => window.location.reload()}>Retry</button>}
    </div>
  );
  return (
    <div className="fixed inset-0 bg-[#07090b] flex items-center justify-center grain">
      <div className="relative overflow-hidden rounded-[6px] shadow-[0_0_0_1px_hsl(32_40%_70%/0.08),0_30px_90px_-30px_#000]" style={{ width: 'min(100vw, calc(100dvh * 16 / 9))', aspectRatio: '16 / 9' }}>
        {screen === 'title' ? <Title /> : (
          <>
            <GameCanvas />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(220_40%_4%/0.55)_100%)]" />
            <Hud />
            <Dialogue />
            {panel === 'pause' && <Pause />}
            {panel === 'settings' && <Settings onClose={closePanel} onData={() => { store.ui({ panelReturn: 'settings' }); openPanel('data'); }} />}
            {panel === 'data' && <DataManager onClose={closePanel} />}
            {panel === 'computer' && <Computer />}
            {panel === 'inventory' && <Inventory />}
            {panel === 'journal' && <Journal />}
            {panel === 'map' && <MapPanel />}
            {panel === 'booking' && <Booking />}
            {panel === 'flight' && <Flight />}
            {panel === 'research' && <ResearchKit />}
            {panel === 'drill' && <DrillTrialPanel />}
            {panel === 'mars-atlas' && <MarsAtlasPanel />}
            {panel === 'field-trial' && <FieldTrialPanel />}
            {panel === 'site-comparison' && <SiteComparison />}
            {panel === 'analysis' && <Analysis />}
          </>
        )}
      </div>
    </div>
  );
}
