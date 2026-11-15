import { useState } from 'react';
import {
  DRILL_BUDGET_WH, DRILL_MODES, DRILL_PADS, DRILL_REGIONS, DRILL_TARGET_CM,
  drillRecommendation, simulateDrill, type DrillMaterial, type DrillMode, type DrillPad, type DrillResult,
} from '@/game/drill';
import { store, useStore } from '@/game/store';
import { closePanel, journal, saveProgress } from '@/game/story';
import { GameButton, Panel } from './Panel';
import { EquipmentImage } from './EquipmentImage';

const outcomeLabels = { collected: 'Core collected', load: 'Stopped at load limit', battery: 'Battery depleted' };
const materialLabels = { dry: 'Dry sediment', frozen: 'Frozen sediment' };
const modeList = Object.keys(DRILL_MODES) as DrillMode[];
const layerColors = { dry: ['#a67745', '#674232'], frozen: ['#497e8d', '#355369'] };

function SoilProfile({ pad, run }: { pad: DrillPad; run?: DrillResult }) {
  const progress = (run?.depthCm ?? 0) / DRILL_TARGET_CM;
  return (
    <svg viewBox="0 0 260 110" width="100%" height="110" role="img" aria-label={`Soil cross section, drill depth ${(run?.depthCm ?? 0).toFixed(1)} centimeters`}>
      {pad.layers.map((layer, i) => {
        const start = pad.layers[i - 1]?.toCm ?? 0;
        return <rect key={layer.toCm} x="6" y={10 + start * 3} width="200" height={(layer.toCm - start) * 3} fill={layerColors[layer.material][i % 2]} />;
      })}
      {[0, 10, 20, 30].map((cm) => <g key={cm}>
        <path d={`M206 ${10 + cm * 3}h8`} stroke="#c7cfcd" />
        <text x="219" y={13 + cm * 3} fill="#f2eadc" fontSize="10">{cm} cm</text>
      </g>)}
      <path d={`M106 5v${5 + progress * 90}`} stroke="#f7d375" strokeWidth="4" />
      <circle cx="106" cy={10 + progress * 90} r="4" fill="#f7d375" />
    </svg>
  );
}

function TrialMetrics({ run }: { run: DrillResult }) {
  return (
    <div className="mt-2">
      <p className="text-sm text-cream">{outcomeLabels[run.outcome]}</p>
      <dl className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-muted-foreground">
        <div><dt>Depth</dt><dd className="font-mono text-cream">{run.depthCm.toFixed(1)} cm</dd></div>
        <div><dt>Energy</dt><dd className="font-mono text-cream">{run.energyWh.toFixed(2)} Wh</dd></div>
        <div><dt>Elapsed</dt><dd className="font-mono text-cream">{Math.round(run.seconds)} s</dd></div>
      </dl>
      {run.outcome === 'collected' && run.sample && <p className="mt-2 text-xs text-accent">Core sample · {run.sample.name}</p>}
    </div>
  );
}

function ModeSelect({ mode, onChange }: { mode: DrillMode; onChange: (mode: DrillMode) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Drill power mode">
      {modeList.map((key) => (
        <button key={key} type="button" aria-pressed={key === mode} onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-pixel ${key === mode ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-cream'}`}>
          {DRILL_MODES[key].label}
        </button>
      ))}
    </div>
  );
}

export function DrillTrialPanel() {
  const site = useStore((s) => s.ui.researchSite);
  const region = useStore((s) => s.game.map);
  const pad = DRILL_PADS.find((item) => item.id === site && item.region === region && !item.archived);
  if (!pad) return null;
  return <DrillStation key={pad.id} pad={pad} />;
}

function DrillStation({ pad }: { pad: DrillPad }) {
  const runs = useStore((s) => s.game.drillRuns);
  const [mode, setMode] = useState<DrillMode>('steady');
  const [inspected, setInspected] = useState(false);
  const run = runs?.find((item) => item.padId === pad.id && item.mode === mode);
  const operate = () => {
    const { game, ui } = store.get();
    if (!inspected || game.map !== pad.region || ui.panel !== 'drill' || ui.researchSite !== pad.id) return;
    const previous = game.drillRuns ?? [];
    const result = simulateDrill(pad, mode);
    store.game({ drillRuns: [...previous.filter((item) => item.padId !== pad.id || item.mode !== mode), result] });
    if (!previous.some((item) => item.padId === pad.id && item.mode === mode)) {
      journal(`Drill trial · ${pad.name}, ${DRILL_MODES[mode].label} mode · ${outcomeLabels[result.outcome]} at ${result.depthCm.toFixed(1)} cm.`);
    }
    saveProgress();
  };
  return (
    <Panel title={pad.name} kicker={`${DRILL_REGIONS[pad.region]} · Drilling and sampling`} onClose={closePanel} testId="panel-drill-trial">
      <div className="rounded-xl bg-white/5 p-3 flex items-center gap-4">
        <EquipmentImage equipment="drill" size={120} className="shrink-0" />
        <div>
          <h3 className="font-pixel text-cream">Core drill</h3>
          <p className="text-sm text-cream">Retrieve a core at {DRILL_TARGET_CM} cm with a {DRILL_BUDGET_WH} Wh battery budget.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Simulated soil profiles and equipment parameters.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <section className="rounded-xl bg-white/5 p-3">
          <h3 className="mb-2 font-pixel text-cream">Ground survey</h3>
          {inspected ? (
            <>
              <p className="text-xs text-cream">Ground temperature · {pad.temperature} °C</p>
              <SoilProfile pad={pad} run={run} />
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                {pad.layers.map((layer, i) => <li key={layer.toCm}>{pad.layers[i - 1]?.toCm ?? 0}–{layer.toCm} cm · {layer.name}</li>)}
              </ol>
            </>
          ) : <GameButton onClick={() => setInspected(true)} testId="button-survey-drill-pad">Survey ground</GameButton>}
        </section>
        <section className="rounded-xl bg-white/5 p-3">
          <h3 className="mb-2 font-pixel text-cream">Drill settings</h3>
          <ModeSelect mode={mode} onChange={setMode} />
          <p className="mt-2 text-xs text-muted-foreground">{mode === 'steady' ? 'Lower power draw with a lower load limit.' : 'Higher load limit and higher power draw.'}</p>
          <GameButton className="mt-3" disabled={!inspected} onClick={operate} testId="button-run-drill">{run ? 'Repeat trial' : 'Run drill'}</GameButton>
        </section>
      </div>
      {run && <section className="rounded-xl bg-white/5 p-3 mt-4" aria-live="polite" data-testid="drill-result">
        <progress value={run.depthCm} max={DRILL_TARGET_CM} aria-label="Depth reached" className="w-full" style={{ accentColor: '#e9b957' }} />
        <TrialMetrics run={run} />
        <p className="mt-3 text-xs text-muted-foreground">Saved in J → Drill trials.</p>
      </section>}
    </Panel>
  );
}

export function DrillTrialReport({ runs }: { runs: readonly DrillResult[] }) {
  const [mode, setMode] = useState<DrillMode>('steady');
  const [material, setMaterial] = useState<DrillMaterial>('dry');
  const recommendation = drillRecommendation(runs, mode, material);
  const bestPad = recommendation.status === 'ready' && DRILL_PADS.find((pad) => pad.id === recommendation.best.padId);
  return (
    <div data-testid="drill-trial-report">
      <div className="flex items-center gap-3 flex-wrap">
        <ModeSelect mode={mode} onChange={setMode} />
        <label className="text-sm text-cream">Target material <select value={material} onChange={(e) => setMaterial(e.target.value as DrillMaterial)} className="ml-1 p-1.5 rounded bg-[#203039] text-cream">
          <option value="dry">Dry sediment</option><option value="frozen">Frozen sediment</option>
        </select></label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        {DRILL_PADS.filter((pad) => !pad.archived || runs.some((run) => run.padId === pad.id && run.mode === mode)).map((pad) => {
          const run = runs.find((item) => item.padId === pad.id && item.mode === mode);
          return <section key={pad.id} className="rounded-xl bg-white/5 p-3">
            <h3 className="font-pixel text-cream">{pad.name}</h3>
            <p className="text-xs text-muted-foreground">{DRILL_REGIONS[pad.region]} · {pad.temperature} °C{pad.archived ? ' · Earlier trial' : ''}</p>
            {run ? <TrialMetrics run={run} /> : <p className="mt-2 text-xs text-muted-foreground">No trial in this mode yet.</p>}
          </section>;
        })}
      </div>
      <div className="rounded-xl bg-white/5 mt-3 p-3 text-sm text-cream" aria-live="polite">
        {recommendation.status === 'ready' && bestPad && <p>Recommended field test · {bestPad.name}, {DRILL_REGIONS[bestPad.region]}. It recovered a {materialLabels[material].toLowerCase()} core at {DRILL_TARGET_CM} cm with the lowest energy use among your matching trials ({recommendation.best.energyWh.toFixed(2)} Wh).</p>}
        {recommendation.status === 'pending' && <p>Run a trial in at least two regions in this mode to compare the sites.</p>}
        {recommendation.status === 'no-match' && <p>No tested pad recovered this material at {DRILL_TARGET_CM} cm in this mode. Try another pad or compare both regions in the other mode.</p>}
        <p className="mt-2 text-[11px] text-muted-foreground">Before a real field test, measure the local soil strength and temperature and validate the drill against known samples. These results use an educational simulation.</p>
      </div>
    </div>
  );
}
