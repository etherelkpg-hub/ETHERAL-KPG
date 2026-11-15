import { useState } from 'react';
import { ArrowLeft, Database, FileText, Inbox, Mail, Paperclip, Power, X } from 'lucide-react';
import { useStore, store } from '@/game/store';
import { CHALLENGE_SPONSOR, clock, closePanel, journal, setFlag, setStage, openPanel, reviewMarsResearch } from '@/game/story';
import { MarsReferenceContent } from './MarsAtlas';
import { RecordTable } from './RecordTable';

const BASE = import.meta.env.BASE_URL;

const EMAILS = [
  { id: 'challenge', from: CHALLENGE_SPONSOR, subject: 'Congratulations! You Have Qualified!', time: '06:58' },
  { id: 'water', from: 'Denver Water', subject: 'Your monthly statement is ready', time: 'Yesterday' },
  { id: 'rosa', from: 'Abuela Rosa', subject: 'tamales sunday?? bring the telescope', time: 'Mon' },
];

export function Computer() {
  const game = useStore((s) => s.game);
  const dataset = useStore((s) => s.dataset);
  const err = useStore((s) => s.datasetError);
  const [app, setApp] = useState<'mail' | null>(null);
  const [open, setOpen] = useState('challenge');
  const [att, setAtt] = useState(false);

  const readChallengeEmail = () => {
    setOpen('challenge');
    if (!store.get().game.flags.emailRead) { setFlag('emailRead'); journal('Read the qualification email from the Beyond Earth Challenge.'); setStage('refs'); }
  };
  const openAtt = () => {
    setAtt(true);
    reviewMarsResearch();
  };
  const openAtlas = () => {
    readChallengeEmail();
    reviewMarsResearch();
    store.ui({ panelReturn: 'computer' });
    openPanel('mars-atlas');
  };
  const records = dataset?.records.filter((r) => r.body === 'mars') ?? [];

  return (
    <div className="computer-panel absolute inset-0 z-40 flex items-center justify-center p-[2.5%] bg-[hsl(200_50%_4%/0.6)] anim-fade" data-testid="panel-computer">
      <div className="relative w-full h-full max-w-6xl rounded-2xl overflow-hidden border-[10px] border-[#1b1c22] shadow-2xl anim-pop" style={{ boxShadow: '0 0 0 2px #33343c, 0 30px 80px -20px #000' }}>
        <img src={`${BASE}assets/art/title.png`} alt="" className="absolute inset-0 w-full h-full object-cover pixel" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200_50%_8%/0.2)] to-[hsl(200_50%_6%/0.65)]" />
        {/* desktop icons */}
        <div className="absolute top-5 left-5 flex flex-col gap-4">
          <DeskIcon label="Mail" badge={!game.flags.emailRead} onClick={() => { setApp('mail'); setAtt(false); if (open === 'challenge') readChallengeEmail(); }} testId="icon-mail"><Mail className="w-7 h-7" /></DeskIcon>
          <DeskIcon label="Mars Research" onClick={openAtlas} testId="icon-research"><Database className="w-7 h-7" /></DeskIcon>
          <DeskIcon label="notes.txt" onClick={() => {}} testId="icon-notes" disabled><FileText className="w-7 h-7" /></DeskIcon>
        </div>
        {!app && (
          <div className="absolute right-6 top-6 panel-soft px-4 py-3 text-sm text-cream anim-rise max-w-xs">
            <div className="font-pixel text-primary">1 new message</div>
            <div className="text-xs text-muted-foreground mt-1">{CHALLENGE_SPONSOR}</div>
          </div>
        )}

        {app === 'mail' && (
          <div className="absolute inset-x-[6%] top-[6%] bottom-[11%] rounded-xl overflow-hidden flex flex-col bg-[#f1e9da] text-[#2a2420] anim-pop shadow-2xl">
            <div className="h-9 flex items-center px-3 gap-2 bg-[#2b4a5c] text-[#f1e9da]">
              <Inbox className="w-4 h-4" /><span className="font-pixel text-sm">Fieldmail</span>
              <span className="flex-1" />
              <button onClick={() => setApp(null)} className="hover:text-white" data-testid="button-close-mail"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 flex min-h-0">
              <aside className="w-2/5 max-w-64 shrink-0 border-r border-[#d8ccb6] overflow-auto bg-[#e8dfcd]">
                {EMAILS.map((e) => {
                  const unread = e.id === 'challenge' && !game.flags.emailRead;
                  return (
                    <button key={e.id} onClick={() => { setAtt(false); e.id === 'challenge' ? readChallengeEmail() : setOpen(e.id); }} data-testid={`email-${e.id}`}
                      className={`w-full text-left px-3 py-2.5 border-b border-[#d8ccb6] transition-colors ${open === e.id ? 'bg-[#f6efe1]' : 'hover:bg-[#efe6d4]'}`}>
                      <div className="flex items-center gap-2">
                        {unread && <span className="w-2 h-2 rounded-full bg-[#d9763a]" />}
                        <span className={`text-xs truncate ${unread ? 'font-bold' : ''}`}>{e.from}</span>
                        <span className="ml-auto text-xs hidden sm:inline text-[#7a6e60]">{e.time}</span>
                      </div>
                      <div className={`text-xs mt-0.5 ${unread ? 'font-semibold' : 'text-[#5a5048]'}`}>{e.subject}</div>
                    </button>
                  );
                })}
              </aside>
              <section className="flex-1 min-w-0 overflow-auto scroll-thin p-3 sm:p-6">
                {att ? (
                  <div className="anim-fade" data-testid="mars-mail-reference">
                    <button onClick={() => setAtt(false)} className="flex items-center gap-1 text-xs text-[#2b4a5c] mb-3 hover:underline" data-testid="button-back-email"><ArrowLeft className="w-3 h-3" />Back to message</button>
                    <h3 className="font-pixel text-xl mb-3">MARS_REFERENCE_DATA</h3>
                    <button onClick={openAtlas} className="underline mb-3 text-sm" data-testid="button-open-mars-atlas">Open Mars Research and the Earth site atlas</button>
                    <div className="rounded-xl p-3 bg-[#26323b] text-cream mb-4"><MarsReferenceContent /></div>
                    <div className="space-y-3 dark text-cream">
                      {records.map((r) => <RecordTable key={r.id} record={r} />)}
                      {!records.length && (
                        <div className="text-[#2a2420] text-sm">
                          {err ? `Research data could not load: ${err}` : 'Mars measurements are unavailable until you import a dataset.'}
                          <button className="ml-2 underline" onClick={() => { store.ui({ panelReturn: 'computer' }); openPanel('data'); }}>Open Data Management</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : open === 'challenge' ? (
                  <article className="max-w-2xl anim-fade" data-testid="email-body">
                    <div className="text-xs text-[#7a6e60]">From: {CHALLENGE_SPONSOR} · Today {clock(game.minutes)}</div>
                    <h3 className="font-pixel text-2xl mt-1 mb-4">Congratulations! You Have Qualified!</h3>
                    <div className="space-y-3 text-base leading-relaxed">
                      <p>Dear Participant,</p>
                      <p>Congratulations!</p>
                      <p>{CHALLENGE_SPONSOR} has selected you to take part in the Beyond Earth Challenge.</p>
                      <p>You are among the selected participants invited to take part in an exciting scientific research competition.</p>
                      <p>Your mission is to identify Earth sites where you can test equipment for Mars. Select a test, record observations, and explain what makes the site a useful analog.</p>
                      <p>Open the Mars reference attachment or the Mars Research app to read the team’s site atlas.</p>
                      <p>Travel to suitable locations on Earth, collect scientific observations, compare your findings, and submit your discoveries.</p>
                      <p>The strongest scientifically supported submissions may receive a fictional competition cash prize.</p>
                      <p>Good luck, Explorer!</p>
                      <p>{CHALLENGE_SPONSOR}</p>
                    </div>
                    <div className="mt-5 flex gap-3 flex-wrap">
                        <button onClick={openAtt} data-testid="button-attachment-mars"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#c9b896] bg-[#faf4e8] hover:bg-white transition text-sm">
                          <Paperclip className="w-4 h-4 text-[#d9763a]" />
                          <span className="font-mono text-xs">MARS_REFERENCE_DATA</span>
                          {game.flags.marsViewed && <span className="text-[10px] text-[#4f7d5a]">opened</span>}
                        </button>
                    </div>
                    <p className="mt-6 text-xs text-[#7a6e60] border-t border-[#d8ccb6] pt-3">The company, invitation and prize are fictional.</p>
                  </article>
                ) : open === 'water' ? (
                  <article className="anim-fade"><h3 className="font-pixel text-xl mb-3">Your monthly statement is ready</h3><p className="text-sm">Usage this month: 3,412 gallons. That is 7.8% less than last spring. Nice work on the shorter showers.</p></article>
                ) : (
                  <article className="anim-fade"><h3 className="font-pixel text-xl mb-3">tamales sunday?? bring the telescope</h3><p className="text-sm">mijo your father says the sky will be clear on sunday. bring the telescope and your appetite. love, abuela</p></article>
                )}
              </section>
            </div>
          </div>
        )}

        {/* taskbar */}
        <div className="absolute bottom-0 inset-x-0 h-11 bg-[hsl(200_40%_8%/0.85)] backdrop-blur flex items-center px-4 gap-3 text-cream text-sm">
          <span className="font-pixel">MATEO-PC</span>
          <span className="text-muted-foreground text-xs">{game.flags.emailRead ? 'Inbox read' : '1 unread'}</span>
          <span className="flex-1" />
          <span className="font-mono text-xs">{clock(game.minutes)}</span>
          <button onClick={closePanel} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" data-testid="button-close-computer"><Power className="w-4 h-4" />Step away</button>
        </div>
      </div>
    </div>
  );
}

function DeskIcon({ children, label, onClick, badge, disabled, testId }: { children: React.ReactNode; label: string; onClick: () => void; badge?: boolean; disabled?: boolean; testId: string }) {
  return (
    <button onClick={onClick} disabled={disabled} data-testid={testId} className="w-20 flex flex-col items-center gap-1 text-cream disabled:opacity-40 group">
      <span className="relative w-14 h-14 rounded-xl bg-[hsl(196_30%_14%/0.8)] border border-white/10 flex items-center justify-center group-hover:bg-[hsl(196_30%_20%/0.9)] transition">
        {children}
        {badge && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center anim-blink">1</span>}
      </span>
      <span className="text-xs drop-shadow">{label}</span>
    </button>
  );
}
