import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { playerAppearance, portrait } from '@/game/art/characters';
import { audio } from '@/game/audio';
import { useStore, type Speaker } from '@/game/store';
import { advanceDialogue, finishDialogue } from '@/game/story';

export const typing = { active: false, finish: () => {} };

const NAMES: Record<Speaker, string> = { player: 'Mateo', mom: 'Mom', dad: 'Dad', news: 'KDVR Morning News', staff: 'Local', narrator: '' };
const BG: Record<Speaker, string> = { player: '#203a52', mom: '#3c4a33', dad: '#4a3a2a', news: '#1d2a3a', staff: '#2a3540', narrator: '#2a2430' };

export function Dialogue() {
  const d = useStore((s) => s.ui.dialogue);
  const map = useStore((s) => s.game.map);
  const line = d ? d.lines[d.i] : null;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!line) return;
    setShown(0);
    let n = 0;
    typing.active = true;
    const id = window.setInterval(() => {
      n += 2;
      setShown(n);
      if (n % 6 === 0) audio.play('type');
      if (n >= line.text.length) { window.clearInterval(id); typing.active = false; }
    }, 22);
    typing.finish = () => { window.clearInterval(id); setShown(line.text.length); typing.active = false; };
    return () => { window.clearInterval(id); typing.active = false; };
  }, [line, d?.i]);

  if (!d || !line) return null;
  const sp = line.speaker;
  const name = line.name ?? NAMES[sp];
  const appearance = line.portrait ?? (sp === 'player' ? playerAppearance(map) : sp === 'narrator' ? null : sp);
  const done = shown >= line.text.length;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[4%] w-[min(92%,880px)] z-30 anim-rise" data-testid="dialogue-box"
      onClick={() => (typing.active ? typing.finish() : advanceDialogue())}>
      <div className="panel flex gap-3 p-3 sm:gap-4 sm:p-4 cursor-pointer">
        <div className="shrink-0 size-16 sm:size-24 rounded-xl overflow-hidden border border-[hsl(32_40%_70%/0.25)] flex items-center justify-center" style={{ background: BG[sp] }}>
          {appearance ? <img key={appearance} src={portrait(appearance, BG[sp])} alt={name} className="pixel w-full h-full anim-fade" />
            : <Compass className="w-10 h-10 text-primary" />}
        </div>
        <div className="flex-1 min-w-0 py-1">
          {name && <div className="font-pixel text-primary text-lg sm:text-xl leading-tight mb-2" data-testid="text-speaker">{name}</div>}
          <p className="text-cream text-base sm:text-lg leading-relaxed min-h-[3.2em] max-h-[27dvh] overflow-auto scroll-thin" data-testid="text-dialogue">{line.text.slice(0, shown)}</p>
          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{d.i + 1}/{d.lines.length}</span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span className={done ? 'anim-blink' : 'invisible'}><span className="keycap mr-1">E</span>continue</span>
              <button type="button" className="panel-soft px-2.5 py-1.5 font-pixel text-cream hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary"
                data-dialogue-action data-testid="button-skip-dialogue" onClick={(event) => { event.stopPropagation(); finishDialogue(); }}>
                Skip All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
