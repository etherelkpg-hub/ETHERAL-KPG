import Phaser from 'phaser';
import { AIRPORT_ENTRY } from '../config';
import { atLeast, saveProgress, say, setFlag, setStage, warp } from '../story';
import { store } from '../store';
import { BUILDERS, type Rect, type WorldScene } from '../scenes/WorldScene';

import { drawAirportApproach, drawCityBuildings, drawNeighborhood, drawTerminal, terminal } from './cityBuildings';

const W = 4500, H = 1680;
const ROAD_Y = 900, ROAD_H = 180, VX = 1900, VW = 180;

const park = { x: 205, y: 1214, w: 1140, h: 380 };
const parking = { x: 2710, y: 1200, w: 856, h: 319 };
const parkWalk = { x: 726, y: 1168, w: 70, h: 127 };

interface Car { img: Phaser.GameObjects.Image; axis: 'h' | 'v'; dir: 1 | -1; lane: number; v: number; max: number; len: number }

function lorelaiAtLukes(s: WorldScene) {
  const visiting = store.get().game.flags.lorelaiAtLukes;
  if (!visiting) return;

  const arriving = visiting && !store.get().game.flags.lorelaiArrived;
  const path = [
    { x: 380, y: 784, dir: 'down' }, { x: 740, y: 784, dir: 'right' },
    { x: 740, y: 742, dir: 'up' }, { x: 805, y: 742, dir: 'right' },
  ] as const;
  const arrival = path[path.length - 1];
  const lorelai = s.npc('lorelai', arriving ? 380 : arrival.x, arriving ? 680 : arrival.y, 'lorelai-idle-down');
  const stop = () => lorelai.play('lorelai-idle-down').setDepth(lorelai.y);
  stop();
  if (arriving) {
    let previous = { x: lorelai.x, y: lorelai.y };
    s.tweens.chain({
      targets: lorelai,
      tweens: path.map(({ x, y, dir }) => {
        const duration = Math.hypot(x - previous.x, y - previous.y) / 185 * 1000;
        previous = { x, y };
        return {
          x, y, duration,
          onStart: () => { lorelai.play('lorelai-walk-' + dir); },
          onUpdate: () => { lorelai.setDepth(lorelai.y); },
        };
      }),
      onComplete: () => { stop(); setFlag('lorelaiArrived'); saveProgress(); },
    });
  }
  s.interact('lorelai-lukes', arrival.x, arrival.y + 29, 48,
    () => store.get().game.flags.lorelaiArrived ? 'Talk to Lorelai' : null,
    () => say([{ speaker: 'staff', name: 'Lorelai', portrait: 'lorelai', text: 'I made it to Luke’s. See you after your trip, Mateo!' }]));
}

export function buildCity(s: WorldScene) {
  s.floor('grass', 0, 0, W, H);
  // plazas & sidewalks
  s.floor('sidewalk', 0, 760, W, 140);
  s.floor('sidewalk', 0, 1080, W, 90);
  s.floor('sidewalk', VX - 70, 0, 70, H);
  s.floor('sidewalk', VX + VW, 0, 70, H);
  s.floor('asphalt', 0, ROAD_Y, W, ROAD_H);
  s.floor('asphalt', VX, 0, VW, H);
  s.add.tileSprite(0, ROAD_Y - 4, W, 4, 'curb').setOrigin(0).setTileScale(3, 1).setDepth(-990);
  s.add.tileSprite(0, ROAD_Y + ROAD_H, W, 4, 'curb').setOrigin(0).setTileScale(3, 1).setDepth(-990);
  s.add.tileSprite(0, ROAD_Y + ROAD_H / 2 - 2, VX, 4, 'lane').setOrigin(0).setTileScale(2).setDepth(-980);
  s.add.tileSprite(VX + VW, ROAD_Y + ROAD_H / 2 - 2, W - VX - VW, 4, 'lane').setOrigin(0).setTileScale(2).setDepth(-980);
  s.add.tileSprite(VX + VW / 2 - 2, 0, 4, ROAD_Y - 80, 'lane-v').setOrigin(0).setTileScale(2).setDepth(-980);
  s.add.tileSprite(VX + VW / 2 - 2, ROAD_Y + ROAD_H + 80, 4, H, 'lane-v').setOrigin(0).setTileScale(2).setDepth(-980);
  s.add.tileSprite(VX - 70, ROAD_Y, 60, ROAD_H, 'zebra').setOrigin(0).setTileScale(3).setDepth(-970);
  s.add.tileSprite(VX + VW + 10, ROAD_Y, 60, ROAD_H, 'zebra').setOrigin(0).setTileScale(3).setDepth(-970);
  s.add.tileSprite(VX, ROAD_Y - 72, VW, 60, 'zebra-v').setOrigin(0).setTileScale(3).setDepth(-970);
  s.add.tileSprite(VX, ROAD_Y + ROAD_H + 10, VW, 60, 'zebra-v').setOrigin(0).setTileScale(3).setDepth(-970);
  s.floor('grass', park.x, park.y, park.w, park.h, 2, -995);
  s.floor('sand-path', parkWalk.x, parkWalk.y, parkWalk.w, parkWalk.h, 2, -991);
  s.floor('sand-path', 270, 1275, 1000, 58, 2, -991);
  s.floor('sand-path', 270, 1490, 1000, 48, 2, -991);
  s.floor('sand-path', 270, 1320, 48, 177, 2, -991);
  s.floor('sand-path', 1222, 1320, 48, 177, 2, -991);
  s.floor('sidewalk', 3100, 1167, 96, 46, 2, -991);
  s.floor('asphalt', parking.x, parking.y, parking.w, parking.h, 2, -991);

  // All street-facing buildings are on the north side.
  drawNeighborhood(s);
  const buildings = drawCityBuildings(s);
  drawTerminal(s);
  const airportAccess = drawAirportApproach(s, ROAD_Y);
  s.glow(740, 690, 155, 0xffc878, 0.13, 0.03);
  s.label('AIRPORT  →', 3014, 823, 15, '#f5e2b4', -976);
  s.add.rectangle(W - 28, ROAD_Y + 8, 7, ROAD_H - 16, 0xe2d6b6, 0.7).setOrigin(0).setDepth(-970);

  // ---- street furniture ----
  for (let x = 160; x < W; x += 330) {
    if (Math.abs(x - VX - VW / 2) < 220 || x >= terminal.x) continue;
    s.pix('streetlight', x, 900, { foot: 10, footW: 0.3 });
    s.pix('streetlight', x + 120, 1168, { foot: 10, footW: 0.3 });
  }
  s.pix('bench', 1700, 860, { foot: 18 });
  s.pix('hydrant', 640, 890, { foot: 12 });
  s.pix('bin', 1260, 890, { foot: 14 });
  s.pix('planter', 2700, 880, { foot: 24 });
  for (const x of [terminal.doorX - 248, terminal.doorX + 248]) {
    s.pix('planter', x, terminal.ground + 66, { foot: 20 });
    s.pix('streetlight', x, terminal.gateY + 82, { foot: 10, footW: 0.3 });
  }

  // signals
  const sigs: { dots: Phaser.GameObjects.Image[]; axis: 'h' | 'v' }[] = [];
  for (const [x, y, axis] of [[VX - 50, 896, 'h'], [VX + VW + 50, 1166, 'h'], [VX + VW + 50, 896, 'v'], [VX - 50, 1166, 'v']] as const) {
    s.pix('signal', x, y, { foot: 10, footW: 0.3 });
    const top = y - 150;
    const dots = [0xd94a3a, 0xe8c35a, 0x6fcf7a].map((c, i) => s.add.image(x, top + 10 + i * 13, 'dot').setScale(2.5).setTint(c).setDepth(y + 1));
    sigs.push({ dots, axis });
  }
  const airportSignX = VX - 155, airportSignY = ROAD_Y - 62;
  const airportSign = s.add.graphics().setDepth(ROAD_Y - 10);
  airportSign.fillStyle(0x445c68).fillRect(airportSignX - 6, airportSignY + 16, 11, 39);
  airportSign.fillStyle(0x93a1a0).fillRect(airportSignX - 3, airportSignY + 21, 4, 30);
  airportSign.fillStyle(0x253b49).fillRect(airportSignX - 71, airportSignY - 17, 143, 36);
  airportSign.fillStyle(0x45817d).fillRect(airportSignX - 68, airportSignY - 15, 137, 30);
  airportSign.fillStyle(0xbde1c9).fillRect(airportSignX - 65, airportSignY - 13, 131, 2);
  airportSign.fillStyle(0xf5e7bb).fillRect(airportSignX + 38, airportSignY - 2, 17, 5);
  airportSign.fillTriangle(airportSignX + 50, airportSignY - 7, airportSignX + 61, airportSignY, airportSignX + 50, airportSignY + 7);
  s.label('AIRPORT', airportSignX - 14, airportSignY + 1, 17, '#f7e9c6', ROAD_Y - 9);
  s.solid(airportSignX - 6, airportSignY + 49, 11, 8);

  let phase = 0;
  const light = (axis: 'h' | 'v') => {
    const t = phase % 16;
    if (axis === 'h') return t < 7 ? 'g' : t < 8.5 ? 'y' : 'r';
    return t >= 8.5 && t < 15 ? 'g' : t >= 15 ? 'y' : 'r';
  };

  // ---- neighborhood park ----
  const treeSpots = [[226, 1270], [418, 1280], [1110, 1280], [1310, 1268], [240, 1480], [1300, 1485], [365, 1580], [632, 1580], [970, 1580], [1230, 1580]];
  for (const [x, y] of treeSpots) s.pix('tree', x, y, { foot: 22, footW: 0.3 });
  for (const [x, y] of [[449, 1439], [1025, 1439], [770, 1538]]) s.pix('bench', x, y, { foot: 18 });
  for (const [x, y] of [[360, 1470], [1080, 1470], [610, 1381], [925, 1381]]) s.pix('planter', x, y, { scale: 2, foot: 15 });

  // Raised fountain in the center, with room to walk around it.
  s.add.ellipse(765, 1435, 190, 83, 0x837968).setDepth(1435);
  s.add.ellipse(765, 1427, 174, 66, 0xc4b99c).setDepth(1436);
  s.add.ellipse(765, 1426, 151, 48, 0x518493).setDepth(1437);
  s.add.ellipse(765, 1425, 102, 23, 0x79a4ac).setDepth(1438);
  s.add.rectangle(761, 1400, 8, 25, 0xb7d8d4).setOrigin(0).setDepth(1439);
  s.solid(690, 1405, 150, 58);
  s.label('HIGHLAND PARK', 761, 1217, 16, '#f5e2b4', 1220);

  // ---- parking bays and a clear drive aisle ----
  for (let i = 0; i <= 6; i++) {
    s.add.rectangle(2783 + i * 119, 1350, 5, 138, 0xe6dfd0, 0.75).setOrigin(0).setDepth(-960);
  }
  for (const [i, x] of [2843, 3081, 3319].entries()) {
    const y = 1475;
    const c = s.add.image(x, y, `car-v-${(i * 2 + 2) % 6}`).setOrigin(0.5, 1).setScale(2.7).setDepth(y);
    s.groundShadow(x, y - 9, c.displayWidth * 0.82, 26);
    s.solid(x - 24, y - c.displayHeight + 10, 48, c.displayHeight - 10);
  }
  s.pix('planter', 3533, 1260, { scale: 2, foot: 18 });
  s.label('PARKING', 3440, 1240, 16, '#f5e2b4', 1242);

  // ---- traffic ----
  const cars: Car[] = [];
  const lanes = [
    { axis: 'h' as const, dir: -1 as const, lane: ROAD_Y + 50 },
    { axis: 'h' as const, dir: 1 as const, lane: ROAD_Y + 140 },
    { axis: 'v' as const, dir: 1 as const, lane: VX + 48 },
    { axis: 'v' as const, dir: -1 as const, lane: VX + 132 },
  ];
  let ci = 0;
  for (const L of lanes) {
    const n = L.axis === 'h' ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const key = `car-${L.axis}-${ci++ % 6}`;
      const pos = (i / n) * (L.axis === 'h' ? W : H) + Math.random() * 200;
      const img = s.add.image(L.axis === 'h' ? pos : L.lane, L.axis === 'h' ? L.lane : pos, key).setOrigin(0.5, 1).setScale(2.6);
      s.followShadow(img, img.displayWidth * 0.87, 25, -10);
      if (L.axis === 'h' && L.dir < 0) img.setFlipX(true);
      if (L.axis === 'v' && L.dir < 0) img.setFlipY(true);
      const max = 150 + Math.random() * 60;
      cars.push({ img, axis: L.axis, dir: L.dir, lane: L.lane, v: max, max, len: L.axis === 'h' ? img.displayWidth : img.displayHeight });
    }
  }
  const carRect = (c: Car): Rect => {
    const { x, y } = c.img;
    return c.axis === 'h' ? { x: x - c.len / 2, y: y - 40, w: c.len, h: 36 } : { x: x - 28, y: y - c.len, w: 56, h: c.len };
  };
  cars.forEach((c) => s.dynamic.push({ rect: () => carRect(c) }));
  const stopH = { 1: VX - 80, [-1]: VX + VW + 80 } as Record<number, number>;
  const stopV = { 1: ROAD_Y - 80, [-1]: ROAD_Y + ROAD_H + 80 } as Record<number, number>;
  s.updaters.push((dt) => {
    phase += dt;
    for (const sg of sigs) {
      const st = light(sg.axis);
      sg.dots.forEach((d, i) => d.setAlpha((st === 'r' && i === 0) || (st === 'y' && i === 1) || (st === 'g' && i === 2) ? 1 : 0.15));
    }
    const px = s.player.x, py = s.player.y;
    for (const c of cars) {
      const pos = c.axis === 'h' ? c.img.x : c.img.y - c.len / 2;
      const front = pos + (c.dir * c.len) / 2;
      let target = c.max;
      const stop = c.axis === 'h' ? stopH[c.dir] : stopV[c.dir];
      const dStop = (stop - front) * c.dir;
      if (light(c.axis) !== 'g' && dStop > -10 && dStop < 120) target = 0;
      for (const o of cars) {
        if (o === c || o.axis !== c.axis || o.lane !== c.lane) continue;
        const opos = o.axis === 'h' ? o.img.x : o.img.y - o.len / 2;
        const gap = (opos - pos) * c.dir - (c.len + o.len) / 2;
        if (gap > 0 && gap < 70) target = 0;
      }
      const pAlong = c.axis === 'h' ? px : py - 20, pAcross = c.axis === 'h' ? py - 20 : px;
      const ahead = (pAlong - front) * c.dir;
      if (Math.abs(pAcross - (c.axis === 'h' ? c.lane - 20 : c.lane)) < 60 && ahead > -20 && ahead < 160) target = 0;
      c.v += Math.sign(target - c.v) * Math.min(Math.abs(target - c.v), (target < c.v ? 420 : 120) * dt);
      const d = c.v * dt * c.dir;
      if (c.axis === 'h') {
        c.img.x += d;
        if (c.img.x > W + 200) c.img.x = -200; if (c.img.x < -200) c.img.x = W + 200;
      } else {
        c.img.y += d;
        if (c.img.y > H + 200) c.img.y = -100; if (c.img.y < -150) c.img.y = H + 200;
      }
      c.img.setDepth(c.img.y);
    }
  });

  // ---- pedestrians ----
  const peds = [
    { key: 'ped1', y: 820, a: 80, b: 1780, x: 600 }, { key: 'ped2', y: 860, a: 2200, b: 3700, x: 2600 },
    { key: 'ped3', y: 1130, a: 80, b: 1780, x: 1200 }, { key: 'ped4', y: 1140, a: 2200, b: 3700, x: 3300 },
    { key: 'ped2', y: 1150, a: 300, b: 1700, x: 400 }, { key: 'ped1', y: 840, a: 2300, b: 3300, x: 3000 },
  ];
  peds.forEach((p, i) => {
    const sp = s.npc(p.key, p.x, p.y, `${p.key}-idle-down`);
    let dir = i % 2 ? 1 : -1, wait = 0;
    s.updaters.push((dt) => {
      if (wait > 0) { wait -= dt; sp.play(`${p.key}-idle-down`, true); return; }
      sp.x += dir * 60 * dt;
      sp.play(`${p.key}-walk-${dir > 0 ? 'right' : 'left'}`, true);
      if (sp.x < p.a || sp.x > p.b) { dir *= -1; sp.x = Phaser.Math.Clamp(sp.x, p.a, p.b); }
      if (Math.random() < 0.002) wait = 1.5 + Math.random() * 2;
      sp.setDepth(sp.y);
    });
  });
  s.npc('ped3', 1680, 845, 'ped3-idle-down');
  s.npc('ped4', 1033, 1468, 'ped4-idle-down');

  // ---- interactions ----
  s.interact('home', 380, 706, 92, 'Go Inside', () => warp('home', 1242, 1050));
  s.interact('airport', terminal.doorX, terminal.approachY, 115, 'Enter Terminal', () => s.goto('airport', AIRPORT_ENTRY.x, AIRPORT_ENTRY.y, false));
  lorelaiAtLukes(s);
  s.interact('cafe', 740, 702, 66, 'Luke’s Diner', () => say([{ speaker: 'staff', name: 'Luke’s Barista', portrait: 'staff', text: 'Coffee is on. If you have a flight, follow the road east to the airport gate.' }]));
  s.interact('local', 1680, 860, 70, 'Talk', () => say([{ speaker: 'staff', name: 'Denver Local', portrait: 'ped3', text: 'Big day? You have that look. Cross at the light, the taxis here do not wait.' }]));
  s.interact('park', 1033, 1473, 70, 'Talk', () => say([{ speaker: 'staff', name: 'Park Visitor', portrait: 'ped4', text: 'I heard about that hackathon on the radio. Earth analogs, right? Bring sunscreen.' }]));

  if (atLeast('leave')) setStage('city');

  return {
    w: W, h: H, name: 'Highland, Denver', zoom: 1.35, bg: 0x2e3d2a, mood: 'city' as const,
    spawn: { x: 380, y: 900, dir: 'down' as const },
    outline: [
      { x: 0, y: ROAD_Y, w: W, h: ROAD_H, kind: 'road' as const },
      { x: VX, y: 0, w: VW, h: H, kind: 'road' as const },
      ...buildings,
      ...airportAccess,
      { x: terminal.x, y: terminal.y, w: terminal.width, h: terminal.ground - terminal.y, label: 'Airport', kind: 'zone' as const },
      { ...parkWalk, kind: 'path' as const },
      { ...park, label: 'Highland Park', kind: 'park' as const },
      { ...parking, label: 'Parking', kind: 'parking' as const },
    ],
  };
}
BUILDERS.city = buildCity;
