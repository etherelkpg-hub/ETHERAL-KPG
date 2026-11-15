import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Plane, Ticket } from 'lucide-react';
import { audio } from '@/game/audio';
import { store, useStore } from '@/game/store';
import { closePanel, journal, saveProgress, warp } from '@/game/story';
import { GameButton, Panel } from './Panel';
import { destinations as DESTINATIONS, flightForBoarding, formatSiteCoordinates, pendingDestinations, pendingTicketFlights } from '@/game/config';
export { destinations as DESTINATIONS } from '@/game/config';

const BASE = import.meta.env.BASE_URL;

export function Booking() {
  const game = useStore((s) => s.game);
  const [sel, setSel] = useState(DESTINATIONS[0]);
  const passes = pendingDestinations(game);
  const ticket = passes.find((destination) => destination.id === sel.id);
  const { geography, country } = sel;
  const book = () => {
    const current = store.get().game;
    const active = pendingTicketFlights(current);
    if (current.map !== 'airport' || active.includes(sel.flight)) return;
    store.game({
      pendingFlights: [...active, sel.flight],
      flags: { ...current.flags, ticket: true },
      tickets: [...current.tickets, { from: 'Denver, United States', to: `${sel.place}, ${sel.country}`, price: sel.price, date: new Date().toLocaleDateString(), flight: sel.flight }],
    });
    journal(`Booked ${sel.flight} to ${sel.airport} with unlimited funds.`);
    saveProgress();
    audio.play('confirm');
  };
  return (
    <Panel title="Book a Flight" kicker="Front Range Regional · Self-service" onClose={closePanel} testId="panel-booking" width="max-w-5xl">
      <div className="grid md:grid-cols-[1.1fr_1fr] gap-5">
        <div className="space-y-1">
          <div className="flex justify-between gap-2 text-xs text-muted-foreground mb-2">
            <span>Denver (FRR)</span><span className="text-accent" data-testid="pending-pass-count">{passes.length} / {DESTINATIONS.length} boarding passes</span>
          </div>
          {DESTINATIONS.map((d) => (
            <button key={d.id} onClick={() => setSel(d)} data-testid={`dest-${d.id}`} aria-pressed={sel.id === d.id}
              className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center gap-3 ${sel.id === d.id ? 'border-primary bg-primary/10' : 'border-[hsl(32_40%_70%/0.12)] hover:border-[hsl(32_40%_70%/0.3)]'}`}>
              <div className="flex-1">
                <div className="font-pixel text-cream">{d.place}<span className="text-muted-foreground"> · {d.country}</span></div>
                <div className="text-xs text-muted-foreground">{d.blurb}</div>
                <div className="text-xs text-muted-foreground">Gate {d.gate}</div>
              </div>
              {passes.includes(d) ? <span className="flex items-center gap-1 text-xs text-accent"><Check className="w-4 h-4" />Booked</span>
                : <span className="font-mono text-primary text-sm">{d.price} USD</span>}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-[hsl(32_40%_70%/0.15)] p-5 bg-[hsl(196_30%_7%/0.6)] flex flex-col">
          {ticket ? (
            <div className="anim-pop flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-accent font-pixel"><Check className="w-5 h-5" />Boarding pass issued</div>
              <div className="mt-4 rounded-xl bg-[#f1e9da] text-[#2a2420] p-4 relative overflow-hidden">
                <div className="flex justify-between text-xs"><span>PASSENGER</span><span>FLIGHT</span></div>
                <div className="flex justify-between font-pixel text-lg"><span>MATEO REYES</span><span>{ticket.flight}</span></div>
                <div className="mt-3 flex items-center justify-between font-pixel text-3xl"><span>DEN</span><Plane className="w-6 h-6 text-[#d9763a]" /><span>{ticket.code}</span></div>
                <div className="mt-3 grid grid-cols-3 text-xs"><span>GATE {ticket.gate}</span><span>BOARDS 10:10</span><span>SEAT 23A</span></div>
              </div>
              <p className="text-sm text-muted-foreground my-4">Board at Gate {ticket.gate}, or select another destination to book more passes.</p>
              <GameButton className="mt-auto" onClick={closePanel} testId="button-booking-done">Back to terminal</GameButton>
            </div>
          ) : (
            <>
              <div className="text-xs tracking-[0.28em] uppercase text-primary font-mono">Flight details</div>
              <div className="font-pixel text-2xl text-cream mt-1">{sel.place}</div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm mt-3">
                <dt className="text-muted-foreground">Destination location</dt><dd className="text-cream">{sel.country}</dd>
                <dt className="text-muted-foreground">Arrival airport</dt><dd className="text-cream">{sel.airport}</dd>
                <dt className="text-muted-foreground">Flight</dt><dd className="text-cream font-mono">{sel.flight} · 10:40</dd>
                <dt className="text-muted-foreground">Ticket price</dt><dd className="text-primary font-mono">{sel.price} USD</dd>
                <dt className="text-muted-foreground">Your balance</dt><dd className="text-cream font-mono">Unlimited USD</dd>
              </dl>
              <GameButton className="mt-auto" onClick={book} testId="button-confirm-booking"><Ticket className="w-4 h-4" />Confirm booking</GameButton>
              <p className="text-xs text-muted-foreground mt-2">USD amounts are fictional and used only in the game.</p>
            </>
          )}
          {geography && (
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-muted-foreground" data-testid="booking-field-location">
              <div>{[...new Set([geography.region, country, geography.continent])].join(' · ')}</div>
              <div className="font-mono text-cream">{formatSiteCoordinates(geography)}</div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

const MAP_WIDTH = 1600, MAP_HEIGHT = 900;
const MAP_ART = 1600, MAP_ART_TOP = -150;
const mapPoint = ({ x, y }: { x: number; y: number }) => ({ x: x * MAP_ART, y: y * MAP_ART + MAP_ART_TOP });
const DENVER_PIN = { x: 0.203, y: 0.33 };
const DENVER = mapPoint(DENVER_PIN);
const FLIGHT_MAP_IMAGE = `${BASE}assets/art/worldmap.png`;
const ROUTE_TIME = 7000;
const PLANE_PATH = 'M18 0 L-10 -5 L-14 -16 L-18 -16 L-14 -4 L-20 -3 L-24 -9 L-27 -9 L-25 0 L-27 9 L-24 9 L-20 3 L-14 4 L-18 16 L-14 16 L-10 5 Z';

export function Flight() {
  const { game, ui } = store.get();
  const flight = useRef(flightForBoarding(game, ui.flightDestination)).current;
  const [landing, setLanding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const plane = useRef<SVGGElement>(null);
  const route = useRef<SVGPathElement>(null);
  const landingRequested = useRef(false);
  const to = mapPoint(flight?.route ?? DENVER_PIN);
  const viewHeight = Math.max(MAP_HEIGHT, to.y + 95);
  const bendX = (DENVER.x + to.x) / 2;
  const bendY = Math.min(DENVER.y, to.y) - Math.min(90, 20 + Math.abs(to.x - DENVER.x) / 5);
  const curve = "M " + DENVER.x + " " + DENVER.y + " Q " + bendX + " " + bendY + " " + to.x + " " + to.y;
  const finish = useCallback(() => {
    if (!flight || landingRequested.current) return;
    landingRequested.current = true;
    setLanding(true);
    if (flight.id === 'wadi') warp(flight.id, 820, 2260, false);
    else warp(flight.id, 1250, 1805, false);
  }, [flight]);

  useEffect(() => {
    if (!flight) closePanel();
  }, [flight]);

  useEffect(() => {
    if (!flight) return;
    const map = new Image();
    const ready = () => setMapReady(true);
    map.onload = ready;
    map.onerror = ready;
    map.src = FLIGHT_MAP_IMAGE;
    return () => { map.onload = null; map.onerror = null; };
  }, [flight]);

  useEffect(() => {
    if (!mapReady || !flight) return;
    const track = route.current;
    const icon = plane.current;
    if (!track || !icon) return;
    const length = track.getTotalLength();
    const start = performance.now();
    let raf = 0;
    let arrival: ReturnType<typeof setTimeout> | undefined;
    let shown = -1;
    const loop = (now: number) => {
      if (landingRequested.current) return;
      const t = Math.min(1, Math.max(0, (now - start) / ROUTE_TIME));
      const distance = t * length;
      const pos = track.getPointAtLength(distance);
      const ahead = track.getPointAtLength(Math.min(length, distance + 2));
      const behind = track.getPointAtLength(Math.max(0, distance - 2));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      icon.setAttribute('transform', "translate(" + pos.x + " " + pos.y + ") rotate(" + angle + ")");
      const next = Math.floor(t * 20) / 20;
      if (shown !== next) { shown = next; setProgress(next); }
      if (t < 1) raf = requestAnimationFrame(loop);
      else arrival = setTimeout(finish, 500);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); clearTimeout(arrival); };
  }, [finish, flight, mapReady]);

  if (!flight) return null;
  return (
    <div className="absolute inset-0 z-50 overflow-hidden" style={{ backgroundColor: '#34515e' }} data-testid="panel-flight">
      <svg viewBox={"0 0 " + MAP_WIDTH + " " + viewHeight} className="absolute inset-0 w-full h-full" aria-label={"Flight map from Denver to " + flight.place} role="img">
        <image href={FLIGHT_MAP_IMAGE} x="0" y={MAP_ART_TOP} width={MAP_ART} height={MAP_ART} />
        <path d={curve} fill="none" stroke="#1e333d" strokeWidth="8" opacity="0.8" />
        <path ref={route} d={curve} fill="none" stroke="#fff0c6" strokeWidth="4" strokeDasharray="10 8" />
        <circle cx={DENVER.x} cy={DENVER.y} r="8" fill="#92ecd0" stroke="#172a33" strokeWidth="3" />
        <circle cx={to.x} cy={to.y} r="8" fill="#ffc477" stroke="#172a33" strokeWidth="3" />
        <g ref={plane} transform={"translate(" + DENVER.x + " " + DENVER.y + ")"}>
          <path d={PLANE_PATH} transform="translate(4 6)" fill="#172a33" opacity="0.52" />
          <path d={PLANE_PATH} fill="#fff4d7" stroke="#1b2a30" strokeWidth="2" />
        </g>
      </svg>
      <div className="absolute left-1/2 -translate-x-1/2 top-[6%] text-center rounded-xl px-5 py-2" style={{ backgroundColor: 'rgba(17, 34, 42, .93)', width: 'max-content', maxWidth: '94%' }}>
        <div className="text-xs uppercase text-primary font-mono">{flight.flight} · {landing ? 'Arriving' : mapReady ? 'In flight' : 'Preparing route'}</div>
        <div className="font-pixel text-lg md:text-3xl text-cream mt-1">Denver <span className="text-primary">to</span> {flight.place}</div>
        {flight.geography && <div className="text-xs text-cream mt-1 font-mono" data-testid="flight-field-coordinates">{formatSiteCoordinates(flight.geography)}</div>}
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[7%] rounded-xl px-4 py-2 flex gap-4 font-mono text-xs text-cream whitespace-nowrap" style={{ backgroundColor: 'rgba(17, 34, 42, .93)' }}>
        <span>{Math.round((landing ? 1 : progress) * flight.distance).toLocaleString()} km</span>
        <span>{landing ? 0 : Math.max(0, Math.round((1 - progress) * flight.minutes))} min remaining</span>
        <button onClick={finish} disabled={landing} className="text-primary hover:text-cream" data-testid="button-skip-flight">Skip</button>
      </div>
    </div>
  );
}
