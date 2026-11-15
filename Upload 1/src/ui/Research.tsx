import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, NotebookPen } from 'lucide-react';
import type { ResearchRecord } from '@/science/model';
import { compareRecords, evaluateSubmission } from '@/science/compare';
import { audio } from '@/game/audio';
import { earthRecordFor, fieldReadingCount, fieldSiteFor, fieldSurveyFlag, FIELD_READINGS, FIELD_SITES, FIELD_SURVEY_GRANT, FIELD_SURVEY_READINGS, formatValue, samplesForSite } from '@/game/research';
import { store, useStore, type FieldMap } from '@/game/store';
import { awardFieldSurveyGrants, clock, closePanel, journal, openPanel, saveProgress, setStage, toast } from '@/game/story';
import { EvidenceBadge, GameButton, Panel } from './Panel';

export function ResearchKit() {
  const siteId = useStore((s) => s.ui.researchSite);
  const dataset = useStore((s) => s.dataset);
  const allSamples = useStore((s) => s.game.samples);
  const grantPaid = useStore((s) => !!(siteId && s.game.flags[fieldSurveyFlag(siteId)]));
  const site = Object.values(FIELD_SITES).find((item) => item.id === siteId);
  const samples = site ? samplesForSite(allSamples, site) : {};
  const [inst, setInst] = useState<(typeof FIELD_READINGS)[number] | null>(null);
  const earth = site ? earthRecordFor(dataset, site.place) : null;

  const measurement = inst && earth ? earth.measurements.find((m) => m.attribute.toLowerCase() === inst.attribute) ?? null : null;
  const recorded = inst ? Object.values(samples).find((sample) => sample.attribute === inst.attribute) : undefined;

  const record = () => {
    if (!inst || !site || !earth || !measurement || measurement.value === null) return;
    const g = store.get().game;
    const existing = Object.entries(samplesForSite(g.samples, site)).find(([, sample]) => sample.attribute === inst.attribute);
    if (existing?.[1].site === site.id) return;
    const key = existing?.[0] ?? `${site.id}:${inst.attribute}`;
    const next = { ...g.samples, [key]: { attribute: inst.attribute, instrument: inst.name, site: site.id, recordId: earth.id, location: earth.location, measurement, time: clock(g.minutes) } };
    store.game({ samples: next });
    journal(`${site.name}: ${inst.name} recorded ${inst.attribute} = ${formatValue(measurement.value, measurement.unit)} (${measurement.evidence}).`);
    if (!awardFieldSurveyGrants()) {
      audio.play('confirm');
      toast(`Recorded ${inst.attribute} in journal`);
    }
    if (fieldReadingCount(next, site) >= FIELD_SURVEY_READINGS) setStage('compare');
    saveProgress();
  };

  if (!site) return null;
  return (
    <Panel title={site.name} kicker="Field Records · Imported measurements" onClose={closePanel} testId="panel-research" width="max-w-5xl">
      <p className="text-sm text-muted-foreground mb-4">{site.note}</p>
      <GameButton className="mb-3" variant="ghost" onClick={() => { store.ui({ panelReturn: 'research' }); openPanel('map'); }} testId="button-research-field-trials">Find equipment on the map</GameButton>
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-5">
        <div className="grid grid-cols-3 gap-2">
          {FIELD_READINGS.map((i) => {
            const have = Object.values(samples).some((sample) => sample.attribute === i.attribute);
            return (
              <button key={i.id} onClick={() => setInst(i)} data-testid={`instrument-${i.id}`}
                className={`p-3 rounded-xl border text-left transition group ${inst?.id === i.id ? 'border-primary bg-primary/10' : 'border-[hsl(32_40%_70%/0.12)] hover:border-[hsl(32_40%_70%/0.35)] hover:-translate-y-0.5'}`}>
                {have && <CheckCircle2 className="w-4 h-4 text-accent" />}
                <div className="font-pixel text-cream text-sm mt-2 leading-tight">{i.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{i.attribute}</div>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-[hsl(32_40%_70%/0.15)] bg-[hsl(196_30%_6%/0.7)] p-4 min-h-[260px] flex flex-col">
          {!inst && <div className="m-auto text-center text-muted-foreground text-sm">Select a field reading to review its source.</div>}
          {inst && (
            <>
              <div className="font-pixel text-cream text-lg">{inst.name}</div>
              <div className="flex-1 flex flex-col justify-center mt-3">
                {measurement && measurement.value !== null ? (
                    <div className="anim-pop">
                      <div className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-mono">{inst.attribute}</div>
                      <div className="font-pixel text-4xl text-cream mt-1" data-testid="text-reading">{formatValue(measurement.value, measurement.unit)}</div>
                      <div className="mt-2 flex items-center gap-2"><EvidenceBadge evidence={measurement.evidence} /><span className="text-[11px] text-muted-foreground">{measurement.source}</span></div>
                      {measurement.evidence === 'demo' && <p className="text-[11px] text-primary/90 mt-2">Demo value from the active dataset, not a real field measurement.</p>}
                      <GameButton className="mt-4 w-full" onClick={record} disabled={recorded?.site === site.id} testId="button-record-sample">
                        <NotebookPen className="w-4 h-4" />{recorded?.site === site.id ? 'Already recorded' : recorded ? 'Replace earlier reading' : 'Record in journal'}
                      </GameButton>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground anim-fade">
                      <div className="font-pixel text-xl text-cream mb-1">Unavailable</div>
                      The active dataset has no {inst.attribute} value for {earth?.location ?? 'this location'}. Nothing is invented; import Earth measurements to enable this reading.
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>Collected: {fieldReadingCount(allSamples, site)} attribute(s). Source: <span className="font-mono">{earth?.name ?? 'no Earth record loaded'}</span></span>
        <span className="text-accent">{grantPaid ? `Survey grant paid · +${FIELD_SURVEY_GRANT} USD` : `Field survey grant · ${FIELD_SURVEY_GRANT} USD for ${FIELD_SURVEY_READINGS} different readings`}</span>
      </div>
    </Panel>
  );
}

export function fieldRecord(map: FieldMap): ResearchRecord | null {
  const s = store.get();
  const site = FIELD_SITES[map];
  const readings = Object.values(samplesForSite(s.game.samples, site));
  if (!readings.length) return null;
  return { id: site.id, name: 'Your field samples', body: 'earth', location: readings[0].location, measurements: readings.map((reading) => reading.measurement) };
}

const STATUS: Record<string, string> = {
  matching: 'bg-accent/20 text-accent', different: 'bg-primary/20 text-primary', missing: 'bg-white/5 text-muted-foreground', incompatible: 'bg-destructive/20 text-[hsl(4_80%_75%)]',
};

export function Analysis() {
  const dataset = useStore((s) => s.dataset);
  const game = useStore((s) => s.game);
  const refs = useMemo(() => dataset?.records.filter((r) => r.body === 'mars') ?? [], [dataset]);
  const [refId, setRefId] = useState<string>('');
  const ref = refs.find((r) => r.id === refId) ?? refs[0] ?? null;
  const [siteChoice, setSiteChoice] = useState<FieldMap>(() => fieldSiteFor(game.map) ? game.map as FieldMap :
    (Object.keys(FIELD_SITES) as FieldMap[]).find((map) => Object.keys(samplesForSite(game.samples, FIELD_SITES[map])).length) ?? 'wadi');
  const field = useMemo(() => fieldRecord(siteChoice), [siteChoice, game.samples]);
  const report = useMemo(() => (field && ref && dataset ? compareRecords(field, ref, dataset.rules) : null), [field, ref, dataset]);
  const [result, setResult] = useState<{ eligible: boolean; reward: number; reason: string } | null>(null);

  useEffect(() => { if (report && game.stage === 'compare') setStage('submit'); }, [report, game.stage]);
  useEffect(() => setResult(null), [refId, siteChoice]);

  const submit = () => {
    if (!report || !ref || !dataset) return;
    const ev = evaluateSubmission(report, dataset);
    const g = store.get().game;
    const dup = ev.eligible && g.rewardedRefs.includes(ref.id);
    const reward = dup ? 0 : ev.reward;
    const reason = dup ? 'Already rewarded for this reference record. Duplicate submissions are logged but not paid twice.' : ev.reason;
    store.game({
      wallet: g.wallet + reward,
      rewardedRefs: ev.eligible && !dup ? [...g.rewardedRefs, ref.id] : g.rewardedRefs,
      submissions: [{ id: `${Date.now()}`, refId: ref.id, refName: ref.name, score: report.score, comparable: report.comparable, reward, eligible: ev.eligible, reason, date: clock(g.minutes) }, ...g.submissions],
    });
    setResult({ eligible: ev.eligible, reward, reason });
    journal(`Submitted comparison vs ${ref.name}: ${report.score === null ? 'insufficient data' : `${(report.score * 100).toFixed(1)}%`} · ${reward ? `+${reward} USD` : 'no reward'}.`);
    audio.play(reward ? 'reward' : 'confirm');
    setStage('done');
  };

  return (
    <Panel title="Earth–Mars Analysis" kicker="Field Analysis Station" onClose={closePanel} testId="panel-analysis" width="max-w-6xl">
      {!dataset ? <div className="text-sm text-muted-foreground">No research dataset loaded. <button className="underline text-primary" onClick={() => { store.ui({ panelReturn: 'analysis' }); openPanel('data'); }}>Open Data Management</button></div> : (
        <>
          <label className="text-sm text-muted-foreground flex items-center gap-3 mb-4">Field site
            <select className="bg-[#26323b] text-cream rounded px-3 py-2" value={siteChoice} onChange={(e) => setSiteChoice(e.target.value as FieldMap)}>
              {(Object.keys(FIELD_SITES) as FieldMap[]).map((map) => <option key={map} value={map}>{FIELD_SITES[map].place}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground mr-1">Mars reference:</span>
            {!refs.length && <span className="text-xs text-muted-foreground">No Mars measurements are loaded.</span>}
            {refs.map((r) => (
              <button key={r.id} onClick={() => setRefId(r.id)} data-testid={`ref-${r.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${ref?.id === r.id ? 'border-primary bg-primary/15 text-cream' : 'border-[hsl(32_40%_70%/0.15)] text-muted-foreground hover:text-cream'}`}>
                <span className="uppercase text-[10px] font-mono mr-1.5 text-primary">{r.body}</span>{r.name}
              </button>
            ))}
            <GameButton variant="ghost" onClick={() => { store.ui({ panelReturn: 'analysis' }); openPanel('mars-atlas'); }}>Open Mars Research</GameButton>
          </div>
          {!field ? (
            <div className="rounded-xl border border-dashed border-[hsl(32_40%_70%/0.25)] p-8 text-center">
              <div className="font-pixel text-cream text-lg">No field samples yet</div>
              <p className="text-sm text-muted-foreground mt-1">Open Field Records at a field site and record imported measurements. Collected readings appear here.</p>
            </div>
          ) : report && ref && (
            <>
              <div className="grid grid-cols-[1fr_auto] gap-5 items-start">
                <div className="overflow-auto scroll-thin rounded-xl border border-[hsl(32_40%_70%/0.12)]">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono bg-[hsl(196_30%_7%/0.7)]">
                      <tr className="text-left"><th className="px-3 py-2">Attribute</th><th>Earth</th><th>{ref.body}</th><th>Diff</th><th>Similarity</th><th>Status</th><th className="pr-3">Evidence</th></tr>
                    </thead>
                    <tbody>
                      {report.rows.map((r) => (
                        <tr key={r.attribute} className="border-t border-[hsl(32_40%_70%/0.08)] align-top">
                          <td className="px-3 py-2 capitalize text-cream">{r.attribute}<div className="text-[10px] text-muted-foreground normal-case max-w-[200px]">{r.explanation}</div></td>
                          <td className="font-mono py-2">{formatValue(r.earthValue, r.unit)}</td>
                          <td className="font-mono py-2">{formatValue(r.referenceValue, r.unit)}</td>
                          <td className="font-mono py-2">{r.difference === null ? '—' : r.difference.toFixed(2)}</td>
                          <td className="py-2 w-28">{r.score === null ? <span className="text-muted-foreground text-xs">n/a</span> : (
                            <div><div className="h-1.5 rounded bg-white/10"><div className="h-full rounded bg-accent" style={{ width: `${r.score * 100}%` }} /></div><span className="text-[10px] font-mono">{(r.score * 100).toFixed(0)}%</span></div>
                          )}</td>
                          <td className="py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${STATUS[r.status]}`}>{r.status}</span></td>
                          <td className="pr-3 py-2"><EvidenceBadge evidence={r.evidence} /><div className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px]">{r.source}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="w-64 space-y-3">
                  <div className="rounded-2xl p-4 bg-[hsl(196_30%_6%/0.8)] border border-[hsl(32_40%_70%/0.15)] text-center">
                    <div className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-mono">Weighted game score</div>
                    <div className="font-pixel text-5xl text-cream mt-1" data-testid="text-score">{report.score === null ? '—' : `${(report.score * 100).toFixed(1)}%`}</div>
                    <div className="text-xs text-muted-foreground mt-1">{report.comparable} comparable attribute(s)</div>
                    {report.score === null && <div className="text-xs text-primary mt-1">Insufficient data to score.</div>}
                  </div>
                  <div className="text-[11px] text-muted-foreground rounded-xl p-3 border border-[hsl(32_40%_70%/0.1)]">
                    Challenge rule: at least {dataset.reward.minComparable} comparable attributes and {(dataset.reward.minScore * 100).toFixed(0)}% score. Reward {dataset.reward.amount} USD (fictional, configurable).
                  </div>
                  <GameButton className="w-full" onClick={submit} testId="button-submit-discovery">Submit discovery</GameButton>
                  {result && (
                    <div className={`rounded-xl p-3 text-xs anim-pop ${result.reward ? 'bg-accent/15 text-accent' : 'bg-white/5 text-cream'}`} data-testid="text-submission-result">
                      <div className="font-pixel text-base">{result.reward ? `+${result.reward} USD awarded` : result.eligible ? 'Eligible · no new reward' : 'Not eligible'}</div>
                      <p className="mt-1 opacity-90">{result.reason}</p>
                    </div>
                  )}
                </div>
              </div>
              {report.limitations.length > 0 && (
                <div className="mt-4 rounded-xl p-3 border border-primary/25 bg-primary/5">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-primary font-mono mb-1">Evidence limitations</div>
                  <ul className="text-xs text-[hsl(40_30%_80%)] list-disc pl-4 space-y-0.5">{report.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Panel>
  );
}
