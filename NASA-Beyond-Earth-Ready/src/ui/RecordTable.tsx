import type { ResearchRecord } from '@/science/model';
import { formatValue } from '@/game/research';
import { EvidenceBadge } from './Panel';

export function RecordTable({ record }: { record: ResearchRecord }) {
  const demo = record.measurements.some((m) => m.evidence === 'demo');
  return (
    <div className="rounded-xl border border-[hsl(32_40%_70%/0.14)] overflow-hidden" data-testid={`record-${record.id}`}>
      <div className="px-4 py-3 bg-[hsl(196_30%_8%/0.8)] flex items-start justify-between gap-3">
        <div>
          <div className="font-pixel text-cream text-base">{record.name}</div>
          <div className="text-xs text-muted-foreground">{record.location} · <span className="uppercase">{record.body}</span> · <span className="font-mono">{record.id}</span></div>
        </div>
        {demo && <span className="shrink-0 px-2 py-1 rounded-md bg-primary/15 border border-primary/40 text-primary text-[10px] font-mono tracking-widest">DEMO DATA</span>}
      </div>
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          <tr className="text-left"><th className="px-4 py-2">Attribute</th><th>Value</th><th>Evidence</th><th className="pr-4">Source</th></tr>
        </thead>
        <tbody>
          {record.measurements.map((m, i) => (
            <tr key={m.attribute + i} className="border-t border-[hsl(32_40%_70%/0.08)]">
              <td className="px-4 py-2 capitalize text-cream">{m.attribute}</td>
              <td className={`font-mono ${m.value === null ? 'text-muted-foreground italic' : 'text-cream'}`}>{formatValue(m.value, m.unit)}</td>
              <td><EvidenceBadge evidence={m.evidence} /></td>
              <td className="pr-4 py-2 text-xs text-muted-foreground">{m.source}{m.note ? ` · ${m.note}` : ''}</td>
            </tr>
          ))}
          {!record.measurements.length && <tr><td colSpan={4} className="px-4 py-4 text-muted-foreground text-sm">No measurements in this record.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
