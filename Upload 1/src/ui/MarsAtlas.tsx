import { useState } from 'react';
import { FIELD_MAPS, store, useStore, type FieldMap } from '@/game/store';
import { MARS_ANALOGS, MARS_REFERENCES, type AnalogSite } from '@/game/marsAtlas';
import { FIELD_CRITERIA, FIELD_TOOLS, FIELD_TRIAL_SITES, runFieldTrial, type FieldRun, type FieldResult, type FieldTrialSite, type TrialSetting, type TrialTool } from '@/game/fieldTrials';
import { clock, closePanel, journal, openPanel, saveProgress } from '@/game/story';
import { audio } from '@/game/audio';
import { FIELD_SITES } from '@/game/research';
import { GameButton, Panel, Tabs } from './Panel';
import { RecordTable } from './RecordTable';
import { EquipmentImage } from './EquipmentImage';

export function MarsReferenceContent() {
  return <div className="space-y-3">
    {MARS_REFERENCES.map(({ name, finding, use, source }) => <article key={name} className="rounded-xl bg-white/5 p-3">
      <h3 className="font-pixel text-cream">{name}</h3>
      <p className="mt-1 text-sm text-cream">{finding}</p>
      <p className="mt-1 text-xs text-muted-foreground">{use}</p>
      <a href={source} target="_blank" rel="noreferrer" className="text-xs underline text-primary">Source</a>
    </article>)}
  </div>;
}

function AnalogBrief({ site }: { site: AnalogSite }) {
  return <>
    <h3 className="text-lg font-pixel text-cream">{site.name}</h3>
    <p className="text-xs text-muted-foreground">{site.location}</p>
    <p className="my-2 text-sm text-cream">{site.overview}</p>
    <div className="flex gap-3 flex-wrap text-xs text-primary">
      {site.notes && <a className="underline" href={site.notes} target="_blank" rel="noreferrer">Site management plan</a>}
      <a className="underline" href={site.reference} target="_blank" rel="noreferrer">Published reference</a>
    </div>
  </>;
}

export function MarsAtlasPanel() {
  const [tab, setTab] = useState<string>('mars');
  const dataset = useStore((s) => s.dataset);
  const records = dataset?.records.filter((r) => r.body === 'mars') ?? [];
  const site = tab === 'mars' ? undefined : MARS_ANALOGS[tab as FieldMap];
  return <Panel title="Mars Research" kicker="Mateo-PC · Earth–Mars atlas" onClose={closePanel} width="max-w-6xl" testId="panel-mars-atlas">
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'mars', label: 'Mars data' }, ...FIELD_MAPS.map((id) => ({ id, label: MARS_ANALOGS[id].name }))]} />
    {site ? <>
      <AnalogBrief site={site} />
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        {site.properties.map((property) => <article key={property.title} className="rounded-xl bg-white/5 p-3">
          <h4 className="font-pixel text-cream">{property.title}</h4>
          <p className="mt-1 text-xs text-cream">Earth · {property.earth}</p>
          <p className="mt-1 text-xs text-cream">Mars comparison · {property.mars}</p>
          <p className="mt-1 text-xs text-muted-foreground">{property.study ? 'Needs study' : 'Limit'} · {property.limit}</p>
          <p className="mt-2 text-xs text-accent">{property.tool === 'drill' ? 'Drilling & sample collection' : FIELD_TOOLS[property.tool].name}{property.tool === 'systems' ? ' · Coming soon' : ''}</p>
        </article>)}
      </div>
    </> : <>
      <MarsReferenceContent />
      <h3 className="mt-4 mb-2 font-pixel text-cream">Active comparison dataset</h3>
      <p className="mb-2 text-xs text-muted-foreground">Import documented measurements through Data Management to populate the numerical comparison.</p>
      {records.length ? <div className="space-y-3">{records.map((r) => <RecordTable key={r.id} record={r} />)}</div>
        : <p className="text-sm text-muted-foreground">No Mars measurements loaded.</p>}
    </>}
  </Panel>;
}

function FieldResultCard({ result }: { result: FieldResult }) {
  return <div className="mt-2" aria-live="polite">
    <p className="text-cream text-sm">{result.outcome}</p>
    <dl className="grid grid-cols-2 gap-2 mt-2">
      {result.metrics.map(([label, value]) => <div key={label}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="font-mono text-sm text-cream">{value}</dd></div>)}
    </dl>
    <p className="mt-2 text-xs text-accent">{result.next}</p>
  </div>;
}

export function FieldTrialPanel() {
  const map = useStore((s) => s.game.map);
  const id = useStore((s) => s.ui.researchSite);
  const spot = FIELD_TRIAL_SITES.find((site) => site.id === id && site.map === map);
  if (!spot) return null;
  return <FieldTrialStation key={spot.id} spot={spot} />;
}

function FieldTrialStation({ spot }: { spot: FieldTrialSite }) {
  const { map, tool, id, label } = spot;
  const [setting, setSetting] = useState<TrialSetting>(0);
  const game = useStore((s) => s.game);
  const site = MARS_ANALOGS[map];
  const run = game.fieldRuns?.find((item) => item.map === map && item.tool === tool && item.setting === setting);
  const record = () => {
    const { game: current, ui } = store.get();
    if (current.map !== map || ui.panel !== 'field-trial' || ui.researchSite !== id) return;
    const runs = current.fieldRuns ?? [];
    const result = runFieldTrial({ map, tool, setting });
    const currentRun = { map, tool, setting, minute: current.minutes, result };
    store.game({ fieldRuns: [...runs.filter((item) => item.map !== map || item.tool !== tool || item.setting !== setting), currentRun] });
    if (!runs.some((item) => item.map === map && item.tool === tool && item.setting === setting)) {
      journal(site.name + ' · ' + FIELD_TOOLS[tool].name + ' · ' + result.outcome);
    }
    audio.play('confirm');
    saveProgress();
  };
  const selected = FIELD_TOOLS[tool];
  return <Panel title={label} kicker={`${site.name} · Earth–Mars Field Trials`} onClose={closePanel} testId="panel-field-trial" width="max-w-5xl">
    <div className="rounded-xl bg-white/5 p-3 flex items-center gap-4">
      <EquipmentImage equipment={selected.art} size={120} className="shrink-0" />
      <div>
        <h3 className="font-pixel text-cream">{selected.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{site.overview}</p>
      </div>
    </div>
    <div className="mt-3 rounded-xl p-3 bg-white/5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Trial setup">
        {selected.settings.map((description, index) => <button key={description} type="button" aria-pressed={index === setting}
          onClick={() => setSetting(index === 0 ? 0 : 1)}
          className={`px-3 py-2 rounded-lg text-sm ${index === setting ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-cream'}`}>{description}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <GameButton onClick={record} testId="button-run-field-trial">{selected.action}</GameButton>
        {tool === 'sampling' && (
          <GameButton variant="ghost" testId="button-open-field-records" onClick={() => openPanel('research', { researchSite: FIELD_SITES[map].id })}>
            Open Field Records
          </GameButton>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Educational simulation · Results are saved in J → Field trials.</p>
      {run && <FieldResultCard result={run.result} />}
    </div>
    <div className="mt-3 space-y-1">
      {site.properties.filter((property) => property.tool === tool).map((property) => <p key={property.title} className="text-xs text-muted-foreground">{property.title} · {property.mars} · {property.limit}</p>)}
    </div>
  </Panel>;
}

export function FieldTrialJournal({ runs }: { runs: readonly FieldRun[] }) {
  const [tool, setTool] = useState<TrialTool>('rover');
  const [setting, setSetting] = useState<TrialSetting>(0);
  const comparable = runs.filter((run) => run.tool === tool && run.setting === setting);
  const tools = (Object.keys(FIELD_TOOLS) as TrialTool[]).filter((id) => id !== 'systems' || runs.some((run) => run.tool === id));
  const canRecommend = (tool === 'rover' || tool === 'systems') && comparable.length > 1;
  const candidate = comparable.filter((run) => run.result.rankCost !== undefined)
    .sort((a, b) => a.result.rankCost! - b.result.rankCost!)[0];
  return <div data-testid="field-trial-journal">
    <div className="flex gap-3 flex-wrap">
      <GameButton variant="ghost" onClick={() => { store.ui({ panelReturn: 'journal' }); openPanel('mars-atlas'); }}>Open Mars Research</GameButton>
      <p className="text-xs text-muted-foreground">Trials are simulated. Compare the same test and setup across sites.</p>
    </div>
    <dl className="my-3 grid sm:grid-cols-2 gap-2">
      {FIELD_CRITERIA.map(([name, question]) => <div key={name} className="rounded-xl bg-white/5 p-2"><dt className="text-xs text-accent">{name}</dt><dd className="text-xs text-cream">{question}</dd></div>)}
    </dl>
    <div className="flex flex-wrap gap-3 items-center mb-3">
      <label className="text-xs text-muted-foreground">Equipment <select value={tool} onChange={(event) => setTool(event.target.value as TrialTool)} className="bg-[#26323b] text-cream rounded px-3 py-2">
        {tools.map((id) => <option key={id} value={id}>{FIELD_TOOLS[id].name}{id === 'systems' ? ' · Earlier trials' : ''}</option>)}
      </select></label>
      <label className="text-xs text-muted-foreground">Setup <select value={setting} onChange={(event) => setSetting(event.target.value === '1' ? 1 : 0)} className="bg-[#26323b] text-cream rounded px-3 py-2">
        {FIELD_TOOLS[tool].settings.map((name, index) => <option key={name} value={index}>{name}</option>)}
      </select></label>
    </div>
    {!comparable.length && <p className="text-sm text-cream">No saved trials for this setup yet.</p>}
    {canRecommend && <p className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-cream" data-testid="field-test-recommendation">
      {candidate ? `Recommended next field test · ${MARS_ANALOGS[candidate.map].name}. It met the scenario targets and had the best ${tool === 'rover' ? 'energy use' : 'signal coverage'} among the successful scenarios you tested.`
        : 'No tested site met the scenario targets with this setup.'}
    </p>}
    <div className="grid sm:grid-cols-2 gap-3">
      {[...comparable].reverse().map((run) => <article key={run.map} className="rounded-xl p-3 bg-white/5">
        <h3 className="font-pixel text-cream">{MARS_ANALOGS[run.map].name}</h3>
        <p className="text-xs text-muted-foreground">Logged at {clock(run.minute)}</p>
        <FieldResultCard result={run.result} />
      </article>)}
    </div>
  </div>;
}
