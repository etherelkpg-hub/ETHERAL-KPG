import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, RotateCcw, Save } from 'lucide-react';
import type { CelestialBody, Dataset, ResearchRecord } from '@/science/model';
import { mapImport, mergeRecords, parseImport, validateDataset, type ColumnMapping } from '@/science/import';
import { convertUnit } from '@/science/compare';
import { restoreDataset, saveDataset } from '@/science/data';
import { audio } from '@/game/audio';
import { store, useStore } from '@/game/store';
import { GameButton, Panel, Tabs } from './Panel';

const FIELDS: (keyof ColumnMapping)[] = ['id', 'name', 'location', 'attribute', 'value', 'unit', 'source', 'evidence'];

function guess(cols: string[], f: string): string {
  const lc = cols.map((c) => c.toLowerCase());
  const alias: Record<string, string[]> = {
    id: ['id', 'record_id', 'site_id'], name: ['name', 'site', 'site_name', 'title'], location: ['location', 'place', 'region'],
    attribute: ['attribute', 'parameter', 'variable', 'measure'], value: ['value', 'reading', 'measurement'], unit: ['unit', 'units'],
    source: ['source', 'reference', 'citation'], evidence: ['evidence', 'quality', 'type'],
  };
  for (const a of alias[f]) { const i = lc.indexOf(a); if (i >= 0) return cols[i]; }
  return '';
}

export function DataManager({ onClose }: { onClose: () => void }) {
  const dataset = useStore((s) => s.dataset);
  const loadErr = useStore((s) => s.datasetError);
  const [tab, setTab] = useState<'overview' | 'import' | 'reward'>(dataset ? 'overview' : 'overview');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<null | { label: string; run: () => void }>(null);

  const commit = (ds: Dataset, text: string) => {
    try {
      saveDataset(ds);
      store.set({ dataset: ds, datasetError: null });
      setMsg({ ok: true, text }); audio.play('confirm');
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); audio.play('deny'); }
  };
  const restore = async () => {
    setBusy(true);
    try { const ds = await restoreDataset(); store.set({ dataset: ds, datasetError: null }); setMsg({ ok: true, text: 'Research dataset reset.' }); audio.play('confirm'); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false);
  };

  return (
    <Panel title="Hackathon Data Management" kicker="Developer tools" onClose={onClose} testId="panel-data" width="max-w-6xl"
      footer={<div className="flex flex-wrap items-center gap-3 text-xs">
        <GameButton variant="ghost" onClick={() => setConfirm({ label: 'Remove imported measurements and reset the research dataset?', run: restore })} disabled={busy} testId="button-reset-dataset"><RotateCcw className="w-4 h-4" />Reset dataset</GameButton>
        {msg && <span className={`flex items-center gap-1.5 ${msg.ok ? 'text-accent' : 'text-[hsl(4_80%_72%)]'}`} data-testid="text-data-status">{msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{msg.text}</span>}
        <span className="ml-auto text-muted-foreground">Stored in this browser, separate from game saves.</span>
      </div>}>
      {confirm && (
        <div className="mb-4 rounded-xl border border-primary/40 bg-primary/10 p-3 flex items-center gap-3 anim-pop" data-testid="confirm-data">
          <AlertTriangle className="w-5 h-5 text-primary" /><span className="text-sm text-cream flex-1">{confirm.label}</span>
          <GameButton onClick={() => { const r = confirm.run; setConfirm(null); r(); }} testId="button-confirm-data">Confirm</GameButton>
          <GameButton variant="ghost" onClick={() => setConfirm(null)}>Cancel</GameButton>
        </div>
      )}
      {loadErr && !dataset && <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-cream">Could not load research data: {loadErr}. Reset the dataset to continue.</div>}
      <Tabs value={tab} onChange={(t) => setTab(t as typeof tab)} tabs={[{ id: 'overview', label: 'Active data' }, { id: 'import', label: 'Import' }, { id: 'reward', label: 'Challenge rules' }]} />
      {tab === 'overview' && (dataset ? <Overview ds={dataset} /> : <p className="text-sm text-muted-foreground">No dataset loaded.</p>)}
      {tab === 'import' && <Importer dataset={dataset} onSave={(ds, text) => setConfirm({ label: text, run: () => commit(ds, 'Dataset saved. Research missions reloaded.') })} />}
      {tab === 'reward' && dataset && <RewardEditor ds={dataset} onSave={(ds) => setConfirm({ label: 'Save updated challenge reward rules?', run: () => commit(ds, 'Reward rules saved.') })} />}
    </Panel>
  );
}

function Overview({ ds }: { ds: Dataset }) {
  const count = (b: CelestialBody) => ds.records.filter((r) => r.body === b).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(['earth', 'mars'] as const).map((b) => (
          <div key={b} className="rounded-xl p-3 bg-[hsl(196_30%_7%/0.6)] border border-[hsl(32_40%_70%/0.1)]"><div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">{b}</div><div className="font-pixel text-2xl text-cream">{count(b)} <span className="text-sm text-muted-foreground">records</span></div></div>
        ))}
      </div>
      <div className="rounded-xl border border-[hsl(32_40%_70%/0.12)] overflow-hidden">
        <table className="w-full text-sm"><thead className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono bg-[hsl(196_30%_7%/0.7)]"><tr className="text-left"><th className="px-3 py-2">Rule</th><th>Kind</th><th>Unit</th><th>Tolerance</th><th>Weight</th><th className="pr-3">Explanation</th></tr></thead>
          <tbody>{ds.rules.map((r) => <tr key={r.attribute} className="border-t border-white/5"><td className="px-3 py-2 capitalize text-cream">{r.attribute}</td><td>{r.kind}</td><td className="font-mono">{r.unit}</td><td className="font-mono">{r.tolerance}</td><td className="font-mono">{r.weight}</td><td className="pr-3 text-xs text-muted-foreground">{r.explanation}</td></tr>)}</tbody></table>
      </div>
      <div className="text-xs text-muted-foreground">Records: {ds.records.map((r) => `${r.id} (${r.body})`).join(' · ')}</div>
    </div>
  );
}

function Importer({ dataset, onSave }: { dataset: Dataset | null; onSave: (ds: Dataset, label: string) => void }) {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [format, setFormat] = useState<'json' | 'csv'>('csv');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [parseErr, setParseErr] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ id: '', name: '', location: '', attribute: '', value: '', unit: '', source: '', evidence: '' });
  const [body, setBody] = useState<CelestialBody>('mars');
  const [result, setResult] = useState<{ records: ResearchRecord[]; errors: string[]; warnings: string[] } | null>(null);
  const cols = useMemo(() => Array.from(new Set(rows.slice(0, 50).flatMap((r) => Object.keys(r)))), [rows]);

  const onFile = async (f: File) => {
    const text = await f.text();
    const fmt = f.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
    setFile({ name: f.name, text }); setFormat(fmt); setResult(null);
    // whole-dataset JSON?
    if (fmt === 'json') {
      try { const j = JSON.parse(text); if (j && typeof j === 'object' && 'records' in j && 'rules' in j) { setRows([]); setParseErr(''); setWhole(j); return; } } catch { /* fall through to row parser */ }
    }
    setWhole(null);
    try {
      const r = parseImport(text, fmt);
      setRows(r); setParseErr('');
      const c = Array.from(new Set(r.slice(0, 50).flatMap((x) => Object.keys(x))));
      setMapping(Object.fromEntries(FIELDS.map((k) => [k, guess(c, k)])) as ColumnMapping);
    } catch (e) { setRows([]); setParseErr((e as Error).message); }
  };
  const [whole, setWhole] = useState<unknown>(null);
  const wholeCheck = useMemo(() => (whole ? validateDataset(whole) : null), [whole]);

  const unitWarnings = useMemo(() => {
    if (!result || !dataset) return [] as string[];
    const out: string[] = [];
    for (const r of result.records) for (const m of r.measurements) {
      const rule = dataset.rules.find((x) => x.attribute === m.attribute);
      if (!rule) out.push(`${r.id}: "${m.attribute}" has no comparison rule; it will be stored but not scored.`);
      else if (rule.kind === 'numeric' && typeof m.value === 'number' && convertUnit(1, m.unit, rule.unit) === null) out.push(`${r.id}: unit "${m.unit}" for ${m.attribute} cannot convert to ${rule.unit}; comparisons will mark it incompatible.`);
      if (m.value === null) out.push(`${r.id}: ${m.attribute} is missing a value.`);
    }
    return Array.from(new Set(out)).slice(0, 30);
  }, [result, dataset]);

  const run = () => setResult(mapImport(rows, mapping, body));

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-xl border border-dashed border-[hsl(32_40%_70%/0.3)] p-4 cursor-pointer hover:border-primary/60 transition">
        <FileUp className="w-6 h-6 text-primary" />
        <div className="flex-1"><div className="font-pixel text-cream">{file ? file.name : 'Choose a JSON or CSV file'}</div><div className="text-xs text-muted-foreground">Long format: one row per measurement (id, name, location, attribute, value, unit, source, evidence). A full dataset JSON can replace everything.</div></div>
        <input type="file" accept=".json,.csv,text/csv,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} data-testid="input-import-file" />
      </label>
      {parseErr && <div className="text-sm text-[hsl(4_80%_72%)] flex gap-2"><AlertTriangle className="w-4 h-4" />{parseErr}</div>}

      {whole !== null && wholeCheck && (
        <div className="rounded-xl p-4 border border-[hsl(32_40%_70%/0.15)]">
          <div className="font-pixel text-cream">Full dataset detected</div>
          {wholeCheck.valid ? <p className="text-sm text-accent mt-1">Valid dataset ({(whole as Dataset).records.length} records, {(whole as Dataset).rules.length} rules).</p>
            : <ul className="text-xs text-[hsl(4_80%_72%)] list-disc pl-4 mt-1">{wholeCheck.errors.slice(0, 12).map((e) => <li key={e}>{e}</li>)}</ul>}
          <GameButton className="mt-3" disabled={!wholeCheck.valid} onClick={() => onSave(whole as Dataset, 'Replace the ENTIRE active dataset (records, rules and rewards) with this file?')} testId="button-replace-dataset"><Save className="w-4 h-4" />Replace whole dataset</GameButton>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div>
            <div className="text-[10px] tracking-[0.28em] uppercase text-primary font-mono mb-1">Preview · {rows.length} rows · {format.toUpperCase()}</div>
            <div className="overflow-auto scroll-thin max-h-48 rounded-xl border border-[hsl(32_40%_70%/0.12)]">
              <table className="text-xs w-full"><thead className="bg-[hsl(196_30%_7%/0.8)] sticky top-0"><tr>{cols.map((c) => <th key={c} className="px-2 py-1.5 text-left font-mono text-muted-foreground">{c}</th>)}</tr></thead>
                <tbody>{rows.slice(0, 8).map((r, i) => <tr key={i} className="border-t border-white/5">{cols.map((c) => <td key={c} className="px-2 py-1 text-cream whitespace-nowrap">{String(r[c] ?? '')}</td>)}</tr>)}</tbody></table>
            </div>
          </div>
          <div className="grid md:grid-cols-[2fr_1fr] gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIELDS.map((f) => (
                <label key={f} className="text-xs"><span className="text-muted-foreground capitalize">{f}</span>
                  <select value={mapping[f]} onChange={(e) => { setMapping({ ...mapping, [f]: e.target.value }); setResult(null); }} data-testid={`select-map-${f}`}
                    className="mt-1 w-full rounded-lg bg-[hsl(196_30%_8%)] border border-input px-2 py-1.5 text-cream">
                    <option value="">(none)</option>{cols.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></label>
              ))}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Celestial body</div>
              <div className="flex gap-1">{(['earth', 'mars'] as const).map((b) => <button key={b} onClick={() => { setBody(b); setResult(null); }} data-testid={`button-body-${b}`} className={`flex-1 py-1.5 rounded-lg text-sm capitalize ${body === b ? 'bg-primary text-primary-foreground' : 'bg-[hsl(196_26%_16%)] text-cream'}`}>{b}</button>)}</div>
              <GameButton className="w-full mt-3" variant="sage" onClick={run} testId="button-validate-import">Map and validate</GameButton>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="rounded-xl p-4 border border-[hsl(32_40%_70%/0.15)] space-y-2 anim-fade">
          <div className="font-pixel text-cream">{result.records.length} record(s) ready for <span className="capitalize text-primary">{body}</span></div>
          {result.errors.length > 0 && <ul className="text-xs text-[hsl(4_80%_72%)] list-disc pl-4">{result.errors.slice(0, 15).map((e) => <li key={e}>{e}</li>)}</ul>}
          {[...result.warnings, ...unitWarnings].length > 0 && <ul className="text-xs text-[hsl(40_70%_72%)] list-disc pl-4 max-h-32 overflow-auto scroll-thin">{[...result.warnings, ...unitWarnings].slice(0, 30).map((w) => <li key={w}>{w}</li>)}</ul>}
          <div className="text-xs text-muted-foreground">{result.records.map((r) => `${r.id} (${r.measurements.length})`).join(' · ')}</div>
          <p className="text-[11px] text-muted-foreground">Saving replaces ALL existing {body} records. Earth field research picks its record by location, so new IDs are fine. Imported data is labeled by its evidence column and is not real NASA data unless you supplied it.</p>
          <GameButton disabled={!dataset || result.errors.length > 0 || !result.records.length} testId="button-save-import"
            onClick={() => dataset && onSave(mergeRecords(dataset, result.records, body), `Replace all ${body} records with ${result.records.length} imported record(s)?`)}>
            <Save className="w-4 h-4" />Save to active data
          </GameButton>
        </div>
      )}
    </div>
  );
}

function RewardEditor({ ds, onSave }: { ds: Dataset; onSave: (ds: Dataset) => void }) {
  const [r, setR] = useState(ds.reward);
  const field = (k: keyof typeof r, label: string, step: number) => (
    <label className="text-sm" key={k}><span className="text-muted-foreground text-xs">{label}</span>
      <input type="number" step={step} value={r[k]} onChange={(e) => setR({ ...r, [k]: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-[hsl(196_30%_8%)] border border-input px-3 py-2 text-cream font-mono" data-testid={`input-reward-${k}`} /></label>
  );
  return (
    <div className="max-w-md space-y-3">
      {field('amount', 'Reward amount (fictional USD)', 10)}
      {field('minComparable', 'Minimum comparable attributes', 1)}
      {field('minScore', 'Minimum score (0 to 1)', 0.01)}
      <GameButton onClick={() => onSave({ ...ds, reward: r })} testId="button-save-reward"><Save className="w-4 h-4" />Save rules</GameButton>
    </div>
  );
}
