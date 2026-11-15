import { audio } from '../audio';
import { AIRPORT_ENTRY } from '../config';
import { journal, saveProgress, toast } from '../story';
import { store, type FieldMap } from '../store';
import type { OutlineItem, WorldScene } from '../scenes/WorldScene';

export type TrailPoint = { x: number; y: number };

// Trim the straight legs and join them with a quadratic curve tangent to both.
export function roundTrail(nodes: readonly (readonly [number, number])[], radius: number): TrailPoint[] {
  const track: TrailPoint[] = [{ x: nodes[0][0], y: nodes[0][1] }];
  for (let i = 1; i < nodes.length - 1; i++) {
    const [x, y] = nodes[i];
    const trim = ([ox, oy]: readonly [number, number]) => {
      const length = Math.hypot(ox - x, oy - y);
      const fraction = length ? Math.min(0.48, radius / length) : 0;
      return { x: x + (ox - x) * fraction, y: y + (oy - y) * fraction };
    };
    const start = trim(nodes[i - 1]), end = trim(nodes[i + 1]);
    for (let step = 0; step <= 12; step++) {
      const t = step / 12, u = 1 - t;
      track.push({ x: u * u * start.x + 2 * u * t * x + t * t * end.x, y: u * u * start.y + 2 * u * t * y + t * t * end.y });
    }
  }
  const [x, y] = nodes[nodes.length - 1];
  track.push({ x, y });
  return track;
}

export function nearestTrailPoint(track: readonly TrailPoint[], [x, y]: readonly [number, number]): readonly [number, number] {
  let nearest = track[0], shortest = Infinity;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    if (!length) continue;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length));
    const point = { x: a.x + dx * t, y: a.y + dy * t };
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < shortest) { nearest = point; shortest = distance; }
  }
  return [nearest.x, nearest.y];
}

export function fieldExit(s: WorldScene, x: number, mapHeight: number): OutlineItem {
  const y = mapHeight - 12;
  const markings = s.add.graphics().setDepth(-925);
  for (const top of [y - 34, y - 17]) {
    markings.lineStyle(4, 0xece1c2, 0.86).strokePoints([
      { x: x - 12, y: top }, { x, y: top + 9 }, { x: x + 12, y: top },
    ], false);
  }
  s.interact('field-exit', x, y, 42, 'Return to Denver Airport', () => {
    s.goto('airport', AIRPORT_ENTRY.x, AIRPORT_ENTRY.y, false);
  });
  return { x: x - 40, y: mapHeight - 38, w: 80, h: 38, label: 'Denver Airport Exit', kind: 'path' };
}

const TRAVEL_CASH = 450;

export function travelCashPickup(s: WorldScene, map: FieldMap, x: number, y: number): OutlineItem {
  const flag = 'travel-cash-collected:' + map;
  const crate = s.add.graphics().setDepth(y);
  const marker = s.label('$', x, y - 54, 22, '#ffda77', y + 1);
  const paint = (collected: boolean) => {
    crate.clear();
    crate.fillStyle(0x302b32, 0.32).fillEllipse(x, y + 1, 61, 15);
    crate.fillStyle(0x293543).fillRect(x - 25, y - 29, 50, 29);
    crate.fillStyle(0x607481).fillRect(x - 23, y - 25, 46, 19);
    crate.fillStyle(0x435865).fillRect(x - 23, y - 12, 46, 8);
    crate.fillStyle(collected ? 0x77878a : 0xe7b64e).fillRect(x - 23, y - 27, 46, 5);
    crate.fillStyle(collected ? 0xa4aeab : 0xffdf87).fillRect(x - 4, y - 22, 8, 10);
    marker.setVisible(!collected);
  };
  paint(!!store.get().game.flags[flag]);
  s.solid(x - 24, y - 12, 48, 13);
  s.interact(flag, x, y + 16, 62, () => store.get().game.flags[flag] ? null : `Collect Travel Cash · ${TRAVEL_CASH} USD`, () => {
    const game = store.get().game;
    if (game.flags[flag]) return;
    store.game({ wallet: game.wallet + TRAVEL_CASH, flags: { ...game.flags, [flag]: true } });
    journal('Collected ' + TRAVEL_CASH + ' USD in travel cash.');
    toast('Travel cash · +' + TRAVEL_CASH + ' USD');
    audio.play('reward');
    paint(true);
    saveProgress();
  });
  return { x: x - 27, y: y - 34, w: 54, h: 43, kind: 'site', label: 'Travel Cash' };
}
