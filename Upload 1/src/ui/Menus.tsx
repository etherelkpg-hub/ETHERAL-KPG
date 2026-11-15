import { useEffect, useState } from 'react';
import { Award, BookOpen, Check, Circle, Database, Home, LogOut, Play, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { rankFor } from '@/game/research';
import { destinations, formatSiteCoordinates } from '@/game/config';
import { FIELD_MAPS, live, STAGES, store, useStore, type Stage } from '@/game/store';
import { closePanel, MISSIONS, openPanel, quitToTitle, stageIdx } from '@/game/story';
import { outlines } from '@/game/scenes/WorldScene';
import { MapTerrain } from './ExplorationMap';
import { FIELD_EQUIPMENT, INVENTORY_TOOLS } from '@/game/inventory';
import { MARS_ANALOGS } from '@/game/marsAtlas';
import { EquipmentImage } from './EquipmentImage';
import { GameButton, Panel, Tabs } from './Panel';
import { DrillTrialReport } from './DrillTrials';
import { FieldTrialJournal } from './MarsAtlas';

export function Inventory() {
  const map = useStore((state) => state.game.map);
  const fieldMap = FIELD_MAPS.find((region) => region === map);
  const [flipped, setFlipped] = useState<(typeof INVENTORY_TOOLS)[number]['id'] | null>(null);
  const fieldTools = fieldMap && FIELD_EQUIPMENT[fieldMap];
  const groups = fieldTools ? [
    { active: true, tools: INVENTORY_TOOLS.filter(({ id }) => fieldTools.includes(id)) },
    { active: false, tools: INVENTORY_TOOLS.filter(({ id }) => !fieldTools.includes(id)) },
  ] : [{ active: true, tools: INVENTORY_TOOLS }];

  return (
    <Panel title="Equipment Inventory" kicker={fieldMap ? MARS_ANALOGS[fieldMap].name : 'All field equipment'}
      onClose={closePanel} testId="panel-inventory" width="max-w-3xl">
      <div className="equipment-deck">
        {groups.filter(({ tools }) => tools.length).map(({ active, tools }) => (
          <section key={active ? 'active' : 'inactive'} className="equipment-grid"
            aria-label={active ? (fieldMap ? 'Equipment for this site' : 'All field equipment') : 'Equipment for other sites'}>
            {tools.map(({ id, name, summary, detail }) => {
              const showDetails = flipped === id;
              const detailId = 'equipment-details-' + id;
              const locations = FIELD_MAPS.filter((region) => FIELD_EQUIPMENT[region].includes(id))
                .map((region) => MARS_ANALOGS[region].name);

              return (
                <article key={id} className="equipment-card" data-testid={'item-' + id}
                  data-equipment-status={active ? 'active' : 'inactive'} data-flipped={showDetails}>
                  <div className="equipment-card-face equipment-card-front" aria-hidden={showDetails}>
                    <div className="equipment-card-image"><EquipmentImage equipment={id} size={154} /></div>
                    <h3 className="equipment-card-name font-pixel">{name}</h3>
                    <p className="equipment-card-copy">{summary}</p>
                    <div className="equipment-card-locations">
                      <span>Used at</span>
                      <p>{locations.join(' · ')}</p>
                    </div>
                  </div>
                  <div id={detailId} className="equipment-card-face equipment-card-back" aria-hidden={!showDetails}>
                    <h3 className="equipment-card-name font-pixel">{name}</h3>
                    <p className="equipment-card-copy">{detail}</p>
                  </div>
                  <button type="button" className="equipment-card-flip" aria-expanded={showDetails} aria-controls={detailId}
                    aria-label={(showDetails ? 'Show summary for ' : 'Show details for ') + name}
                    onClick={() => setFlipped(showDetails ? null : id)} data-testid={'details-' + id}>
                    {showDetails ? '↶' : '!'}
                  </button>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </Panel>
  );
}

export function Journal() {
  const STORY: { stage: Stage; label: string }[] = STAGES.map((s) => ({ stage: s, label: MISSIONS[s].title }));
  const [tab, setTab] = useState<'missions' | 'log' | 'rewards' | 'drill' | 'trials'>('missions');
  const game = useStore((s) => s.game);
  const cur = stageIdx(game.stage);
  const rewarded = game.submissions.filter((s) => s.reward > 0).length;
  return (
    <Panel title="Research Journal" kicker="Mateo Reyes · Beyond Earth Challenge" onClose={closePanel} testId="panel-journal" width="max-w-4xl"
      footer={<div className="flex justify-between items-center text-xs text-muted-foreground"><span>Rank: <span className="text-cream font-pixel">{rankFor(rewarded)}</span></span>
        <GameButton variant="ghost" onClick={() => { store.ui({ panelReturn: 'journal' }); openPanel('analysis'); }} disabled={!Object.keys(game.samples).length} testId="button-open-analysis">Open analysis</GameButton></div>}>
      <Tabs value={tab} onChange={(t) => setTab(t as typeof tab)} tabs={[{ id: 'missions', label: 'Missions' }, { id: 'log', label: 'Discoveries' }, { id: 'rewards', label: 'Submissions' }, { id: 'drill', label: 'Drill trials' }, { id: 'trials', label: 'Field trials' }]} />
      {tab === 'drill' && <DrillTrialReport runs={game.drillRuns ?? []} />}
      {tab === 'trials' && <FieldTrialJournal runs={game.fieldRuns ?? []} />}
      {tab === 'missions' && (
        <ol className="space-y-1.5">
          {STORY.map((s, i) => (
            <li key={s.stage} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === cur ? 'bg-primary/10 border border-primary/30' : ''}`}>
              {i < cur ? <Check className="w-4 h-4 text-accent" /> : i === cur ? <Play className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground/40" />}
              <span className={`font-pixel ${i < cur ? 'text-muted-foreground line-through decoration-1' : i === cur ? 'text-cream' : 'text-muted-foreground/60'}`}>{s.label}</span>
              {i === cur && <span className="text-xs text-muted-foreground ml-auto max-w-[50%] text-right">{MISSIONS[s.stage].text}</span>}
            </li>
          ))}
        </ol>
      )}
      {tab === 'log' && (game.journal.length ? (
        <ul className="space-y-1.5">{game.journal.map((j, i) => <li key={i} className="text-sm flex gap-3"><span className="font-mono text-xs text-primary w-12 shrink-0 pt-0.5">{j.time}</span><span className="text-cream">{j.text}</span></li>)}</ul>
      ) : <Empty title="Fresh notebook" text="Observations and story events will appear here." />)}
      {tab === 'rewards' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Wallet" value="Unlimited USD" /><Stat label="Discoveries rewarded" value={String(rewarded)} /><Stat label="Rank" value={rankFor(rewarded)} />
          </div>
          {game.submissions.length ? game.submissions.map((s) => (
            <div key={s.id} className="rounded-xl p-3 border border-[hsl(32_40%_70%/0.12)] mb-2">
              <div className="flex items-center gap-2"><Award className={`w-4 h-4 ${s.reward ? 'text-primary' : 'text-muted-foreground'}`} /><span className="font-pixel text-cream">{s.refName}</span>
                <span className="ml-auto font-mono text-sm">{s.score === null ? '—' : `${(s.score * 100).toFixed(1)}%`} · {s.reward ? `+${s.reward} USD` : '0 USD'}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
            </div>
          )) : <Empty title="No submissions" text="Compare your field samples against a reference and submit." />}
          <p className="text-[10px] text-muted-foreground mt-3">Rewards are fictional USD amounts used only in the game.</p>
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl p-3 bg-[hsl(196_30%_7%/0.6)] border border-[hsl(32_40%_70%/0.1)]"><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</div><div className="font-pixel text-cream text-lg mt-0.5">{value}</div></div>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-[hsl(32_40%_70%/0.2)] p-8 text-center"><div className="font-pixel text-cream text-lg">{title}</div><p className="text-sm text-muted-foreground mt-1">{text}</p></div>;
}

export function MapPanel() {
  const area = useStore((s) => s.ui.area);
  const map = live.map;
  const rows = useStore((s) => s.game.explored?.[map]);
  const o = outlines[map];
  const destination = destinations.find((site) => site.id === map);
  const geography = destination?.geography;
  return (
    <Panel title={o?.name ?? 'Map'} kicker="Exploration Map" onClose={closePanel} testId="panel-map" width="max-w-4xl">
      {o ? (
        <div className="rounded-xl overflow-hidden border border-[hsl(32_40%_70%/0.15)] bg-[#211f2b]">
          <svg viewBox={`0 0 ${o.w} ${o.h}`} className="w-full h-auto max-h-[60vh]" aria-label={`${o.name} exploration map`}>
            <MapTerrain map={map} area={o} rows={rows} labels />
            <circle cx={live.x} cy={live.y} r={o.w / 108} fill="#ffb663" stroke="#fff0ce" strokeWidth={o.w / 400} />
            <circle cx={live.x} cy={live.y} r={o.w / 300} fill="#39303a" />
          </svg>
        </div>
      ) : <Empty title="No map" text="Map data loads with the area." />}
      <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2"><Home className="w-4 h-4" />You are in <span className="text-cream">{area}</span></div>
      {destination && geography && (
        <div className="mt-2 text-xs text-muted-foreground" data-testid="map-field-location">
          <div>{geography.region} · {destination.country} · {geography.continent}</div>
          <div className="mt-1 font-mono text-cream">{formatSiteCoordinates(geography)}</div>
        </div>
      )}
    </Panel>
  );
}

export function Pause() {
  const items: [string, typeof Play, () => void][] = [
    ['Resume', Play, closePanel],
    ['Journal', BookOpen, () => openPanel('journal')],
    ['Settings', SettingsIcon, () => { store.ui({ panelReturn: 'pause' }); openPanel('settings'); }],
    ['Hackathon Data', Database, () => { store.ui({ panelReturn: 'pause' }); openPanel('data'); }],
    ['Quit to Title', LogOut, quitToTitle],
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[hsl(200_50%_4%/0.6)] anim-fade" data-testid="panel-pause">
      <div className="panel anim-pop w-80 p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-mono">Paused</div>
        <div className="font-pixel text-2xl text-cream mb-4">Field notes on hold</div>
        <div className="space-y-1.5">
          {items.map(([label, Icon, fn]) => (
            <button key={label} onClick={fn} className="btn-game w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream hover:bg-primary/15 text-left" data-testid={`button-pause-${label.toLowerCase().replace(/\s/g, '-')}`}>
              <Icon className="w-4 h-4 text-primary" />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Settings({ onClose, onData }: { onClose: () => void; onData: () => void }) {
  const st = useStore((s) => s.settings);
  const inGame = useStore((s) => s.screen === 'game');
  const slider = (k: 'master' | 'music' | 'ambient' | 'sfx', label: string) => (
    <label className="block" key={k}>
      <div className="flex justify-between text-sm mb-1"><span className="text-cream">{label}</span><span className="font-mono text-muted-foreground">{Math.round(st[k] * 100)}</span></div>
      <input type="range" min={0} max={1} step={0.01} value={st[k]} onChange={(e) => store.settings({ [k]: Number(e.target.value) })} className="w-full accent-[hsl(22_78%_62%)]" data-testid={`slider-${k}`} />
    </label>
  );
  return (
    <Panel title="Settings" kicker="Options" onClose={onClose} testId="panel-settings" width="max-w-3xl">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-primary font-mono"><Volume2 className="w-3.5 h-3.5" />Audio</div>
          {slider('master', 'Master volume')}{slider('music', 'Music')}{slider('ambient', 'Ambience')}{slider('sfx', 'Sound effects')}
          <label className="flex items-center gap-2 text-sm text-cream pt-2">
            <input type="checkbox" checked={st.showTutorial} onChange={(e) => store.settings({ showTutorial: e.target.checked })} className="accent-[hsl(22_78%_62%)]" data-testid="checkbox-tutorial" />
            Show controls tip when a session starts
          </label>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-primary font-mono mb-2">Controls</div>
          {[['W A S D / Arrows', 'Move'], ['Shift', 'Hold to run'], ['E', 'Interact / advance dialogue'], ['I', 'Field kit'], ['J', 'Journal'], ['M', 'Map'], ['Esc', 'Pause / close']].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-white/5 text-sm"><span className="flex gap-1 flex-wrap">{k.split(' ').filter((x) => x !== '/').map((x) => <span key={x} className="keycap">{x}</span>)}</span><span className="text-muted-foreground">{v}</span></div>
          ))}
          <div className="flex flex-wrap gap-2 mt-4">
            {inGame && <GameButton variant="ghost" onClick={() => { store.ui({ tutorialAt: Date.now(), panel: null, panelReturn: null }); }} testId="button-show-controls">Show controls overlay</GameButton>}
            <GameButton variant="ghost" onClick={onData} testId="button-open-data"><Database className="w-4 h-4" />Data management</GameButton>
          </div>
        </div>
      </div>
    </Panel>
  );
}

