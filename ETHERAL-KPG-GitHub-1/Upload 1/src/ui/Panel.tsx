import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Panel({ title, kicker, onClose, children, width = 'max-w-4xl', testId, footer }: {
  title: string; kicker?: string; onClose?: () => void; children: ReactNode; width?: string; testId?: string; footer?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-[3%] bg-[hsl(200_50%_4%/0.55)] anim-fade" data-testid={testId}>
      <div className={`panel anim-pop w-full ${width} max-h-full flex flex-col overflow-hidden`}>
        <header className="flex items-center gap-3 px-5 py-3 border-b border-[hsl(32_40%_70%/0.12)]">
          <div className="flex-1 min-w-0">
            {kicker && <div className="text-[10px] tracking-[0.28em] uppercase text-primary/90 font-mono">{kicker}</div>}
            <h2 className="font-pixel text-xl text-cream leading-tight truncate">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cream transition-colors" data-testid="button-close-panel">
              <span className="keycap">Esc</span><X className="w-4 h-4" />
            </button>
          )}
        </header>
        <div className="flex-1 overflow-auto scroll-thin p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-[hsl(32_40%_70%/0.12)]">{footer}</footer>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: T; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[hsl(196_30%_7%/0.7)] w-fit">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} data-testid={`tab-${t.id}`}
          className={`px-3 py-1.5 rounded-lg text-sm font-pixel transition-colors ${value === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-cream'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function GameButton({ children, onClick, variant = 'primary', disabled, testId, className = '' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger' | 'sage'; disabled?: boolean; testId?: string; className?: string;
}) {
  const v = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110',
    sage: 'bg-accent text-accent-foreground hover:brightness-110',
    ghost: 'bg-[hsl(196_26%_16%)] text-cream hover:bg-[hsl(196_26%_22%)] border border-[hsl(32_40%_70%/0.15)]',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-pixel text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${v} ${className}`}>
      {children}
    </button>
  );
}

export function EvidenceBadge({ evidence }: { evidence: string }) {
  const c = evidence === 'measured' ? 'bg-accent/20 text-accent border-accent/40'
    : evidence === 'reference' ? 'bg-[hsl(206_50%_60%/0.18)] text-[hsl(206_60%_75%)] border-[hsl(206_50%_60%/0.4)]'
      : 'bg-primary/15 text-primary border-primary/40';
  return <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider font-mono ${c}`}>{evidence}</span>;
}
