import { createElement as h, useEffect, useState } from 'react';
import { Backpack, BookOpen, Clock, Compass, Map as MapIcon, MapPin, Pause, Wallet } from 'lucide-react';
import { live, useStore, store, type MapId } from '@/game/store';
import { isSurveyed } from '@/game/exploration';
import { outlines } from '@/game/scenes/WorldScene';
import { MapTerrain } from './ExplorationMap';
import { clock, missionText, openPanel } from '@/game/story';

function MiniMap({ map }: { map: MapId }) {
  const rows = useStore((s) => s.game.explored?.[map]);
  const [pos, setPos] = useState(() => ({ x: live.x, y: live.y }));
  useEffect(() => {
    const sync = () => setPos((p) => p.x === live.x && p.y === live.y ? p : { x: live.x, y: live.y });
    sync();
    const id = setInterval(sync, 125);
    return () => clearInterval(id);
  }, [map]);
  const area = outlines[map];
  if (!area) return null;

  const scale = 52 / Math.min(565, Math.max(area.w, area.h) * 0.32);
  const camp = area.items.find((item) => item.label === 'Bubble Camp');
  const campX = camp ? camp.x + camp.w / 2 : 0;
  const campY = camp ? camp.y + camp.h / 2 : 0;
  const labelX = 60 + (campX - pos.x) * scale;
  const labelY = 60 + (campY - pos.y) * scale;
  const campText = camp && isSurveyed(rows, campX, campY) && Math.hypot(labelX - 60, labelY - 60) < 44
    ? h('text', {
      x: Math.max(27, Math.min(93, labelX)), y: Math.max(24, Math.min(100, labelY - 11)),
      textAnchor: 'middle', fontSize: 7, fontWeight: 700, fill: '#fff0c9',
      style: { paintOrder: 'stroke', stroke: '#282432', strokeWidth: 2.8 },
    }, camp.label) : null;
  return h('svg', {
    viewBox: '0 0 120 120', role: 'img', 'aria-label': 'North-up exploration minimap', 'data-testid': 'hud-minimap',
    style: { position: 'absolute', right: '1.8%', top: 'calc(2.5% + 42px)', width: 'clamp(64px, 12%, 134px)' },
  },
  h('defs', null, h('clipPath', { id: 'hud-compass-edge' }, h('circle', { cx: 60, cy: 60, r: 52 }))),
  h('circle', { cx: 60, cy: 60, r: 57, fill: '#202434', stroke: '#d5ab7f', strokeWidth: 1.5 }),
  h('g', { clipPath: 'url(#hud-compass-edge)' },
    h('circle', { cx: 60, cy: 60, r: 53, fill: '#181827' }),
    h('g', { transform: 'translate(60 60) scale(' + scale + ') translate(' + -pos.x + ' ' + -pos.y + ')' },
      h(MapTerrain, { map, area, rows })),
    campText,
    h('circle', { cx: 60, cy: 60, r: 33, fill: 'none', stroke: '#f3e5c5', opacity: 0.23, strokeDasharray: '2 4' })),
  h('path', { d: 'M60 11v9m0 80v9M11 60h9m80 0h9', stroke: '#e7c397', strokeWidth: 1.4 }),
  h('text', { x: 60, y: 28, textAnchor: 'middle', fill: '#fff2d4', fontSize: 10, fontWeight: 700, style: { paintOrder: 'stroke', stroke: '#202434', strokeWidth: 3 } }, 'N'),
  h('circle', { cx: 60, cy: 60, r: 6, fill: '#fbe8bb', stroke: '#201d2d', strokeWidth: 2 }),
  h('circle', { cx: 60, cy: 60, r: 2.3, fill: '#e69560' }));
}

export function Hud() {
  const game = useStore((s) => s.game);
  const ui = useStore((s) => s.ui);
  const m = missionText(game);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  const tutorial = ui.tutorialAt > 0 && now - ui.tutorialAt < 11000;
  const tutFading = now - ui.tutorialAt > 9800;
  const hidden = ui.panel === 'flight';
  if (hidden) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none">
      {/* mission tracker */}
      <div className="absolute top-[2.5%] left-[1.8%] w-[min(30%,340px)] space-y-2">
        <div key={m.title} className="panel-soft p-3 anim-rise pointer-events-auto" data-testid="hud-mission">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-primary font-mono">
            <Compass className="w-3.5 h-3.5" /> Main mission
          </div>
          <div className="font-pixel text-cream text-lg leading-tight mt-1" data-testid="text-mission-title">{m.title}</div>
          <p className="text-[12.5px] text-[hsl(40_30%_78%)] leading-snug mt-0.5" data-testid="text-mission-desc">{m.text}</p>
        </div>
        <div className="panel-soft px-3 py-1.5 flex items-center gap-3 text-[12px] text-[hsl(40_30%_80%)] w-fit">
          <span className="flex items-center gap-1.5" data-testid="text-location"><MapPin className="w-3.5 h-3.5 text-accent" />{ui.area || '...'}</span>
          <span className="flex items-center gap-1.5 font-mono"><Clock className="w-3.5 h-3.5 text-accent" />{clock(game.minutes)}</span>
        </div>
      </div>

      {/* top right */}
      <div className="absolute top-[2.5%] right-[1.8%] flex items-center gap-2 pointer-events-auto">
        <div className="panel-soft px-3 py-1.5 flex items-center gap-2 text-[13px] font-mono text-cream" data-testid="text-wallet">
          <Wallet className="w-4 h-4 text-primary" />Unlimited <span className="text-muted-foreground text-[10px]">USD</span>
        </div>
        {([['inventory', 'I', Backpack], ['journal', 'J', BookOpen], ['map', 'M', MapIcon], ['pause', 'Esc', Pause]] as const).map(([p, k, Icon]) => (
          <button key={p} onClick={() => !ui.dialogue && openPanel(p)} className="panel-soft px-2 py-1.5 flex items-center gap-1.5 text-cream hover:border-primary/60 transition-colors" data-testid={`button-open-${p}`} title={p}>
            <Icon className="w-4 h-4" /><span className="keycap">{k}</span>
          </button>
        ))}
      </div>

      {!ui.panel && <MiniMap map={game.map} />}

      {/* interaction prompt */}
      {ui.prompt && !ui.dialogue && !ui.panel && (
        <div key={ui.prompt} className="absolute left-1/2 -translate-x-1/2 bottom-[7%] anim-pop" data-testid="hud-prompt">
          <div className="panel-soft px-4 py-2 flex items-center gap-3 text-cream font-pixel text-base">
            <span className="keycap text-sm">E</span>{ui.prompt}
          </div>
        </div>
      )}

      {/* tutorial */}
      {tutorial && (
        <div className={`absolute bottom-[4%] right-[1.8%] panel-soft p-3 w-56 transition-opacity duration-1000 ${tutFading ? 'opacity-0' : 'opacity-100 anim-rise'}`} data-testid="hud-controls">
          <div className="text-[10px] tracking-[0.28em] uppercase text-primary font-mono mb-2">Controls</div>
          {[['WASD', 'Move'], ['Shift', 'Run'], ['E', 'Interact'], ['I  J  M', 'Kit, Journal, Map'], ['Esc', 'Pause / Close']].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-[12px] text-cream py-0.5">
              <span className="flex gap-1">{k.split(/\s+/).map((x) => <span key={x} className="keycap">{x}</span>)}</span><span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* mission banner */}
      {ui.banner && (
        <div key={ui.banner.key} className="absolute top-[14%] left-1/2 -translate-x-1/2 text-center" style={{ animation: 'banner 4.6s ease both' }} data-testid="hud-banner"
          onAnimationEnd={() => store.ui({ banner: null })}>
          <div className="text-[11px] tracking-[0.4em] uppercase text-primary font-mono">New mission</div>
          <div className="font-pixel text-4xl text-cream drop-shadow-[0_3px_0_hsl(200_50%_5%)] mt-1">{ui.banner.title}</div>
          <div className="mx-auto mt-2 h-px w-48 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      )}

      {/* toast */}
      {ui.toast && (
        <div key={ui.toast.key} className="absolute bottom-[4%] left-[1.8%] panel-soft px-3 py-2 text-[13px] text-cream" style={{ animation: 'banner 3.4s ease both' }}
          onAnimationEnd={() => store.ui({ toast: null })} data-testid="hud-toast">{ui.toast.text}</div>
      )}

      <div className="absolute bottom-[1%] left-1/2 -translate-x-1/2 text-[10px] text-[hsl(40_20%_70%/0.5)] font-mono tracking-wide">
        Fictional competition
      </div>
    </div>
  );
}
