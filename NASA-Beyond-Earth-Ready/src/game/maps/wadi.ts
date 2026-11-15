import type Phaser from 'phaser';
import type { Dir } from '../art/characters';
import { openPanel, say, setStage } from '../story';
import { store } from '../store';
import { FIELD_RINGS } from '../fieldLayout';
import { BUILDERS, type OutlineItem, type WorldScene } from '../scenes/WorldScene';
import { fieldExit, nearestTrailPoint, roundTrail, travelCashPickup, type TrailPoint } from './fieldTravel';
import { fieldEquipmentRing } from './fieldStation';

const W = 3050, H = 2320;
const exitX = 732;

function buildDesertTextures(s: WorldScene) {
  const draw = (key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
    if (s.textures.exists(key)) return;
    const texture = s.textures.createCanvas(key, width, height)!;
    paint(texture.getContext());
    texture.refresh();
  };

  draw('wadi-cactus', 32, 43, (ctx) => {
    ctx.fillStyle = '#243b37';
    ctx.fillRect(12, 3, 10, 38);
    ctx.fillRect(14, 1, 6, 3);
    ctx.fillRect(3, 11, 7, 17);
    ctx.fillRect(6, 22, 9, 7);
    ctx.fillRect(24, 8, 6, 18);
    ctx.fillRect(20, 20, 8, 8);
    ctx.fillStyle = '#52784f';
    ctx.fillRect(14, 4, 6, 35);
    ctx.fillRect(5, 12, 3, 13);
    ctx.fillRect(6, 24, 8, 3);
    ctx.fillRect(26, 9, 2, 14);
    ctx.fillRect(20, 22, 7, 3);
    ctx.fillStyle = '#88a66b';
    ctx.fillRect(15, 5, 2, 32);
    ctx.fillRect(5, 13, 1, 11);
    ctx.fillRect(26, 11, 1, 11);
    ctx.fillStyle = '#d9c88e';
    for (const [x, y] of [[18, 10], [15, 16], [19, 21], [14, 28], [18, 34], [5, 17], [27, 16]]) ctx.fillRect(x, y, 1, 1);
  });

  draw('wadi-tumbleweed', 30, 30, (ctx) => {
    const sticks = [
      [[3, 10], [8, 4], [20, 3], [26, 10], [27, 19], [22, 25], [13, 27], [5, 22], [3, 10]],
      [[5, 8], [14, 10], [18, 21], [25, 23]], [[9, 3], [10, 17], [5, 21]],
      [[18, 3], [14, 11], [13, 24]], [[26, 11], [16, 14], [7, 22]],
      [[4, 13], [19, 18], [25, 13]], [[10, 5], [23, 8], [18, 17], [20, 24]],
      [[5, 16], [14, 15], [24, 6]], [[8, 25], [12, 20], [24, 20], [27, 17]],
    ];
    sticks.forEach((points, i) => {
      ctx.strokeStyle = i % 3 === 0 ? '#70492d' : i % 3 === 1 ? '#ab7543' : '#d29d60';
      ctx.lineWidth = i === 0 ? 2 : 1.5;
      ctx.beginPath();
      points.forEach(([x, y], n) => n === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.stroke();
    });
  });
}

function drawDesert(s: WorldScene) {
  let seed = 11;
  const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 125; i++) {
    const x = 45 + random() * (W - 90), y = 60 + random() * (H - 120);
    s.add.ellipse(x, y, 20 + random() * 95, 2 + random() * 7, 0x844729, 0.08).setDepth(-930);
  }

  for (let i = 0; i < 47; i++) {
    const x = 130 + random() * (W - 260), y = 140 + random() * (H - 280);
    if (nearResearchRing(x, y) ||
        (x < 1400 && y < 890) || (x > 1920 && y < 815) ||
        (x >= stableYard.x - 35 && y >= stableYard.y - 35) || distanceToRoad(x, y) < roadWidth / 2 + 30 ||
        (x < 106 || x > 2800 || (y < 200 && x > 1310)) ||
        (x > 650 && x < 880 && y > 1180 && y < 1400) ||
        (x < motorCourt.x + motorCourt.w + 28 && y > 1930)) continue;
    if (i % 3 === 0) {
      s.add.ellipse(x, y - 3, 37, 11, 0x633f2c, 0.24).setDepth(y - 1);
      s.pix('wadi-cactus', x, y, { scale: 1.6 + random() * 1.2, foot: 14, footW: 0.3, flipX: i % 2 === 0 });
    } else {
      s.flat('shrub', x, y, 1.2 + random());
    }
  }

  for (const [i, lane] of [740, 1310, 1830, 2190].entries()) {
    const span = 2770;
    let position = 470 + i * 690;
    let angle = 0;
    const weed = s.add.image(0, lane, 'wadi-tumbleweed').setScale(2.05);
    const shadow = s.add.ellipse(0, lane, 43, 9, 0x633c2a, 0.23);
    const dust = s.add.ellipse(0, lane, 34, 8, 0xe5ab72, 0.24);
    const move = (dt: number) => {
      const distance = dt * (84 + i * 11);
      position = (position + distance) % span;
      angle = (angle + distance / 29) % (Math.PI * 2);
      const x = position + 100, y = lane + Math.sin(position / 145) * 21;
      const bounce = Math.abs(Math.sin(angle * 1.6)) * 12;
      shadow.setPosition(x, y).setDepth(Math.round(y) - 2);
      dust.setPosition(x - 26, y - 3).setDepth(Math.round(y) - 1).setAlpha(0.1 + bounce / 100);
      weed.setPosition(x, y - 29 - bounce).setRotation(angle).setDepth(Math.round(y));
    };
    move(0);
    s.updaters.push(move);
  }
}

const trailNodes = [
  [[596, 748], [596, 880], [585, 1030], [585, 1680], [618, 1790], [740, 1880], [1390, 1880], [1508, 1864], [1665, 1770], [2350, 1770], [2500, 1740], [2690, 1640], [2794, 1640]],
  [[2155, 1770], [2155, 1620], [2020, 1510], [2020, 1200], [2130, 1090], [2620, 1090], [2805, 940], [2805, 818]],
  [[2750, 1640], [2750, 1810], [2700, 1890], [2700, 1940]],
  [[740, 1880], [exitX, 2040], [exitX, H]],
] as const;
const roadWidth = 124;
const bubbleCamp = { x: 103, y: 126, w: 1255, h: 716 };
const stableYard = { x: 2450, y: 1960, w: 463, h: 310 };
const fieldLab = { x: 468, y: 2130 };
const motorCourt = { x: 800, y: 1948, w: 852, h: 354 };
const parkingBays = Array.from({ length: 7 }, (_, i) => ({ x: 870 + i * 118, y: 2220 }));
const bmwBay = parkingBays[2];
const parkingDriveX = parkingBays[5].x;
const reception = { x: 724, y: 1324, w: 108, h: 91 };
const cornCart = { x: 2650, y: 1773 };
const nearResearchRing = (x: number, y: number) =>
  Math.abs(x - FIELD_RINGS.wadi.x) < FIELD_RINGS.wadi.radiusX + 80 &&
  Math.abs(y - FIELD_RINGS.wadi.y) < FIELD_RINGS.wadi.radiusY + 76;
const campDomes = [
  { x: 278, y: 305 }, { x: 555, y: 292 }, { x: 835, y: 292 }, { x: 1130, y: 305 },
  { x: 246, y: 550 }, { x: 990, y: 520 }, { x: 1230, y: 684 },
];

const mainTrack = roundTrail(trailNodes[0], 158);
const trails = [mainTrack, ...trailNodes.slice(1).map(([start, ...rest]) =>
  roundTrail([nearestTrailPoint(mainTrack, start), ...rest], 135))];

function distanceToRoad(x: number, y: number, tracks = trails) {
  let nearest = Infinity;
  for (const track of tracks) {
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1], b = track[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const lengthSquared = dx * dx + dy * dy;
      if (!lengthSquared) continue;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSquared));
      nearest = Math.min(nearest, Math.hypot(x - a.x - dx * t, y - a.y - dy * t));
    }
  }
  return nearest;
}

function sampleTrail(track: TrailPoint[], spacing: number, offset: number, draw: (x: number, y: number, nx: number, ny: number) => void) {
  let next = offset;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    for (; next < length; next += spacing) {
      draw(a.x + dx * next / length, a.y + dy * next / length, -dy / length, dx / length);
    }
    next -= length;
  }
}

function lantern(s: WorldScene, x: number, y: number, radius = 104) {
  const g = s.add.graphics().setDepth(y);
  g.fillStyle(0x0e1421).fillRect(x - 5, y - 30, 10, 30);
  g.fillStyle(0xf6b667).fillRect(x - 6, y - 27, 12, 11);
  g.fillStyle(0xffe3a5).fillRect(x - 3, y - 25, 6, 8);
  g.fillStyle(0x4b3332).fillRect(x - 8, y - 31, 16, 4);
  s.glow(x, y - 16, radius, 0xffab59, 0.34);
}

function cacheTerrain(s: WorldScene, graphics: Phaser.GameObjects.Graphics, key: string) {
  const depth = graphics.depth;
  if (!s.textures.exists(key)) graphics.generateTexture(key, W, H);
  graphics.destroy();
  s.add.image(0, 0, key).setOrigin(0).setDepth(depth);
}

function drawNightTrails(s: WorldScene) {
  const road = s.add.graphics().setDepth(-940);
  for (const [width, color] of [[roadWidth + 12, 0x71474a], [roadWidth, 0xc08770], [roadWidth - 12, 0xaa6d5c]]) {
    road.lineStyle(width, color);
    road.fillStyle(color);
    for (const track of trails) {
      road.strokePoints(track, false);
      for (const { x, y } of track) road.fillCircle(x, y, width / 2);
    }
  }

  const bricks = road;
  bricks.lineStyle(2, 0x794c4e, 0.54);
  const lamps: TrailPoint[] = [];
  for (const [index, track] of trails.entries()) {
    const otherTracks = trails.filter((_, i) => i !== index);
    for (const side of [-1, 1]) {
      sampleTrail(track, 37, side === 1 ? 32 : 14, (x, y, nx, ny) => {
        if (x > W + roadWidth || distanceToRoad(x, y, otherTracks) < roadWidth * 0.85) return;
        bricks.lineBetween(x + nx * side * 3, y + ny * side * 3, x + nx * side * 52, y + ny * side * 52);
      });
      sampleTrail(track, 290, side === 1 ? 270 : 400, (x, y, nx, ny) => {
        const lx = Math.round(x + nx * side * 109), ly = Math.round(y + ny * side * 109);
        if (lx < 100 || lx > 2835 || (ly < 1010 && lx < 1410) || (ly < 1415 && lx < 875) ||
            (ly > stableYard.y - 50 && lx > stableYard.x - 70) ||
            (ly > motorCourt.y - 30 && lx > motorCourt.x - 30 && lx < motorCourt.x + motorCourt.w + 30) ||
            (ly > 1840 && Math.abs(lx - parkingDriveX) < 88)) return;
        if ([0, 15, 30].some((height) => distanceToRoad(lx, ly - height) < roadWidth / 2 + 17) ||
            nearResearchRing(lx, ly) ||
            lamps.some((lamp) => Math.hypot(lamp.x - lx, lamp.y - ly) < 120)) return;
        lamps.push({ x: lx, y: ly });
        lantern(s, lx, ly, 124);
      });
    }
  }
  cacheTerrain(s, road, 'wadi-roads');
}

function drawDesertEdges(s: WorldScene): OutlineItem[] {
  const art = s.add.graphics().setDepth(-936);
  const shape = (color: number, points: TrailPoint[]) => art.fillStyle(color).fillPoints(points, true);
  const west: TrailPoint[] = Array.from({ length: 39 }, (_, i) => ({
    x: Math.round(77 + 19 * Math.sin(i * 0.73) + 11 * Math.cos(i * 1.48)), y: Math.min(H, i * 62),
  }));
  const east: TrailPoint[] = Array.from({ length: 37 }, (_, i) => ({
    x: Math.round(2893 + 16 * Math.sin(i * 0.67) + 12 * Math.cos(i * 1.23) + (i >= 29 ? 19 : 0)), y: Math.min(H, i * 66),
  }));
  const northPass: TrailPoint[] = [[1285, 35], [1370, 90], [1460, 134], [1580, 146], [1670, 121], [1795, 158], [1905, 126], [1990, 71], [2050, 40]]
    .map(([x, y]) => ({ x, y }));

  function drawRavine(edge: TrailPoint[], side: 'north' | 'east') {
    const offset = (point: TrailPoint, amount: number) => side === 'east'
      ? { x: point.x + amount, y: point.y } : { x: point.x, y: point.y + amount };
    const sign = side === 'east' ? 1 : -1;
    const far = side === 'east' ? [{ x: W + 30, y: H }, { x: W + 30, y: 0 }]
      : [{ x: edge[edge.length - 1].x, y: -30 }, { x: edge[0].x, y: -30 }];
    shape(0x43303e, [...edge, ...far]);
    const layers = [[0, 11, 0xd39a71], [11, 24, 0x9b674f], [24, 37, 0x744b49], [37, 48, 0x573a43]];
    for (const [from, to, color] of layers) {
      shape(color, [...edge.map((p) => offset(p, from * sign)), ...edge.slice().reverse().map((p) => offset(p, to * sign))]);
    }
    for (let i = 1; i < edge.length; i++) {
      const a = edge[i - 1], b = edge[i];
      shape(i % 2 ? 0x8d584b : 0xaa7156, [offset(a, sign * 14), offset(b, sign * 14), offset(b, sign * (28 + i % 4 * 5))]);
      art.lineStyle(2, 0xf0b485, 0.7).lineBetween(a.x, a.y, b.x, b.y);
      if (side === 'east') s.solid(Math.min(a.x, b.x), a.y, W - Math.min(a.x, b.x), b.y - a.y + 1);
      else s.solid(a.x, 0, b.x - a.x + 1, Math.max(a.y, b.y));
    }
  }
  drawRavine(east, 'east');
  drawRavine(northPass, 'north');
  const channel = east.map((point, i) => ({ x: point.x + 74 + Math.sin(i * 0.59) * 14, y: point.y }));
  art.lineStyle(24, 0x58404d, 0.9).strokePoints(channel, false);
  art.lineStyle(5, 0x8c645a, 0.42).strokePoints(channel.map((p) => ({ x: p.x - 8, y: p.y })), false);
  const farBank = east.map((point, i) => ({ x: Math.min(W, point.x + 119 + Math.cos(i * 0.66) * 10), y: point.y }));
  shape(0x745050, [...farBank, { x: W, y: H }, { x: W, y: 0 }]);
  art.lineStyle(3, 0xa57865, 0.66).strokePoints(farBank, false);

  const northMountains = [{ x: 0, y: 81 }, { x: 188, y: 103 }, { x: 361, y: 78 }, { x: 573, y: 89 },
    { x: 766, y: 76 }, { x: 934, y: 100 }, { x: 1129, y: 83 }, { x: 1250, y: 103 }, { x: 1340, y: 74 }];
  shape(0x76534f, [{ x: 0, y: 0 }, { x: 1340, y: 0 }, ...northMountains.slice().reverse()]);
  s.solid(2015, 0, W - 2015, 96);
  for (let i = 1; i < northMountains.length; i++) {
    const a = northMountains[i - 1], b = northMountains[i], peak = { x: a.x + (b.x - a.x) * 0.59, y: 8 + i % 3 * 13 };
    shape(i % 2 ? 0xae7c60 : 0x976754, [a, peak, b]);
    shape(0x69484a, [peak, b, { x: a.x + (b.x - a.x) * 0.42, y: b.y - 12 }]);
    art.lineStyle(2, 0xe3aa7d, 0.65).lineBetween(peak.x - 25, peak.y + 21, peak.x, peak.y);
    s.solid(a.x, 0, b.x - a.x + 1, Math.max(a.y, b.y) - 5);
  }

  shape(0x63454a, [{ x: 0, y: 0 }, ...west, { x: 0, y: H }]);
  for (let i = 1; i < west.length; i++) {
    const a = west[i - 1], b = west[i];
    const peak = { x: 10 + (i * 17) % 30, y: a.y - 32 + (i * 31) % 30 };
    shape(i % 2 ? 0xa97559 : 0x916250, [peak, { x: a.x - 12, y: a.y + 6 }, b, { x: 0, y: b.y - 18 }]);
    shape(0x704d4c, [peak, b, { x: b.x * 0.54, y: b.y - 12 }]);
    art.lineStyle(2, 0xc58d67, 0.7).lineBetween(peak.x, peak.y, a.x - 12, a.y + 6);
    s.solid(0, a.y, Math.max(a.x, b.x), b.y - a.y + 1);
  }
  cacheTerrain(s, art, 'wadi-border');
  return [
    { x: 2885, y: 0, w: W - 2885, h: H, label: 'East Ravine', kind: 'water', shape: 'polygon', points: [...east, { x: W, y: H }, { x: W, y: 0 }] },
    { x: 1340, y: 0, w: 620, h: 135, label: 'North Ravine', kind: 'water', shape: 'polygon', points: [...northPass, { x: 2050, y: 0 }, { x: 1285, y: 0 }] },
    { x: 0, y: 0, w: 90, h: H, kind: 'building', shape: 'polygon', points: [{ x: 0, y: 0 }, ...west, { x: 0, y: H }] },
    { x: 0, y: 0, w: 1340, h: 100, kind: 'building', shape: 'polygon', points: [{ x: 0, y: 0 }, { x: 1340, y: 0 }, ...northMountains.slice().reverse()] },
  ];
}

function drawCampReception(s: WorldScene) {
  const { x, y } = reception;
  const sand = s.add.graphics().setDepth(-938);
  sand.fillStyle(0xd79c75, 0.32).fillEllipse(720, 1372, 320, 168);
  sand.fillStyle(0x987054, 0.52).fillRoundedRect(634, 1358, 145, 34, 13);
  const desk = s.add.graphics().setDepth(y + 67);
  desk.fillStyle(0x614448, 0.5).fillEllipse(x + 51, y + 65, 117, 34);
  desk.fillStyle(0x5f4145).fillRoundedRect(x + 4, y + 39, 93, 28, 3);
  desk.fillStyle(0xa57252).fillRect(x + 8, y + 42, 85, 19);
  for (let dx = 16; dx < 91; dx += 13) desk.fillStyle(0x815545).fillRect(x + dx, y + 44, 3, 15);
  desk.fillStyle(0x5c4143).fillRoundedRect(x, y + 23, 101, 22, 4);
  desk.fillStyle(0xc38f63).fillRoundedRect(x + 3, y + 24, 95, 16, 3);
  desk.fillStyle(0xdbab77).fillRect(x + 6, y + 25, 88, 2);
  desk.fillStyle(0xe3c79c).fillRect(x + 65, y + 28, 20, 10);
  desk.fillStyle(0x836c63).fillRect(x + 69, y + 31, 12, 2);
  desk.fillStyle(0x513944).fillRect(x + 16, y - 26, 6, 59);
  desk.fillStyle(0x543b46).fillRoundedRect(x + 16, y - 39, 85, 22, 4);
  desk.fillStyle(0xc39269).fillRect(x + 20, y - 37, 77, 17);
  s.label('RECEPTION', x + 58, y - 29, 11, '#fff0ce', y + 68);
  s.npc('wadi-guest-32', x + 47, y + 32, 'wadi-guest-32-idle-down');
  s.solid(x + 4, y + 39, 93, 28);
  s.interact('bubble-reception', x + 51, y + 83, 54, 'Bubble Camp Reception', () => say([
    { speaker: 'staff', name: 'Camp Receptionist', portrait: 'wadi-guest-32', text: 'Welcome to Bubble Camp! Follow the colored lights up the path.' },
  ]));

  const colors = [0xf77567, 0x8ce29d, 0xffd575, 0x77c9f5];
  const rows = [1260, 1128, 996, 864];
  for (const py of rows) {
    const poles = s.add.graphics().setDepth(py + 6);
    const top = py - 103;
    const wire = Array.from({ length: 17 }, (_, i) => ({
      x: 497 + i * 11, y: top + Math.sin(Math.PI * i / 16) * 21,
    }));
    for (const px of [497, 673]) {
      poles.fillStyle(0x463844, 0.42).fillEllipse(px, py + 1, 25, 9);
      poles.fillStyle(0x4b343c).fillRect(px - 5, top - 4, 10, 109);
      poles.fillStyle(0xaf7958).fillRect(px - 3, top - 4, 3, 105);
      poles.fillStyle(0x74504b).fillRect(px - 8, top - 5, 16, 5);
      s.solid(px - 5, py - 4, 10, 10);
    }
    poles.lineStyle(2, 0x4b3443).strokePoints(wire, false);
    for (let i = 1; i < wire.length - 1; i += 2) {
      const bulb = wire[i], color = colors[(i - 1) / 2 % colors.length];
      poles.fillStyle(0x473540).fillRect(bulb.x - 2, bulb.y, 4, 4);
      poles.fillStyle(color).fillRoundedRect(bulb.x - 3, bulb.y + 3, 6, 7, 2);
      poles.fillStyle(0xffefcc, 0.85).fillRect(bulb.x - 1, bulb.y + 5, 2, 2);
      s.glow(bulb.x, bulb.y + 7, 22, color, 0.28);
    }
  }
}

function drawBubbleCamp(s: WorldScene) {
  const sand = s.add.graphics().setDepth(-950);
  // Broken patches of warm sand fade into the surrounding desert.
  for (const [x, y, width, height] of [[383, 304, 532, 277], [978, 350, 641, 326], [588, 581, 764, 287], [1051, 604, 567, 241]]) {
    sand.fillStyle(0xc6916a, 0.16).fillEllipse(x, y, width, height);
    sand.fillStyle(0xe4ac7c, 0.12).fillEllipse(x - 20, y + 18, width * 0.86, height * 0.79);
  }
  for (let i = 0; i < 120; i++) {
    const x = 112 + (i * 149) % 1218;
    const y = 174 + (i * 173) % 650;
    sand.fillStyle(i % 2 ? 0xf0b78a : 0x9e6850, 0.18).fillRect(x, y, 3 + i % 8, 2);
  }

  for (const [index, dome] of campDomes.entries()) drawBubble(s, dome.x, dome.y, index);
  for (const x of [142, 378, 650, 924, 1196]) lantern(s, x, 137, 102);
  for (const y of [313, 546, 772]) {
    lantern(s, 101, y, 102);
    lantern(s, 1371, y, 102);
  }
  for (const x of [232, 402, 799, 1070, 1270]) lantern(s, x, 853, 105);
  for (const y of [812, 1009, 1185]) {
    palm(s, 493, y, 1);
    palm(s, 699, y, -1);
  }
  drawCampCelebration(s);
  s.npc('wadi-guest-10', 1159, 422, 'wadi-guest-10-idle-left');
  s.npc('wadi-guest-11', 1135, 786, 'wadi-guest-11-idle-left');
}

function palm(s: WorldScene, x: number, y: number, side: number) {
  const palm = s.add.graphics().setDepth(y);
  palm.fillStyle(0x5e3e42, 0.33).fillEllipse(x, y + 3, 57, 16);
  for (let row = 0; row < 8; row++) {
    const trunkX = x + Math.round(row * side * 1.4);
    palm.fillStyle(0x654338).fillRect(trunkX - 6, y - row * 9 - 9, 12, 10);
    palm.fillStyle(0xb0815b).fillRect(trunkX - 3, y - row * 9 - 8, 4, 6);
  }
  const crown = x + side * 10;
  for (const [dx, dy] of [[-52, -4], [-36, 15], [-21, 27], [42, -9], [49, 11], [26, 25], [-6, -31], [15, -25]]) {
    const leaf = [
      { x: crown - 4, y: y - 71 }, { x: crown + dx * 0.55, y: y - 81 + dy * 0.55 },
      { x: crown + dx, y: y - 71 + dy }, { x: crown + dx * 0.62, y: y - 64 + dy * 0.7 },
      { x: crown + 4, y: y - 66 },
    ];
    palm.fillStyle(dy < 0 ? 0x64794f : 0x3f5d44).fillPoints(leaf, true);
    palm.lineStyle(2, 0x82905c).lineBetween(crown, y - 70, crown + dx * 0.83, y - 71 + dy * 0.83);
  }
  s.solid(x - 8, y - 11, 16, 15);
}

function drawBubble(s: WorldScene, x: number, y: number, index: number) {
  const open = index === 1;
  s.groundShadow(x + 11, y - 25, 232, 132, 0.32);
  const floor = s.add.graphics().setDepth(-930);
  floor.fillStyle(0x57434d).fillEllipse(x, y - 42, 226, 147);
  floor.fillStyle(0xcfa788).fillEllipse(x, y - 43, 213, 137);
  floor.fillStyle(0x9b6a58).fillRoundedRect(x - 30, y - 13, 60, 77, 16);
  floor.fillStyle(0xd5b29b).fillRoundedRect(x - 24, y - 14, 48, 72, 12);
  floor.fillStyle(0xa36c60).fillEllipse(x, y - 16, 111, 57);

  const bed = s.add.graphics().setDepth(y - 56);
  bed.fillStyle(0x5a464a).fillRoundedRect(x - 34, y - 104, 69, 53, 6);
  bed.fillStyle(0xf6e9d6).fillRoundedRect(x - 31, y - 102, 63, 46, 5);
  bed.fillStyle(0xbb7f69).fillRect(x - 29, y - 81, 59, 24);
  bed.fillStyle(0xffedcf).fillRect(x - 25, y - 97, 19, 12);
  bed.fillRect(x + 6, y - 97, 19, 12);
  const roof = s.add.graphics().setDepth(y + 65);
  roof.fillStyle(0xe4e1e2, 0.33).fillEllipse(x, y - 66, 218, 183);
  roof.fillStyle(0xf7f3e9, 0.19).fillEllipse(x - 12, y - 83, 182, 144);
  roof.lineStyle(5, 0x625972, 0.46).strokeEllipse(x + 3, y - 63, 218, 183);
  roof.lineStyle(4, 0xf4eee5, 0.87).strokeEllipse(x, y - 66, 218, 183);
  roof.lineStyle(2, 0xe3e5ef, 0.61).strokeEllipse(x, y - 66, 127, 181);
  roof.lineStyle(2, 0xf1ebe5, 0.49).lineBetween(x - 102, y - 52, x + 102, y - 52);
  roof.fillStyle(0xffffff, 0.37).fillRoundedRect(x - 65, y - 122, 39, 6, 3);
  if (open) {
    floor.fillStyle(0x756270).fillRect(x - 27, y + 2, 54, 52);
    floor.fillStyle(0xb58c76).fillRect(x - 26, y + 29, 52, 24);
    floor.fillStyle(0xe8c7a2).fillRect(x - 26, y + 48, 52, 4);
    roof.fillStyle(0xe0c9b5).fillRoundedRect(x - 35, y - 14, 70, 18, 6);
    roof.fillRect(x - 35, y, 8, 54).fillRect(x + 27, y, 8, 54);
    s.label('2', x, y - 5, 12, '#4d3d48', y + 66);
  } else {
    roof.fillStyle(0xe0c9b5).fillRoundedRect(x - 30, y - 13, 60, 66, 16);
    roof.fillStyle(0x5c4953).fillRoundedRect(x - 23, y + 10, 46, 45, 12);
    roof.fillStyle(0x929fab).fillRoundedRect(x - 17, y + 16, 34, 34, 9);
    roof.fillStyle(0xc4ced2).fillRoundedRect(x - 13, y + 21, 26, 26, 5);
    roof.fillStyle(0x665660).fillRect(x + 5, y + 34, 5, 3);
    roof.fillStyle(0xf6d7ad).fillRect(x - 23, y + 49, 46, 5);
  }

  // Horizontal bands follow the glass outline, with a hollow interior in suite 2.
  for (let top = -158; top < 26; top += 8) {
    const offset = Math.max(top, Math.min(top + 8, -66)) + 66;
    const halfWidth = Math.ceil(109 * Math.sqrt(Math.max(0, 1 - (offset / 92) ** 2)));
    if (open && top >= -142) {
      const innerWidth = Math.max(25, halfWidth - 13);
      s.solid(x - halfWidth, y + top, halfWidth - innerWidth, 8);
      s.solid(x + innerWidth, y + top, halfWidth - innerWidth, 8);
    } else {
      s.solid(x - halfWidth, y + top, halfWidth * 2, 8);
    }
  }
  s.glow(x, y - 44, 82, 0xffbf84, 0.17);
  if (open) {
    s.solid(x - 59, y + 11, 32, 16);
    s.solid(x + 27, y + 11, 32, 16);
    s.solid(x - 35, y + 11, 8, 44);
    s.solid(x + 27, y + 11, 8, 44);
    s.solid(x - 33, y - 101, 66, 49);
    return;
  }
  s.solid(x - 30, y - 13, 60, 67);
  s.interact('bubble-' + index, x, y + 56, 35, 'Bubble Suite ' + (index + 1), () => say([
    { speaker: 'narrator', text: 'A quiet room under the stars.' },
  ]));
}

const ridge: OutlineItem = {
  x: 1960, y: 30, w: 990, h: 390, label: 'Sandstone Ridge', kind: 'building', shape: 'polygon',
  points: [[1900,360],[2070,194],[2204,122],[2330,165],[2485,49],[2601,91],[2706,32],[2949,130],[2988,412],[1970,415]].map(([x, y]) => ({ x, y })),
};

function drawMountainCamp(s: WorldScene) {
  const mountains = s.add.graphics().setDepth(400);
  const silhouette = (color: number, points: [number, number][]) =>
    mountains.fillStyle(color).fillPoints(points.map(([x, y]) => ({ x, y })), true);
  mountains.fillStyle(0x413746).fillPoints(ridge.points!.slice(), true);
  silhouette(0x866253, [[1950,396],[2090,264],[2170,257],[2280,154],[2355,176],[2485,64],[2557,107],[2665,133],[2720,54],[2870,113],[2960,189],[2970,395]]);
  silhouette(0xa98167, [[2190,321],[2280,154],[2355,176],[2300,214],[2251,313]]);
  silhouette(0xb78a68, [[2350,333],[2485,64],[2510,92],[2490,181],[2440,215],[2430,331]]);
  silhouette(0xa98067, [[2514,330],[2665,133],[2720,54],[2786,85],[2745,163],[2666,211],[2648,356]]);
  silhouette(0x654953, [[2470,249],[2518,157],[2560,131],[2544,205],[2570,279],[2538,368]]);
  silhouette(0x684e55, [[2743,220],[2819,126],[2917,178],[2960,189],[2970,395],[2692,385]]);
  silhouette(0x5c4450, [[1915,414],[2080,357],[2215,371],[2350,339],[2500,362],[2670,332],[2840,363],[2950,354],[2950,420]]);
  mountains.lineStyle(4, 0xd19d78, 0.52);
  for (const [x, y] of [[2140,308],[2310,262],[2420,299],[2490,218],[2647,292],[2715,193],[2832,267]]) {
    mountains.lineBetween(x, y, x + 52, y - 14);
    mountains.lineBetween(x + 4, y + 10, x + 32, y + 2);
  }
  s.solid(2020, 85, 930, 313);

  drawHilux(s, 2130, 560, 0xf4e9d8);
  drawHilux(s, 2445, 550, 0xd6b584);
  drawHilux(s, 2760, 560, 0xe69150);

  const fireX = 2470, fireY = 701;
  const fire = s.add.graphics().setDepth(fireY);
  const shadows = s.add.graphics().setDepth(-920);
  shadows.fillStyle(0xa97358, 0.66).fillEllipse(fireX, fireY, 278, 173);
  for (const [i, [x, y]] of [[2350, 672], [2433, 621], [2520, 628], [2586, 673], [2522, 768], [2394, 765], [2478, 794], [2303, 732]].entries()) {
    drawSeatedGuest(s, x, y, fireX, fireY, i);
  }
  s.updaters.push((_dt, time) => {
    const flicker = Math.sin(time / 112) * 7;
    fire.clear();
    fire.fillStyle(0x644a48).fillEllipse(fireX, fireY, 65, 31);
    fire.fillStyle(0x534044).fillRect(fireX - 23, fireY - 6, 46, 7);
    fire.fillStyle(0xdf7750).fillTriangle(fireX - 22, fireY - 1, fireX + flicker, fireY - 45, fireX + 22, fireY - 1);
    fire.fillStyle(0xffc57d).fillTriangle(fireX - 13, fireY - 1, fireX + 4 - flicker, fireY - 29, fireX + 12, fireY - 1);
    fire.fillStyle(0xffe5a3).fillCircle(fireX + flicker, fireY - 50 - Math.abs(flicker), 2);
  });
  for (const [i, [x, y]] of [[2013, 598], [2249, 583], [2694, 650], [2812, 645], [2720, 760], [2142, 737]].entries()) {
    const key = `wadi-guest-${i + 12}`;
    s.npc(key, x, y, key + '-idle-' + (x < fireX ? 'right' : 'left'));
  }
  s.solid(fireX - 27, fireY - 13, 54, 24);
  s.glow(fireX, fireY - 13, 160, 0xffa75d, 0.5, 0.05);
}

function drawHilux(s: WorldScene, x: number, y: number, color: number) {
  s.groundShadow(x + 12, y - 14, 179, 33, 0.33);
  const g = s.add.graphics().setDepth(y);
  const box = (a: number, b: number, w: number, h: number, tint: number) =>
    g.fillStyle(tint).fillRect(x + a, y + b, w, h);
  g.fillStyle(0x3a2e3e, 0.4).fillEllipse(x, y - 12, 201, 48);
  g.fillStyle(0x312c39).fillRoundedRect(x - 94, y - 56, 187, 43, 8);
  g.fillStyle(color).fillRoundedRect(x - 92, y - 53, 181, 32, 7);
  box(-89, -54, 62, 9, 0x786567);
  box(-85, -50, 54, 5, 0x5d5159);
  g.fillStyle(0x4b4252).fillRoundedRect(x - 29, y - 91, 85, 45, 8);
  g.fillStyle(color).fillRoundedRect(x - 25, y - 87, 77, 40, 5);
  box(-20, -75, 27, 23, 0x576e7a);
  box(12, -75, 30, 23, 0x688491);
  box(-18, -73, 17, 3, 0xaac0bb);
  box(14, -73, 20, 3, 0xaac0bb);
  box(66, -48, 20, 9, 0xffdb9b);
  box(-90, -47, 9, 9, 0xb95351);
  box(74, -35, 16, 6, 0x4e4352);
  for (const dx of [-59, 57]) {
    g.fillStyle(0x282635).fillCircle(x + dx, y - 20, 17);
    g.fillStyle(0x9e9a9d).fillCircle(x + dx, y - 20, 8);
  }
  s.solid(x - 89, y - 45, 177, 36);
}

function drawSeatedGuest(s: WorldScene, x: number, y: number, fireX: number, fireY: number, index: number) {
  const cushion = s.add.graphics().setDepth(y - 1);
  cushion.fillStyle(0x644852).fillEllipse(x, y + 2, 49, 17);
  cushion.fillStyle(0xad795e).fillRoundedRect(x - 19, y - 5, 38, 10, 4);
  const key = `wadi-guest-${index + 18}`;
  const facing = Math.abs(y - fireY) > Math.abs(x - fireX) ? (y < fireY ? 'down' : 'up') : (x < fireX ? 'right' : 'left');
  s.upright(s.npc(key, x, y, key + '-idle-' + facing), 3, 2.25);
}

function drawHorse(s: WorldScene, x: number, y: number, coat: number, shade: number, highlight: number, mane: number, faceLeft: boolean) {
  const art = s.add.graphics().setDepth(y);
  art.fillStyle(0x4e3540, 0.4).fillEllipse(x, y - 3, 104, 22);
  const box = (left: number, top: number, w: number, h: number, color: number) => {
    art.fillStyle(color).fillRect(x + (faceLeft ? -left - w : left), y + top, w, h);
  };
  const shape = (color: number, points: [number, number][]) => {
    art.fillStyle(color).fillPoints(points.map(([a, b]) => ({ x: x + (faceLeft ? -a : a), y: y + b })), true);
  };
  const outline = 0x342631;
  for (const leg of [-25, 19]) {
    box(leg + 7, -30, 8, 25, shade);
    box(leg + 5, -8, 11, 5, outline);
  }
  shape(mane, [[-35,-48],[-46,-44],[-53,-19],[-49,-12],[-42,-15],[-41,-33],[-32,-39]]);
  shape(outline, [[-38,-44],[-28,-52],[10,-51],[22,-67],[33,-70],[37,-80],[44,-76],[44,-70],[54,-61],[58,-50],[51,-44],[41,-45],[36,-51],[26,-30],[9,-23],[-28,-24],[-38,-33]]);
  shape(coat, [[-35,-42],[-27,-48],[12,-47],[25,-64],[36,-67],[43,-67],[51,-59],[54,-52],[49,-48],[42,-49],[35,-57],[23,-32],[10,-27],[-27,-27],[-35,-34]]);
  shape(mane, [[12,-46],[22,-67],[34,-71],[44,-68],[41,-63],[31,-64],[21,-46]]);
  box(37, -75, 4, 8, coat);
  box(-24, -47, 28, 5, highlight);
  box(-28, -31, 50, 4, shade);
  box(45, -62, 4, 4, outline);
  box(46, -52, 8, 4, shade);
  for (const leg of [-29, 18]) {
    box(leg, -32, 10, 29, coat);
    box(leg, -22, 3, 18, shade);
    box(leg - 1, -5, 12, 5, outline);
  }
  s.solid(x - 38, y - 27, 77, 28);
}

function drawStable(s: WorldScene) {
  const yard = s.add.graphics().setDepth(-945);
  yard.fillStyle(0xbd865d, 0.4).fillEllipse(2680, 2125, 506, 319);
  yard.fillStyle(0xd0986a, 0.39).fillEllipse(2680, 2128, 473, 283);
  for (let i = 0; i < 60; i++) {
    const x = stableYard.x + 29 + (i * 101) % 410, y = stableYard.y + 35 + (i * 71) % 255;
    yard.fillStyle(i % 2 ? 0xe0a875 : 0x885c48, 0.25).fillRect(x, y, 4 + i % 7, 2);
  }

  const barn = s.add.graphics().setDepth(2151);
  barn.fillStyle(0x583a42, 0.42).fillEllipse(2556, 2149, 209, 42);
  barn.fillStyle(0x593943).fillRect(2468, 2042, 176, 103);
  barn.fillStyle(0xb28362).fillRect(2473, 2046, 166, 92);
  for (let x = 2481; x < 2639; x += 15) barn.fillStyle(0x91614e).fillRect(x, 2046, 2, 92);
  barn.fillStyle(0x503541).fillTriangle(2457, 2058, 2555, 1988, 2654, 2058);
  barn.fillStyle(0x93645b).fillTriangle(2465, 2052, 2555, 1997, 2646, 2052);
  for (let i = 0; i < 5; i++) {
    const y = 2013 + i * 9, halfWidth = 23 + i * 14;
    barn.fillStyle(0x80554f).fillRect(2555 - halfWidth, y, halfWidth * 2, 2);
  }
  barn.fillStyle(0xd3a382).fillRect(2461, 2051, 190, 6);
  barn.fillStyle(0x593943).fillRect(2461, 2057, 190, 5);
  barn.fillStyle(0x744c45).fillRect(2524, 2072, 63, 71);
  barn.fillStyle(0x413341).fillRect(2529, 2077, 53, 61);
  barn.fillStyle(0xc18f5c).fillRect(2530, 2125, 51, 13);
  barn.fillStyle(0xe1af69).fillRect(2533, 2127, 42, 4);
  for (const x of [2484, 2600]) {
    barn.fillStyle(0x60404a).fillRect(x, 2077, 27, 29);
    barn.fillStyle(0xefb96e).fillRect(x + 4, 2081, 19, 19);
    barn.fillStyle(0x825541).fillRect(x + 12, 2081, 3, 19);
    barn.fillRect(x + 4, 2089, 19, 3);
  }
  s.solid(2468, 2028, 176, 117);

  const fence = (x: number, y: number, w: number, h: number) => {
    const front = s.add.graphics().setDepth(y + h);
    for (const [height, color] of [[24, 0x8c5c46], [12, 0x68433d]]) {
      front.lineStyle(6, color).lineBetween(x, y - height, x + w, y + h - height);
      front.lineStyle(2, 0xd29a68).lineBetween(x, y - height - 2, x + w, y + h - height - 2);
    }
    const count = Math.ceil(Math.hypot(w, h) / 48);
    for (let i = 0; i <= count; i++) {
      const px = x + w * i / count, py = y + h * i / count;
      front.fillStyle(0x53363b).fillRect(px - 4, py - 31, 8, 34);
      front.fillStyle(0xb08059).fillRect(px - 3, py - 29, 4, 27);
    }
    s.solid(x - 4, y - 4, w + 8, h + 8);
  };
  fence(2668, 2057, 44, 0);
  fence(2777, 2057, 113, 0);
  fence(2668, 2057, 0, 169);
  fence(2890, 2057, 0, 169);
  fence(2668, 2226, 222, 0);

  drawHorse(s, 2741, 2152, 0xaf744e, 0x875540, 0xce9466, 0x49313b, false);
  drawHorse(s, 2824, 2208, 0xe3c6a6, 0xa58a81, 0xf1debf, 0x766265, true);
  drawHorse(s, 2856, 2088, 0x6d4a49, 0x51383d, 0x957061, 0x362a33, true);

  const stableGuests = [[2530, 2189, 'right'], [2593, 2184, 'left'], [2738, 2017, 'down'], [2777, 2166, 'right']] as const;
  for (const [i, [x, y, direction]] of stableGuests.entries()) {
    const key = `wadi-guest-${28 + i}`;
    s.npc(key, x, y, `${key}-idle-${direction}`);
  }
  lantern(s, 2517, 1968, 125);
  lantern(s, 2876, 1981, 125);
  lantern(s, 2599, 2254, 125);
  s.glow(2545, 2117, 145, 0xffb570, 0.26);
  s.interact('stable', 2738, 2017, 66, 'Talk to the Stable Keeper', () => say([
    { speaker: 'staff', name: 'Stable Keeper', portrait: 'wadi-guest-30', text: 'Welcome! Come through the open gate to see the horses.' },
  ]));
}

function drawCamp(s: WorldScene) {
  const { x, y } = fieldLab;
  s.groundShadow(x + 20, y - 4, 373, 62, 0.33);
  const g = s.add.graphics().setDepth(y);
  const box = (left: number, top: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x + left, y + top, w, h);
  const panel = (color: number, points: [number, number][]) => g.fillStyle(color).fillPoints(points.map(([dx, dy]) => ({ x: x + dx, y: y + dy })), true);

  g.fillStyle(0x342634, 0.54).fillEllipse(x + 13, y + 1, 397, 52);
  panel(0x44313b, [[-173, -6], [-153, -108], [-118, -146], [122, -146], [155, -108], [173, -6]]);
  panel(0x85594d, [[-164, -12], [-148, -100], [148, -100], [164, -12]]);
  panel(0xc5966f, [[-153, -108], [-117, -141], [117, -141], [153, -108]]);
  panel(0xaa795d, [[-151, -110], [-109, -125], [109, -125], [151, -110]]);
  box(-153, -108, 306, 8, 0x674440);
  box(-150, -109, 300, 3, 0xf0bd8c);
  for (const seam of [-105, -53, 53, 105]) {
    g.lineStyle(2, 0x9b694f).lineBetween(x + seam * 0.77, y - 140, x + seam, y - 109);
    g.lineStyle(2, 0x70483f).lineBetween(x + seam, y - 98, x + seam * 1.07, y - 14);
  }
  for (const left of [-143, 55]) {
    box(left, -38, 88, 3, 0xc58d68);
    box(left, -33, 88, 5, 0x694341);
    box(left, -27, 88, 2, 0xd7aa7f);
    for (let dx = 7; dx < 85; dx += 14) box(left + dx, -33, 4, 4, 0xd7aa7f);
  }
  for (const left of [-121, 78]) {
    box(left, -81, 43, 33, 0x503840);
    box(left + 4, -77, 35, 24, 0xcf9f70);
    box(left + 5, -77, 33, 4, 0xf3ca90);
    for (let row = -71; row < -54; row += 5) box(left + 5, row, 33, 1, 0x946957);
    box(left + 19, -78, 3, 25, 0x795547);
  }

  panel(0x45323d, [[-52,-101],[52,-101],[62,-10],[-62,-10]]);
  box(-44, -94, 88, 84, 0xc38d61);
  box(-35, -91, 70, 77, 0xebbd7f);
  panel(0xad7b5a, [[-43,-94],[-24,-75],[-48,-15],[-61,-12]]);
  panel(0xad7b5a, [[43,-94],[24,-75],[48,-15],[61,-12]]);
  g.lineStyle(2, 0xf0b985).lineBetween(x - 42, y - 91, x - 48, y - 15);
  g.lineBetween(x + 42, y - 91, x + 48, y - 15);
  box(-27, -45, 54, 8, 0x68463e);
  box(-24, -38, 4, 19, 0x68463e);
  box(20, -38, 4, 19, 0x68463e);
  box(-12, -61, 26, 16, 0x3c414d);
  box(-9, -58, 20, 9, 0x82b7aa);
  box(-6, -55, 9, 2, 0xbce0b9);
  box(-48, -13, 96, 16, 0x925b50);
  box(-44, -10, 88, 3, 0xdba375);
  box(-42, -1, 84, 2, 0xdba375);
  for (const side of [-1, 1]) {
    g.lineStyle(2, 0xd4ab83).lineBetween(x + side * 149, y - 103, x + side * 192, y - 2);
    box(side * 192 - 3, -8, 6, 13, 0x57403d);
    s.solid(x + side * 192 - 4, y - 5, 8, 10);
  }
  s.label('FIELD LAB', x, y - 122, 13, '#ffe4ab', y + 1);
  s.solid(x - 162, y - 58, 324, 46);
  lantern(s, x - 163, y + 19, 118);
  lantern(s, x + 163, y + 19, 118);
  s.glow(x, y - 30, 125, 0xffad64, 0.26);
}

function drawBMW(s: WorldScene) {
  const { x, y } = bmwBay;
  s.groundShadow(x + 9, y - 14, 85, 45, 0.4);
  const g = s.add.graphics().setDepth(y);
  const box = (dx: number, dy: number, w: number, h: number, color: number) =>
    g.fillStyle(color).fillRect(x + dx, y + dy, w, h);
  const poly = (points: [number, number][], color: number) =>
    g.fillStyle(color).fillPoints(points.map(([dx, dy]) => ({ x: x + dx, y: y + dy })), true);
  const halo = (dx: number, dy: number, r: number) =>
    g.lineStyle(2, 0xffe6a8).strokeCircle(x + dx, y + dy, r);
  g.fillStyle(0x1f2132, 0.62).fillEllipse(x, y - 33, 136, 168);
  poly([[-50,-7],[-57,-34],[-46,-134],[-28,-154],[28,-154],[46,-134],[57,-34],[50,-7]], 0x232538);
  poly([[-49,-18],[-50,-38],[-40,-130],[-25,-146],[25,-146],[40,-130],[50,-38],[49,-18]], 0x31554b);
  poly([[-37,-116],[-28,-135],[28,-135],[37,-116],[30,-98],[-30,-98]], 0x596779);
  poly([[-32,-111],[-26,-129],[26,-129],[32,-111],[24,-103],[-24,-103]], 0x8593a5);
  poly([[-39,-93],[-30,-76],[30,-76],[39,-93],[30,-100],[-30,-100]], 0x354b61);
  box(-23,-94,46,3,0x8ca5b3);
  poly([[-38,-74],[-48,-38],[-27,-27],[27,-27],[48,-38],[38,-74]], 0x365b4e);
  poly([[-33,-71],[-24,-38],[-35,-32],[-44,-41]],0x54796a);
  poly([[33,-71],[24,-38],[35,-32],[44,-41]],0x244039);
  box(-58,-83,13,8,0x42665c); box(45,-83,13,8,0x42665c);
  box(-50,-32,100,22,0x213c35);
  poly([[-48,-36],[-20,-31],[-22,-18],[-47,-21]],0x262b41);
  poly([[48,-36],[20,-31],[22,-18],[47,-21]],0x262b41);
  for (const dx of [-39,-28,28,39]) halo(dx,-26,dx === -39 || dx === 39 ? 5 : 4);
  for (const dx of [-17,2]) {
    g.fillStyle(0x9da7af).fillRoundedRect(x+dx,y-31,15,14,3);
    g.fillStyle(0x212738).fillRoundedRect(x+dx+2,y-30,11,11,2);
    for(let slat=dx+4;slat<dx+13;slat+=3)box(slat,-29,1,8,0x556273);
  }
  box(-22,-15,44,5,0x252b3b); box(-11,-11,22,5,0xd1c8b5);
  g.fillStyle(0x3f6b9a).fillCircle(x,y-39,3.5);
  box(-2,-40,2,2,0xe9e6d9);
  s.glow(x - 35, y + 6, 69, 0xffcd83, 0.22);
  s.glow(x + 35, y + 6, 69, 0xffcd83, 0.22);
  s.solid(x - 46, y - 139, 92, 128);
}

function drawParkedCar(s: WorldScene, x: number, y: number, model: 'supra' | 'amg' | 'gmc') {
  s.groundShadow(x + 9, y - 14, 85, 45, 0.4);
  const g = s.add.graphics().setDepth(y);
  const box = (dx: number, dy: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x + dx, y + dy, w, h);
  const panel = (color: number, points: [number, number][]) => g.fillStyle(color).fillPoints(points.map(([dx, dy]) => ({ x: x + dx, y: y + dy })), true);
  const ink = 0x282332, glass = 0x3f4c60, reflection = 0x788f9e, chrome = 0xb8b2b4;
  const truck = model === 'gmc';
  const half = truck ? 51 : 46;
  const length = truck ? 142 : 137;
  const palettes = {
    supra: { paint: 0xe9ad38, lit: 0xffcf58, shade: 0x9b632b },
    amg: { paint: 0x89579f, lit: 0xb88bc8, shade: 0x563967 },
    gmc: { paint: 0xebe4d5, lit: 0xfff7e4, shade: 0xa29ca5 },
  };
  const { paint, lit, shade } = palettes[model];

  g.fillStyle(0x272433, 0.48).fillEllipse(x + 3, y - 58, half * 2 + 22, length + 10);
  for (const side of [-1, 1]) {
    const wheel = side < 0 ? -half - 4 : half - 5;
    box(wheel, -112, 9, 21, ink);
    box(wheel, -44, 9, 25, ink);
  }
  if (truck) {
    g.fillStyle(ink).fillRoundedRect(x - half, y - length, half * 2, length - 4, 6);
    box(4 - half, 4 - length, half * 2 - 8, length - 12, paint);
    box(-43, -132, 86, 32, shade);
    box(-39, -129, 78, 26, lit);
    box(-38, -95, 76, 21, ink);
    box(-35, -93, 70, 15, glass);
    box(-34, -92, 68, 3, reflection);
    box(-42, -73, 84, 38, paint);
    box(-31, -70, 62, 27, lit);
    box(-51, -40, 102, 31, shade);
    box(-32, -38, 64, 24, chrome);
    box(-27, -35, 54, 17, ink);
    for (let i = -23; i < 24; i += 6) box(i, -34, 2, 14, 0x72707e);
    box(-12, -30, 24, 9, 0x592d3a);
    s.label('GMC', x, y - 26, 9, '#ed7c69', y + 1);
    for (const side of [-1, 1]) {
      const light = side < 0 ? -47 : 33;
      box(light, -38, 14, 21, ink);
      box(light + 2, -36, 10, 6, 0xffefc6);
      box(light + 2, -25, 10, 4, 0xffcc86);
      box(side < 0 ? -57 : 44, -92, 13, 8, shade);
    }
    box(-47, -13, 94, 5, chrome);
  } else {
    const shortCab = model === 'amg';
    panel(ink, [[-42,-13],[-48,-39],[-42,-108],[-32,-130],[-18,-137],[18,-137],[32,-130],[42,-108],[48,-39],[42,-13]]);
    panel(paint, [[-39,-17],[-44,-39],[-38,-107],[-28,-126],[-16,-132],[16,-132],[28,-126],[38,-107],[44,-39],[39,-17]]);
    if (!shortCab) {
      box(-37, -129, 74, 4, shade);
      box(-41, -134, 82, 5, ink);
      box(-37, -134, 74, 2, lit);
    }
    const base = shortCab ? -102 : -84;
    panel(lit, [[-24, base - 19], [24, base - 19], [30, base - 7], [-30, base - 7]]);
    panel(ink, [[-27, base - 8], [27, base - 8], [34, base + 12], [-34, base + 12]]);
    panel(glass, [[-25, base - 6], [25, base - 6], [31, base + 8], [-31, base + 8]]);
    box(-22, base - 4, 44, 2, reflection);
    panel(lit, [[-23, base + 16], [23, base + 16], [34, -43], [27, -31], [-27, -31], [-34, -43]]);
    box(-44, -32, 88, 13, shade);
    if (shortCab) {
      g.fillStyle(chrome).fillRoundedRect(x - 23, y - 32, 46, 17, 4);
      g.fillStyle(ink).fillRoundedRect(x - 20, y - 30, 40, 13, 3);
      for (let i = -15; i <= 15; i += 5) box(i, -29, 1, 11, 0x888292);
      g.lineStyle(1, 0xe2d4d4).strokeCircle(x, y - 24, 4);
      g.lineBetween(x, y - 28, x, y - 24).lineBetween(x - 3, y - 22, x, y - 24).lineBetween(x, y - 24, x + 3, y - 22);
    } else {
      box(-22, -26, 44, 10, ink);
      box(-39, -24, 10, 6, ink);
      box(29, -24, 10, 6, ink);
      box(-2, -40, 4, 3, 0xffe8ad);
    }
    for (const side of [-1, 1]) {
      panel(ink, [[side * 44, -38], [side * 24, -31], [side * 26, -23], [side * 43, -27]]);
      panel(0xffefd0, [[side * 42, -36], [side * 27, -31], [side * 28, -27], [side * 41, -30]]);
      box(side < 0 ? -49 : 37, base + 2, 12, 6, shade);
    }
    box(-28, -15, 56, 4, ink);
  }
  box(-10, -13, 20, 5, 0xe3d4bd);
  s.solid(x - half + 4, y - length + 12, (half - 4) * 2, length - 18);
}

function drawMotorCourt(s: WorldScene) {
  const { x, y, w, h } = motorCourt;
  const base = s.add.graphics().setDepth(-937);
  base.fillStyle(0xa77557, 0.48).fillRoundedRect(x - 10, y - 7, w + 20, h + 14, 32);
  base.fillStyle(0x5b494b).fillRoundedRect(x, y, w, h, 23);
  base.fillStyle(0x726063).fillRoundedRect(x + 7, y + 7, w - 14, h - 14, 18);
  base.fillStyle(0x967067).fillRect(parkingDriveX - 51, 1915, 102, 52);
  base.fillStyle(0x726063).fillRect(parkingDriveX - 47, 1925, 94, 53);
  for (let i = 0; i < 125; i++) {
    const sx = x + 17 + (i * 139) % (w - 34), sy = y + 15 + (i * 57) % (h - 30);
    base.fillStyle(i % 2 ? 0x97796f : 0x4e464c, 0.23).fillRect(sx, sy, 4 + i % 9, 2);
  }

  for (const { x: cx, y: carY } of parkingBays) {
    const half = 56, top = carY - 155, bottom = carY + 8;
    base.fillStyle(0x594c55, 0.44).fillRect(cx - half, top, half * 2, bottom - top);
    base.lineStyle(2, 0xd8ba91, 0.8).lineBetween(cx - half, top, cx - half, bottom);
    base.lineBetween(cx + half, top, cx + half, bottom);
    base.lineBetween(cx - half, top, cx + half, top);
    base.fillStyle(0x493e49).fillRect(cx - 33, top + 8, 66, 6);
    base.fillStyle(0xbb9680).fillRect(cx - 33, top + 6, 66, 3);
  }

  drawBMW(s);
  drawParkedCar(s, parkingBays[0].x, parkingBays[0].y, 'supra');
  drawParkedCar(s, parkingBays[4].x, parkingBays[4].y, 'amg');
  drawParkedCar(s, parkingBays[6].x, parkingBays[6].y, 'gmc');
  lantern(s, x + 17, y + 32, 120);
  lantern(s, x + w - 19, y + 30, 120);
  lantern(s, x + w - 19, y + h - 15, 120);
}

function drawCornCart(s: WorldScene) {
  const { x, y } = cornCart;
  const cart = s.add.graphics().setDepth(y);
  const box = (dx: number, dy: number, w: number, h: number, color: number) => cart.fillStyle(color).fillRect(x + dx, y + dy, w, h);

  cart.fillStyle(0x563e43, 0.34).fillEllipse(x + 3, y - 1, 80, 18);
  box(-27, -67, 4, 48, 0x65453b);
  box(24, -67, 4, 48, 0x65453b);
  cart.fillStyle(0x51373e).fillRoundedRect(x - 36, y - 73, 72, 18, 4);
  for (let i = 0; i < 7; i++) {
    box(-35 + i * 10, -71, 10, 13, i % 2 ? 0xb56051 : 0xf2ca85);
    box(-35 + i * 10, -58, 10, 5, i % 2 ? 0x824e47 : 0xc49363);
  }

  box(-29, -36, 59, 26, 0x583d40);
  box(-27, -34, 55, 20, 0x9d6d50);
  box(-24, -29, 47, 12, 0xba8861);
  box(-33, -39, 66, 6, 0xe1b481);
  box(30, -28, 9, 4, 0x664448);
  box(27, -14, 4, 13, 0x51373e);
  cart.fillStyle(0x48313b).fillCircle(x - 19, y - 8, 9);
  cart.fillStyle(0xb08461).fillCircle(x - 19, y - 8, 5);
  box(-21, -10, 4, 4, 0xe9bd86);
  for (const dx of [-22, -10, 2]) {
    box(dx, -47, 9, 8, 0x6b784e);
    box(dx + 1, -48, 7, 6, 0xffd163);
    box(dx + 2, -47, 5, 1, 0xffeda1);
    box(dx + 4, -45, 3, 1, 0xd3963d);
  }
  box(15, -46, 12, 7, 0x777581);
  box(16, -47, 10, 2, 0xbbabb0);

  s.solid(x - 29, y - 28, 61, 28);
  s.npc('wadi-guest-4', x + 9, y - 37, 'wadi-guest-4-idle-down');
  s.interact('corn-vendor', x, y + 8, 70, 'Talk to the Corn Vendor', () => say([
    { speaker: 'staff', name: 'Corn Vendor', portrait: 'wadi-guest-4', text: 'Fresh corn off the grill! Want a cob?' },
  ]));
}

function drawAudienceChair(s: WorldScene, x: number, y: number, facing: Dir, index: number) {
  const frame = s.add.graphics().setDepth(y);
  const side = facing === 'left' || facing === 'right';
  const half = side ? 16 : 21;
  frame.fillStyle(0x43303c, 0.45).fillEllipse(x, y + 2, half * 2 + 10, 14);
  frame.fillStyle(0x563b37).fillRect(x - half + 2, y - 8, 5, 12);
  frame.fillRect(x + half - 7, y - 8, 5, 12);
  frame.fillStyle(0x865944).fillRect(x - half, y - 16, half * 2, 9);
  frame.fillStyle(0x71514b).fillRect(x - half + 4, y - 18, half * 2 - 8, 5);
  frame.fillStyle(0xbf8965).fillRect(x - half, y - 10, half * 2, 3);

  const back = s.add.graphics().setDepth(facing === 'up' ? y + 2 : y - 1);
  const backX = side ? x + (facing === 'right' ? -half : half - 6) : x - half;
  const backWidth = side ? 6 : half * 2;
  const backY = facing === 'up' ? y - 28 : y - 36;
  back.fillStyle(0x6f493a).fillRect(backX, backY, backWidth, 22);
  back.fillStyle(0xc08b63).fillRect(backX, backY, backWidth, 4);
  if (!side) {
    back.fillStyle(0x985f48).fillRect(backX + 4, backY + 5, backWidth - 8, 7);
    back.fillStyle(0xad7657).fillRect(backX + 4, backY + 14, backWidth - 8, 3);
  }

  const key = `wadi-guest-${index}-seat-${facing}`;
  const offsetX = facing === 'left' ? -4 : facing === 'right' ? 4 : 0;
  s.npc(key, x + offsetX, y + 1, `${key}-idle`, y + 1);
  s.solid(x - half, y - 19, half * 2, 24);
}

function drawCampCelebration(s: WorldScene) {
  const g = s.add.graphics().setDepth(-930);
  g.fillStyle(0x683e4a).fillRoundedRect(359, 491, 486, 244, 16);
  g.fillStyle(0xa85c59).fillRoundedRect(367, 499, 470, 228, 12);
  g.fillStyle(0xd79a72).fillRect(374, 510, 455, 5);
  g.fillRect(374, 710, 455, 5);
  for (let x = 380; x < 820; x += 25) {
    g.fillStyle(0xe0af85).fillTriangle(x, 516, x + 9, 527, x + 18, 516);
    g.fillTriangle(x, 709, x + 9, 698, x + 18, 709);
  }

  const dancers = [516, 570, 624, 678].map((x, i) => {
    const key = `wadi-dabke-${i}`;
    return s.npc(key, x, 646, key + '-dance');
  });
  s.updaters.push((_dt, time) => {
    const lift = Math.round(Math.max(0, Math.sin(time / 152)) * 10);
    for (const dancer of dancers) dancer.y = 646 - lift;
  });

  const audience: [number, number, Dir][] = [
    [408, 472, 'down'], [548, 469, 'down'], [663, 465, 'down'], [787, 473, 'down'],
    [348, 581, 'right'], [307, 651, 'right'], [319, 724, 'right'], [875, 552, 'left'],
    [423, 791, 'up'], [782, 789, 'up'],
  ];
  for (const [i, [x, y, facing]] of audience.entries()) drawAudienceChair(s, x, y, facing, i);

  const grill = s.add.graphics().setDepth(685);
  grill.fillStyle(0x46323d, 0.4).fillEllipse(935, 675, 62, 25);
  grill.fillStyle(0x3d303d).fillRect(916, 647, 5, 32);
  grill.fillRect(949, 647, 5, 32);
  grill.fillStyle(0x42333c).fillRoundedRect(911, 604, 48, 66, 5);
  grill.fillStyle(0x88717a).fillRoundedRect(913, 601, 44, 61, 5);
  grill.fillStyle(0x372b34).fillRect(917, 607, 36, 50);
  grill.fillStyle(0xcd694c).fillRect(920, 610, 30, 44);
  for (let y = 612; y < 655; y += 7) {
    grill.fillStyle(0x4d3d45).fillRect(917, y, 36, 2);
    grill.fillStyle(0xffbd72, 0.8).fillRect(922 + y % 12, y + 2, 5, 2);
  }
  for (const x of [924, 939]) {
    grill.fillStyle(0xdcb394).fillRect(x + 2, 616, 2, 30);
    for (const y of [620, 626, 632]) {
      grill.fillStyle(0x8c4a3f).fillRect(x, y, 7, 5);
      grill.fillStyle(0xcf835c).fillRect(x + 1, y, 5, 2);
    }
  }
  grill.fillStyle(0xc2a3a3).fillRect(927, 664, 16, 3);
  const smoke = [0, 1, 2].map(() => s.add.ellipse(935, 626, 20, 11, 0xe9c6ae, 0.25).setDepth(686));
  s.updaters.push((_dt, time) => smoke.forEach((puff, i) => {
    const phase = (time / 1000 + i / 3) % 1;
    puff.setPosition(935 + phase * 19, 626 - phase * 61).setAlpha((1 - phase) * 0.32);
  }));
  s.solid(913, 616, 44, 63);
  s.npc('wadi-guest-26', 982, 658, 'wadi-guest-26-idle-left');
  s.npc('wadi-guest-27', 1018, 701, 'wadi-guest-27-idle-left');
  s.glow(935, 636, 125, 0xff8a4e, 0.36);
}

export function buildWadi(s: WorldScene) {
  s.floor('sand', 0, 0, W, H, 3);
  buildDesertTextures(s);
  drawDesert(s);
  drawNightTrails(s);
  const edges = drawDesertEdges(s);
  drawBubbleCamp(s);
  drawCampReception(s);
  const cashSite = travelCashPickup(s, 'wadi', 870, 1435);
  drawMountainCamp(s);
  drawStable(s);

  drawCamp(s);
  drawMotorCourt(s);
  drawCornCart(s);
  s.interact('camp', fieldLab.x, fieldLab.y + 56, 140, 'Field Analysis Station', () => {
    if (store.get().game.stage === 'wadi' && Object.keys(store.get().game.samples).length < 3) {
      say([{ speaker: 'player', text: 'I should gather at least three measurements before running a comparison.' }],
        () => openPanel('analysis'));
      return;
    }
    openPanel('analysis');
  });
  const equipment = fieldEquipmentRing(s, 'wadi');

  // Moonlight tint is below the warm light cast by lanterns.
  s.add.rectangle(0, 0, W, H, 0x29234d, 0.33).setOrigin(0).setDepth(9300);

  if (store.get().game.stage === 'book' && !store.get().game.flags.ticket) {
    setStage('wadi');
    const g = store.get().game;
    if (!g.visited.includes('Jordan')) store.game({ visited: [...g.visited, 'Jordan'] });
    setTimeout(() => say([
      { speaker: 'narrator', text: 'Wadi Rum Protected Area, southern Jordan. The first lanterns are lit under the night sky.' },
      { speaker: 'player', text: 'The equipment is set up in a ring near the middle of the valley. I can open the field records from the sample collector.' },
    ]), 900);
  }
  const exit = fieldExit(s, exitX, H);

  return {
    w: W, h: H, name: 'Wadi Rum, Jordan', zoom: 1.35, bg: 0x6b3a22, mood: 'wadi' as const,
    spawn: { x: 820, y: 2280, dir: 'up' as const },
    outline: [
      ...trails.map((points) => ({ x: 0, y: 0, w: W, h: H, kind: 'path' as const, shape: 'trail' as const, points, strokeWidth: roadWidth })),
      ...edges,
      exit,
      { ...bubbleCamp, label: 'Bubble Camp', kind: 'zone' as const, shape: 'ellipse' as const },
      ...campDomes.map(({ x, y }) => ({ x: x - 109, y: y - 158, w: 218, h: 183, kind: 'building' as const, shape: 'ellipse' as const })),
      { ...reception, label: 'Reception', kind: 'building' as const },
      cashSite,
      ridge,
      { x: 2270, y: 583, w: 385, h: 230, label: 'Campfire', kind: 'zone' as const, shape: 'ellipse' as const },
      { x: fieldLab.x - 173, y: fieldLab.y - 146, w: 346, h: 146, label: 'Field Lab', kind: 'zone' as const },
      { ...motorCourt, label: 'Parking', kind: 'parking' as const },
      { ...stableYard, label: 'Horse Stable', kind: 'zone' as const },
      ...equipment,
    ],
  };
}
BUILDERS.wadi = buildWadi;
