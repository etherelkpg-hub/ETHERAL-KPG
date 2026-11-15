import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { audio } from '@/game/audio';
import { continueGame, newGame, readProgress } from '@/game/story';
import { Settings } from './Menus';
import { DataManager } from './DataManager';

const BASE = import.meta.env.BASE_URL;

export function Title() {
  const [overlay, setOverlay] = useState<null | 'settings' | 'data'>(null);
  useEffect(() => {
    const kick = () => { audio.start(); audio.setMood('title'); };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => { window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  }, []);
  const hasProgress = readProgress() !== null;
  const start = () => {
    if (hasProgress && !window.confirm('Start a new game and replace your saved progress?')) return;
    audio.start();
    audio.play('confirm');
    newGame();
  };
  const items = [
    { label: 'Start Game', fn: start },
    { label: 'Continue', fn: continueGame, disabled: !hasProgress },
    { label: 'Settings', fn: () => setOverlay('settings') },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120d10]" data-testid="screen-title">
      <img src={`${BASE}assets/art/title.png`} alt="Wadi Rum at dusk with a researcher and field instrument" className="absolute inset-0 w-full h-full object-cover pixel" style={{ animation: 'title-pan 28s ease-in-out infinite alternate' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(200_45%_6%/0.92)] via-[hsl(200_45%_6%/0.45)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[hsl(200_45%_5%/0.85)] to-transparent" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="absolute w-[3px] h-[3px] bg-[#f3e6cf]" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 13) % 28}%`, animation: `twinkle ${2 + (i % 4)}s ${i * 0.3}s infinite` }} />
      ))}
      <div className="absolute left-[6%] top-[12%] max-w-[46%]">
        <div className="text-[11px] tracking-[0.5em] uppercase text-primary font-mono anim-rise">A field research RPG</div>
        <h1 className="font-pixel text-cream leading-[0.9] mt-3 anim-rise" style={{ fontSize: 'clamp(12px, 3.7vw, 64px)', whiteSpace: 'nowrap', animationDelay: '.1s', textShadow: '0 4px 0 #0b1418' }}>
          NASA: <span className="text-primary">BEYOND</span> EARTH
        </h1>
        <p className="text-[hsl(40_35%_80%)] mt-4 text-base max-w-md anim-rise" style={{ animationDelay: '.2s' }}>Explore Earth’s Mars analogs, test equipment, and recommend a site using your field evidence.</p>
        <nav className="mt-8 space-y-1.5 w-72">
          {items.map((it, i) => (
            <button key={it.label} onClick={it.fn} disabled={it.disabled} data-testid={`button-title-${it.label.split(' ')[0].toLowerCase()}`}
              className="btn-game group w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg text-cream text-xl disabled:opacity-40 hover:bg-[hsl(22_78%_62%/0.16)] anim-rise" style={{ animationDelay: `${0.3 + i * 0.07}s` }}>
              <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition" />
              <span className="flex-1">{it.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="absolute bottom-[3%] left-[6%] right-[6%] flex justify-between items-end gap-6 text-[10.5px] text-[hsl(40_25%_72%/0.75)]">
        <p className="max-w-xl">Fictional game. Not affiliated with or endorsed by NASA. The competition, invitation and prize are fictional. Equipment trials are educational simulations.</p>
      </div>
      {overlay === 'settings' && <Settings onClose={() => setOverlay(null)} onData={() => setOverlay('data')} />}
      {overlay === 'data' && <DataManager onClose={() => setOverlay(null)} />}
    </div>
  );
}
