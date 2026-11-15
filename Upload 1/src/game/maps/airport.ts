import { audio } from '../audio';
import { openPanel, say, setStage } from '../story';
import { store } from '../store';
import { BUILDERS, type WorldScene } from '../scenes/WorldScene';
import { terminal } from './cityBuildings';
import { AIRPORT_ENTRY, AIRPORT_SIZE, destinations, flightForBoarding, pendingDestinations, type Destination } from '../config';

const { w: W, h: H } = AIRPORT_SIZE;
const CAFE_X = 1368;
const CAFE_W = 286;
const UPPER_GATE_X = [778, 1138];
const LOWER_GATE_X = [704, 1050, 1396];

function rect(s: WorldScene, x: number, y: number, w: number, h: number, color: number, depth = -885) {
  s.add.rectangle(x, y, w, h, color).setOrigin(0).setDepth(depth);
}

function runwayWindows(s: WorldScene) {
  const glass = s.add.graphics().setDepth(-575);
  const paint = (x: number, y: number, w: number, h: number, color: number) => {
    glass.fillStyle(color).fillRect(x, y, w, h);
  };
  paint(28, 20, W - 56, 155, 0x263d4c);
  paint(35, 27, W - 70, 91, 0x88b4c0);
  paint(35, 107, W - 70, 12, 0x6b918f);
  paint(35, 119, W - 70, 49, 0x667d83);
  paint(35, 148, W - 70, 20, 0x4b656f);
  for (let x = 57; x < W - 96; x += 128) paint(x, 158, 52, 4, 0xe1ceb0);
  for (const x of [125, 400, 665, 1510]) {
    paint(x, 49, 74, 8, 0xbad0cb);
    paint(x + 16, 42, 44, 9, 0xbad0cb);
  }

  for (let x = 55; x < W - 58; x += 34) {
    const h = 7 + (x * 11 % 24);
    paint(x, 107 - h, 15 + x % 12, h, 0x6d8797);
  }
  paint(1436, 101, 101, 18, 0x596e7e);
  paint(1440, 102, 91, 5, 0x9cadad);
  paint(1468, 119, 8, 20, 0x536b76);

  // Side-on aircraft behind the window frames.
  const plane = 835;
  paint(plane + 46, 137, 354, 6, 0x465d67);
  glass.fillStyle(0x33677d).fillTriangle(plane + 14, 95, plane + 42, 49, plane + 111, 99);
  glass.fillStyle(0xb9c9c1).fillTriangle(plane + 37, 92, plane + 50, 61, plane + 89, 94);
  paint(plane + 21, 93, 391, 28, 0xe3ded0);
  paint(plane + 37, 89, 355, 9, 0xf0e8d5);
  paint(plane + 15, 101, 414, 14, 0xe7e2cf);
  paint(plane + 19, 112, 401, 6, 0x547f90);
  paint(plane + 389, 98, 22, 7, 0x3d5d71);
  paint(plane + 406, 102, 9, 5, 0x3d5d71);
  for (let x = plane + 84; x < plane + 372; x += 16) paint(x, 101, 8, 6, 0x4d7182);
  glass.fillStyle(0xb0bfba).fillTriangle(plane + 187, 113, plane + 272, 113, plane + 124, 142);
  paint(plane + 170, 130, 40, 10, 0x8c9f9d);
  for (const x of [plane + 106, plane + 292]) {
    paint(x, 119, 5, 17, 0x3f5057);
    paint(x - 3, 135, 12, 8, 0x34454d);
  }
  for (let x = 35; x < W - 35; x += 204) {
    paint(x, 28, 7, 140, 0x344e5d);
    paint(x + 8, 28, 3, 140, 0xa7c0bc);
    glass.fillStyle(0xe6f3ed, 0.16).fillTriangle(x + 16, 29, x + 65, 29, x + 16, 106);
  }
  paint(30, 166, W - 60, 7, 0xb7c8c1);
}

function cafe(s: WorldScene) {
  const x = CAFE_X, w = CAFE_W;
  const floor = s.add.graphics().setDepth(-989);
  floor.fillStyle(0x889b9f, .22).fillRect(x, 276, w, 238);
  floor.lineStyle(2, 0x667b89, .68).strokeRect(x, 279, w, 232);
  for (const y of [351, 423, 495]) floor.fillStyle(0x9c9da9, .55).fillRect(x + 2, y, w - 4, 2);
  for (const dx of [71, 142, 213]) floor.fillStyle(0x9c9da9, .55).fillRect(x + dx, 281, 2, 228);

  rect(s, x + 3, 222, w - 6, 82, 0x354956, -560);
  rect(s, x + 9, 228, w - 18, 68, 0x546e7c, -559);
  rect(s, x + 9, 292, w - 18, 4, 0x8fa6a8, -558);
  rect(s, x + 38, 233, w - 76, 25, 0x243b49, -556);
  s.label('COFFEE HOUSE', x + w / 2, 245, 17, '#faebc3', -555);

  for (const dx of [26, 194]) {
    rect(s, x + dx, 265, 65, 22, 0x243a48, -556);
    rect(s, x + dx + 5, 269, 38, 2, 0xe8c796, -555);
    rect(s, x + dx + 5, 276, 26, 2, 0xa4b8b4, -555);
    rect(s, x + dx + 50, 270, 9, 10, 0xc49c66, -555);
  }

  const left = x + 17, counterW = w - 34;
  s.npc('ped3', x + 154, 352, 'ped3-idle-down', 362);
  rect(s, left, 337, counterW, 32, 0x293d4d, 366);
  rect(s, left + 3, 354, counterW - 6, 12, 0x526e7a, 367);
  rect(s, left - 2, 332, counterW + 4, 20, 0x9baaa7, 368);
  rect(s, left, 334, counterW, 12, 0xc4b0a0, 369);
  rect(s, left + 4, 346, counterW - 8, 3, 0xe0cbb1, 370);
  for (const dx of [12, 64, 116, 168, 220]) rect(s, left + dx, 356, 2, 10, 0x334954, 368);
  s.solid(left, 345, counterW, 24);
  s.groundShadow(x + w / 2, 372, counterW, 19, .2);

  // Espresso machine and cups on the service counter.
  rect(s, x + 31, 309, 47, 29, 0x263946, 372);
  rect(s, x + 35, 310, 39, 13, 0xa0aeac, 373);
  rect(s, x + 42, 323, 26, 12, 0x4d626c, 374);
  for (const dx of [44, 58]) rect(s, x + dx, 326, 8, 6, 0xe9dec5, 375);
  rect(s, x + 209, 310, 49, 26, 0x364a55, 372);
  rect(s, x + 213, 313, 41, 16, 0x78969c, 373);
  for (const dx of [216, 228, 241]) rect(s, x + dx, 323, 9, 5, 0xd0a56c, 374);
  rect(s, x + 109, 326, 17, 12, 0x364953, 373);

  for (const cx of [x + 49, x + w - 49]) {
    s.groundShadow(cx, 483, 71, 23, .2);
    rect(s, cx - 35, 436, 70, 19, 0x334b56, 469);
    rect(s, cx - 31, 438, 62, 12, 0x698789, 470);
    rect(s, cx - 27, 467, 54, 16, 0x3d4a54, 481);
    rect(s, cx - 30, 458, 60, 15, 0xa28f81, 482);
    rect(s, cx - 27, 459, 54, 9, 0xc4af97, 483);
    rect(s, cx - 12, 461, 8, 5, 0xf2dfbc, 484);
    rect(s, cx + 9, 461, 7, 5, 0xe3d7c5, 484);
    s.solid(cx - 30, 459, 60, 23);
  }
  s.interact('coffee-house', x + w / 2, 390, 62, 'Talk to Barista', () => say([
    { speaker: 'staff', name: 'Airport Barista', portrait: 'ped3', text: 'Coffee and a seat while you wait. Follow the concourse signs to your gate.' },
  ]));
}

const gateLetters: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17], C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17], Y: [17, 17, 10, 4, 4, 4, 4],
};

function gateDisplay(s: WorldScene, x: number, y: number, place: string, gate: number) {
  const depth = -548;
  rect(s, x - 124, y + 3, 248, 41, 0x35454d, depth);
  rect(s, x - 124, y, 248, 37, 0x101719, depth + 1);
  rect(s, x - 122, y + 2, 244, 2, 0x3a5452, depth + 2);
  rect(s, x - 116, y + 8, 26, 21, 0x1c342f, depth + 2);
  s.label(String(gate), x - 103, y + 18, 15, '#b7ffb4', depth + 3);

  const letters = [...place.toUpperCase()];
  const led = s.add.graphics().setDepth(depth + 3);
  const gap = letters.length > 17 ? 1 : 2;
  const advance = 10 + gap;
  const width = letters.reduce((sum, letter) => sum + (letter === ' ' ? 6 : advance), 0) - gap;
  let left = x + 15 - Math.floor(width / 2);
  led.fillStyle(0x90fa87);
  for (const letter of letters) {
    gateLetters[letter]?.forEach((row, dy) => {
      for (let dx = 0; dx < 5; dx++) {
        if (row & (16 >> dx)) led.fillRect(left + dx * 2, y + 12 + dy * 2, 2, 2);
      }
    });
    left += letter === ' ' ? 6 : advance;
  }
}

function drawGate(s: WorldScene, destination: Destination) {
  const { gate: n, place } = destination;
  const upper = n <= 2;
  const x = upper ? UPPER_GATE_X[n - 1] : LOWER_GATE_X[n - 3];
  const opening = upper ? 338 : 634;
  const top = upper ? 215 : opening;
  const bottom = upper ? opening : 760;
  const matches = () => !!flightForBoarding(store.get().game, destination.id);

  rect(s, x - 70, top, 140, bottom - top, 0x475769, -985);
  for (let tile = top + 24; tile < bottom; tile += 24) {
    rect(s, x - 70, tile, 140, 2, 0x576c7b, -984);
  }
  for (const side of [-1, 1]) {
    const wall = x + side * 82 - 12;
    rect(s, wall, top, 24, bottom - top, 0x394c5d, -982);
    rect(s, wall + 4, top, 16, bottom - top, 0x658696, -981);
    rect(s, wall + 5, top, 3, bottom - top, 0x9db6bf, -980);
    s.solid(wall, top, 24, bottom - top);
  }
  const end = upper ? top : bottom - 12;
  rect(s, x - 70, end, 140, 12, 0x303f50, -979);
  s.solid(x - 70, end, 140, 12);

  // Draw a lintel and open glass leaves around a walkable threshold.
  rect(s, x - 76, opening - 52, 152, 54, 0x354c60, -978);
  rect(s, x - 96, opening - 63, 192, 14, 0x344a5c, opening + 1);
  rect(s, x - 96, opening - 63, 192, 4, 0x9bb6bd, opening + 2);
  for (const post of [x - 96, x + 76]) {
    rect(s, post, opening - 50, 20, 51, 0x354d62, opening + 1);
    rect(s, post + 4, opening - 49, 11, 48, 0x81a7b6, opening + 2);
    s.groundShadow(post + 11, opening + 2, 29, 14);
    s.solid(post, opening - 9, 20, 13);
  }
  for (const leaf of [x - 76, x + 58]) {
    rect(s, leaf, opening - 49, 18, 48, 0x31556b, opening + 2);
    rect(s, leaf + 2, opening - 46, 14, 35, 0x72a6b1, opening + 3);
    rect(s, leaf + 2, opening - 42, 14, 3, 0xaed0d3, opening + 4);
  }
  rect(s, x - 58, opening - 3, 116, 6, 0xacbfc2, -977);
  const direction = upper ? -1 : 1;
  const arrows = s.add.graphics().setDepth(-976);
  arrows.fillStyle(0xb7d8cc).fillTriangle(x - 12, opening + direction * 29, x + 12, opening + direction * 29, x, opening + direction * 44);
  gateDisplay(s, x, upper ? top - 18 : bottom - 40, place, n);
  s.interact('gate-' + n, x, upper ? opening - 15 : opening + 43, upper ? 54 : 65, () => matches() ? 'Board Flight · ' + place : 'Gate ' + n + ' · ' + place, () => {
    if (matches()) { audio.play('boarding'); openPanel('flight', { flightDestination: destination.id }); return; }
    say([{ speaker: 'staff', name: 'Gate Agent', portrait: 'staff', text: `Get a boarding pass to ${place} at a ticket kiosk.` }]);
  });
  return { x: x - 94, y: top, w: 188, h: bottom - top, label: 'Gate ' + n, kind: 'zone' as const };
}

export function buildAirport(s: WorldScene) {
  s.floor('terrazzo', 0, 0, W, H);
  s.wallFace('wp-air', 0, 0, W, 210);
  runwayWindows(s);
  s.solid(0, 0, W, 210);
  rect(s, 0, 210, W, H - 210, 0xd1c4c4, -998);
  for (let y = 210; y < H; y += 72) {
    const h = Math.min(72, H - y);
    rect(s, 0, y, W, 2, 0xaaa3b2, -996);
    for (let x = (y - 210) % 144 === 0 ? 0 : 49; x < W; x += 98) {
      rect(s, x, y, 2, h, 0xb4aab6, -996);
      rect(s, x + 3, y + 3, Math.min(94, W - x - 3), 2, 0xe1d4cd, -996);
    }
  }
  for (const x of [36, 410, 820, 1240, 1652]) {
    rect(s, x, 17, 24, 189, 0x9992a5, -573);
    rect(s, x + 4, 17, 6, 189, 0xc7b7b2, -572);
    rect(s, x - 3, 192, 30, 12, 0x696a81, -572);
    rect(s, x + 19, 20, 8, 173, 0x4d5268, -572);
    s.groundShadow(x + 17, 214, 49, 18);
  }
  for (const x of [110, 515, 924, 1331]) {
    s.add.rectangle(x, 210, 84, 460, 0xffe5bd, 0.11).setOrigin(0, 0).setDepth(-992);
    s.add.rectangle(x + 13, 210, 6, 373, 0xfff6d7, 0.17).setOrigin(0, 0).setDepth(-991);
  }

  s.deco('board', 355, 201, 3, -550);
  s.label('DEPARTURES', 355, 94, 14, '#f3e6cf', -549);
  destinations.forEach(({ flight, code, gate }, i) => {
    s.label(flight + '  ' + code + '  GATE ' + gate, 355, 115 + i * 15, 12, '#f3e6cf', -549);
  });
  for (const x of [161, 262]) {
    s.npc('staff', x, 405, 'staff-idle-down', 404);
    s.pix('checkin', x, 0, { topY: 366, scale: 2.15, foot: 39, footW: 0.88 });
  }
  rect(s, 111, 297, 205, 34, 0x263849, 332);
  rect(s, 114, 299, 199, 28, 0x334667, 333);
  s.label('CHECK-IN', 214, 313, 19, '#f6e6c5', 334);
  for (const x of [113, 301]) s.pix('barrier', x, 507, { scale: 1.5, foot: 13 });
  for (const x of [80, 325]) s.pix('planter', x, 457, { scale: 2, foot: 18 });
  s.interact('staff', 214, 466, 73, 'Talk to Agent', () => {
    const passes = pendingDestinations(store.get().game);
    say([{ speaker: 'staff', name: 'Check-In Agent', portrait: 'staff', text: passes.length
      ? `Your passes are for ${passes.map(({ place, gate }) => `${place} (Gate ${gate})`).join(', ')}.`
      : 'You can book passes for all destinations at the ticket kiosks.' }]);
  });
  rect(s, 352, 251, 211, 36, 0x334667, 401);
  s.label('SELF-SERVICE TICKETS', 458, 269, 16, '#f6e6c5', 402);
  for (const x of [383, 458, 532]) {
    s.pix('kiosk', x, 389, { foot: 24 });
    s.interact('kiosk-' + x, x, 415, 57,
      'Buy or View Tickets',
      () => openPanel('booking'));
  }

  const gateAreas = destinations.map((destination) => drawGate(s, destination));
  cafe(s);
  rect(s, 620, 426, 695, 4, 0x749294, -988);
  rect(s, 620, 487, 695, 4, 0x749294, -988);
  s.label('↑  GATES 1–2      GATES 3–5  ↓', 958, 457, 16, '#395969', -980);
  const benches = [
    { x: 285, y: 568, passenger: 'ped1', seatOffset: 34 },
    { x: 505, y: 568, passenger: 'ped2', seatOffset: -38 },
    { x: 285, y: 674 },
    { x: 505, y: 674, passenger: 'ped3', seatOffset: 34 },
    { x: 1581, y: 674, passenger: 'ped1', seatOffset: -38 },
  ];
  benches.forEach(({ x, y, passenger, seatOffset = 0 }, i) => {
    s.pix('airbench', x, y, { foot: 22 });
    if (!passenger) return;
    const seatX = x + seatOffset;
    const seated = passenger + '-seat';
    s.npc(seated, seatX, y - 4, seated, y + 1);
    s.interact('traveler-' + i, seatX, y + 24, 34, 'Talk to Traveler', () => say([
      { speaker: 'staff', name: 'Traveler', portrait: passenger, text: 'Have a good flight!' },
    ]));
  });
  for (const [x, y] of [[172, 568], [590, 575], [1652, 608]]) {
    s.pix('luggage', x, y, { foot: 10 });
  }
  for (const [x, y] of [[53, 322], [W - 48, 301], [53, H - 34], [W - 48, H - 34]]) {
    s.add.ellipse(x, y - 3, 45, 13, 0x343844, 0.22).setDepth(y - 1);
    s.pix('airport-vase', x, y, { scale: 2, foot: 17 });
  }

  for (const [left, right, y, key] of [[420, 660, 619, 'ped2'], [690, 1260, 462, 'ped3']] as const) {
    const walker = s.npc(key, left, y, key + '-walk-right');
    let direction = 1;
    s.updaters.push((dt) => {
      walker.x = Math.max(left, Math.min(right, walker.x + direction * 66 * dt));
      if (walker.x === right) direction = -1;
      if (walker.x === left) direction = 1;
      walker.play(key + '-walk-' + (direction > 0 ? 'right' : 'left'), true).setDepth(y);
    });
  }

  s.flat('mat', 150, H - 10);
  s.interact('exit', 150, H - 40, 90, 'Exit to City', () => s.goto('city', terminal.doorX, terminal.approachY + 39, false));
  if (store.get().game.stage === 'city') setStage('book');

  return {
    w: W, h: H, name: 'Front Range Regional Airport', zoom: 1.38, bg: 0x1a1d22, mood: 'airport' as const,
    spawn: { ...AIRPORT_ENTRY, dir: 'up' as const },
    outline: [
      { x: 108, y: 297, w: 209, h: 151, label: 'Check-in', kind: 'building' as const },
      { x: 352, y: 251, w: 211, h: 151, label: 'Tickets', kind: 'zone' as const },
      ...gateAreas,
      { x: CAFE_X, y: 230, w: CAFE_W, h: 292, label: 'Coffee House', kind: 'building' as const },
      { x: 620, y: 426, w: 695, h: 65, label: 'Departure Concourse', kind: 'path' as const },
      { x: 40, y: H - 115, w: 220, h: 100, label: 'City Exit', kind: 'zone' as const },
    ],
  };
}
BUILDERS.airport = buildAirport;
