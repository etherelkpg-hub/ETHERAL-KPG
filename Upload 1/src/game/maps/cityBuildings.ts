import type { WorldScene } from '../scenes/WorldScene';

export const terminal = { x: 3308, y: 117, width: 960, ground: 451, doorX: 3788, approachY: 508, gateY: 727 };

type Color = number;
type Fill = (x: number, y: number, w: number, h: number, color: Color) => void;

const ink = 0x252837;
const glass = 0x426e86;
const reflection = 0x76a5af;
const dusk = 0x304955;

function pane(fill: Fill, x: number, y: number, w: number, h: number, trim: Color, lit = false) {
  fill(x, y, w, h, ink);
  fill(x + 3, y + 3, w - 6, h - 6, lit ? 0xdba765 : glass);
  fill(x + 5, y + 5, w - 10, 5, lit ? 0xf2cb85 : reflection);
  fill(x + 5, y + h - 14, w - 10, 9, lit ? 0xbf7f4d : dusk);
  fill(x + Math.floor(w / 2) - 2, y + 3, 4, h - 6, trim);
  fill(x - 2, y + h - 1, w + 4, 5, trim);
}

const facades = [
  { cx: 380, w: 300, h: 220, ground: 664, brick: 0xb77d62, trim: 0x78534b, roof: 0x525a63, name: 'HOME', mapName: 'Home', kind: 'house' },
  { cx: 1120, w: 320, h: 293, ground: 645, brick: 0x9c6654, trim: 0x684751, roof: 0x494453, name: 'HIGHLAND APARTMENTS', mapName: 'Apartments', kind: 'brick' },
  { cx: 740, w: 255, h: 231, ground: 670, brick: 0xb88359, trim: 0x6d423b, roof: 0x53616a, name: 'LUKE’S', mapName: 'Luke’s Diner', kind: 'cafe' },
  { cx: 2464, w: 320, h: 284, ground: 648, brick: 0xa39b82, trim: 0x62626a, roof: 0x484d56, name: 'FRONT RANGE OFFICES', mapName: 'Offices', kind: 'brick' },
  { cx: 2874, w: 210, h: 192, ground: 662, brick: 0xa39376, trim: 0x65564b, roof: 0x4b555e, name: 'HIGHLAND', mapName: 'Highland House', kind: 'house' },
] as const;

export function drawCityBuildings(s: WorldScene) {
  return facades.flatMap(({ cx, w, h, ground, brick, trim, roof, name, mapName, kind }) => {
    const x = cx - w / 2;
    const y = ground - h;
    const path = { x: cx - 34, y: ground - 2, w: 68, h: 764 - ground, kind: 'path' as const };
    s.floor('sidewalk', path.x, path.y, path.w, path.h, 1.6, -991);
    for (const curbX of [path.x, path.x + path.w - 4]) {
      s.add.rectangle(curbX, ground, 4, path.h - 2, 0x9a8d6e).setOrigin(0).setDepth(-990);
    }
    s.pix('shrub', cx - w / 2 + 24, ground + 24, { scale: 2, foot: 12 });
    s.pix('shrub', cx + w / 2 - 24, ground + 24, { scale: 2, foot: 12 });
    const g = s.add.graphics().setDepth(ground);
    const fill: Fill = (a, b, c, d, color) => { g.fillStyle(color).fillRect(a, b, c, d); };
    s.groundShadow(cx, ground + 2, w + 34, 34, 0.32);
    const side = 25;
    g.fillStyle(trim).fillPoints([
      { x: x + w - 2, y: y + 39 }, { x: x + w + side, y: y + 16 },
      { x: x + w + side, y: ground - 23 }, { x: x + w - 2, y: ground },
    ], true);
    g.fillStyle(ink, 0.22).fillPoints([
      { x: x + w + 7, y: y + 42 }, { x: x + w + side, y: y + 16 },
      { x: x + w + side, y: ground - 23 }, { x: x + w + 7, y: ground - 7 },
    ], true);
    fill(x, y + 34, w, h - 34, ink);
    fill(x + 5, y + 39, w - 10, h - 43, brick);
    fill(x + 5, y + 39, w - 10, 11, trim);
    for (let row = y + 63; row < ground - 15; row += 22) {
      fill(x + 6, row, w - 12, 2, trim);
      for (let joint = x + 30 + ((row - y) % 44 >= 22 ? 24 : 0); joint < x + w - 12; joint += 58) {
        fill(joint, row - 17, 2, 16, trim);
      }
    }
    if (kind === 'house') {
      g.fillStyle(roof).fillPoints([
        { x: cx, y: y - 38 }, { x: cx + side, y: y - 61 },
        { x: x + w + side + 9, y: y + 30 }, { x: x + w + 12, y: y + 53 },
      ], true);
      g.fillStyle(ink).fillTriangle(x - 12, y + 53, cx, y - 38, x + w + 12, y + 53);
      g.fillStyle(roof).fillTriangle(x + 5, y + 47, cx, y - 29, x + w - 5, y + 47);
      fill(x - 10, y + 47, w + 20, 10, ink);
      fill(x + 9, y + 55, w - 18, 5, trim);
      pane(fill, cx - 25, y + 8, 50, 35, trim);
    } else {
      g.fillStyle(roof).fillPoints([
        { x: x - 5, y: y + 22 }, { x: x + side - 5, y: y - 3 },
        { x: x + w + side + 5, y: y - 3 }, { x: x + w + 5, y: y + 22 },
      ], true);
      g.lineStyle(4, reflection, 0.6).lineBetween(x + side - 5, y - 3, x + w + side + 5, y - 3);
      fill(x - 5, y + 20, w + 10, 27, ink);
      fill(x, y + 22, w, 15, roof);
      fill(x, y + 22, w, 3, reflection);
      fill(x, y + 43, w, 6, trim);
    }
    if (kind === 'brick') {
      for (const row of [y + 71, y + 149]) {
        for (let col = x + 28; col + 61 < x + w - 12; col += 98) {
          pane(fill, col, row, 62, 52, trim, col === x + 126);
          fill(col - 6, row + 42, 74, 5, ink);
          fill(col - 6, row + 55, 74, 6, roof);
          for (let bar = col - 5; bar < col + 68; bar += 10) fill(bar, row + 43, 3, 14, ink);
          fill(col + 3, row + 49, 19, 5, 0x5b7450);
        }
      }
    } else if (kind === 'house') {
      pane(fill, x + 23, ground - 130, 61, 58, trim);
      pane(fill, x + w - 84, ground - 130, 61, 58, trim, true);
    } else {
      pane(fill, x + 15, ground - 100, 74, 79, trim, true);
      pane(fill, x + w - 89, ground - 100, 74, 79, trim, true);
      fill(x - 3, ground - 116, w + 6, 18, ink);
      for (let stripe = x; stripe < x + w; stripe += 18) {
        fill(stripe, ground - 115, Math.min(18, x + w - stripe), 15, (stripe - x) % 36 ? 0xe1bd8c : 0x9e5148);
      }
    }
    fill(cx - 39, ground - 91, 78, 91, ink);
    fill(cx - 33, ground - 86, 66, 82, trim);
    fill(cx - 26, ground - 80, 52, 33, kind === 'house' ? 0xd3a975 : glass);
    fill(cx + 15, ground - 39, 8, 4, 0xe7bf7e);
    fill(cx - 44, ground - 5, 88, 5, 0xcab9a0);
    const signW = kind === 'brick' ? 225 : kind === 'cafe' ? 208 : 115;
    const signY = kind === 'brick' ? ground - 128 : kind === 'cafe' ? ground - 153 : ground - 165;
    fill(cx - 48, ground, 96, 5, 0xb7a68f);
    fill(cx - 48, ground + 5, 96, 3, 0x7a6d65);
    if (kind === 'cafe') {
      // Luke's yellow mug sign, drawn on the storefront in the game's palette.
      const cupY = signY - 19;
      fill(cx - 82, cupY - 5, 164, 52, 0x51383a);
      fill(cx + 48, cupY + 7, 19, 25, 0xe7a74f);
      fill(cx + 50, cupY + 12, 11, 14, 0x51383a);
      fill(cx - 52, cupY, 106, 29, 0xffce5d);
      fill(cx - 45, cupY + 28, 92, 7, 0xf1ae51);
      fill(cx - 37, cupY + 34, 76, 4, 0xd98d42);
      s.label(name, cx - 1, cupY + 15, 19, '#633537', ground + 1);
    } else {
      fill(cx - signW / 2, signY, signW, 28, trim);
      s.label(name, cx, signY + 14, kind === 'brick' ? 14 : 16, '#f5dfb5', ground + 1);
    }
    s.solid(x + 5, y + 43, w - 10, h - 43);
    s.solid(x + w - 5, y + 42, side + 5, h - 66);
    return [path, { x, y, w, h, label: mapName, kind: 'building' as const }];
  });
}

export function drawNeighborhood(s: WorldScene) {
  s.floor('sidewalk', 0, 733, 3070, 40, 2, -994);
  for (const [x, y] of [[118, 718], [570, 717], [923, 716], [1284, 728], [1750, 724], [2220, 728], [2675, 729], [3040, 730],
    [175, 1161], [520, 1161], [960, 1161], [1410, 1161], [2330, 1161], [2730, 1161], [4150, 1161]]) {
    s.add.rectangle(x, y - 15, 108, 43, 0x847e70).setDepth(y - 26);
    s.add.rectangle(x, y - 15, 98, 33, 0x4e6942).setDepth(y - 25);
    s.pix('tree', x, y, { scale: 2.4, foot: 20, footW: 0.28 });
  }
  for (const x of [1290, 2275, 2990]) s.pix('bench', x, 871, { scale: 2.2, foot: 17 });
  for (const x of [100, 1090, 2380, 2880]) s.pix('planter', x, 866, { scale: 2, foot: 17 });
  s.floor('sidewalk', 637, 671, 205, 87, 1.5, -993);
  for (const x of [658, 822]) {
    s.pix('coffee', x, 710, { scale: 1.6, foot: 18, footW: 0.74 });
    s.add.ellipse(x, 672, 65, 24, 0x574047, 0.24).setDepth(671);
    s.add.ellipse(x, 669, 58, 22, 0xe8c792).setDepth(672);
    s.add.rectangle(x - 22, 668, 44, 2, 0xf4e1b4).setOrigin(0).setDepth(673);
  }
}

function drawApron(s: WorldScene) {
  const { x, width, doorX } = terminal;
  s.floor('sidewalk', x - 92, 0, width + 184, 135, 2, -995);
  s.floor('asphalt', x - 92, 12, width + 184, 54, 2, -994);
  for (let xx = x - 66; xx < x + width + 70; xx += 68) {
    s.add.rectangle(xx, 37, 39, 4, 0xd5b266).setOrigin(0).setDepth(-990);
  }
  s.solid(x - 92, 0, width + 184, 143);
  const apron = s.add.graphics().setDepth(149);
  const fill: Fill = (a, b, w, h, color) => { apron.fillStyle(color).fillRect(a, b, w, h); };

  const plane = doorX + 102;
  fill(plane + 19, 124, 301, 10, 0x62616c);
  apron.fillStyle(0x326488).fillTriangle(plane + 266, 101, plane + 306, 51, plane + 320, 103);
  fill(plane + 12, 94, 299, 24, 0xe6e4d4);
  fill(plane, 101, 316, 13, 0xf1ead7);
  fill(plane + 17, 112, 292, 5, 0x5a8195);
  fill(plane + 15, 98, 19, 7, 0x375669);
  for (let i = 49; i < 265; i += 13) fill(plane + i, 101, 7, 5, 0x557483);
  apron.fillStyle(0x97aab1).fillTriangle(plane + 126, 110, plane + 197, 110, plane + 233, 139);
  fill(plane + 173, 125, 38, 9, 0x648498);

  const tower = x + 46;
  fill(tower + 26, 41, 55, 213, 0x434450);
  fill(tower + 32, 43, 43, 212, 0xaba396);
  fill(tower + 67, 45, 8, 209, 0x817f80);
  for (let y = 103; y < 225; y += 26) fill(tower + 47, y, 15, 14, 0x46697b);
  fill(tower - 3, 30, 115, 54, 0x303e4b);
  fill(tower + 4, 37, 101, 32, 0x5892a1);
  for (let xx = tower + 21; xx < tower + 103; xx += 23) fill(xx, 37, 4, 33, 0x324e60);
  fill(tower + 2, 69, 105, 8, 0xc2b6a4);
  fill(tower + 51, 13, 6, 18, 0x404a55);
  apron.fillStyle(0xcec9b3).fillCircle(tower + 54, 15, 14);
}

export function drawAirportApproach(s: WorldScene, streetY: number) {
  const { x, width, doorX, ground, gateY } = terminal;
  const roadWidth = 290;
  const roadLeft = doorX - roadWidth / 2;
  const roadRight = roadLeft + roadWidth;
  const roadTop = ground + 93;
  const yardLeft = x - 82;
  const yardRight = x + width + 82;
  const pathWidth = 51;

  s.floor('asphalt', roadLeft, roadTop, roadWidth, streetY - roadTop, 2, -989);
  s.floor('sidewalk', roadLeft - pathWidth, roadTop, pathWidth, streetY - roadTop, 2, -989);
  s.floor('sidewalk', roadRight, roadTop, pathWidth, streetY - roadTop, 2, -989);
  s.add.tileSprite(doorX - 2, roadTop + 35, 4, streetY - roadTop - 35, 'lane-v')
    .setOrigin(0).setTileScale(2).setDepth(-978);
  for (const curbX of [roadLeft, roadRight - 4]) {
    s.add.rectangle(curbX, roadTop, 4, streetY - roadTop, 0xc4b58f).setOrigin(0).setDepth(-979);
  }
  for (let stripe = roadLeft + 12; stripe < roadRight - 14; stripe += 32) {
    s.add.rectangle(stripe, roadTop + 21, 17, 31, 0xdfd5bb).setOrigin(0).setDepth(-977);
  }

  const gate = s.add.graphics().setDepth(gateY + 26);
  const draw: Fill = (a, b, w, h, color) => { gate.fillStyle(color).fillRect(a, b, w, h); };
  const fence = (left: number, right: number) => {
    draw(left, gateY - 22, right - left, 5, 0x536773);
    draw(left, gateY - 6, right - left, 5, 0x778891);
    for (let post = left; post < right - 3; post += 28) draw(post, gateY - 26, 4, 29, 0x374958);
    s.solid(left, gateY - 4, right - left, 11);
  };
  fence(yardLeft, roadLeft - pathWidth);
  fence(roadRight + pathWidth, yardRight);
  for (const sideX of [yardLeft, yardRight - 6]) {
    draw(sideX, ground + 15, 6, gateY - ground - 14, 0x536773);
    for (let postY = ground + 22; postY < gateY; postY += 34) draw(sideX - 2, postY, 10, 5, 0x73838c);
    s.solid(sideX, ground + 15, 6, gateY - ground - 8);
  }

  for (const post of [roadLeft - pathWidth - 9, roadRight + pathWidth - 9]) {
    draw(post, gateY - 54, 18, 65, 0x263747);
    draw(post + 4, gateY - 51, 10, 59, 0x819697);
    draw(post + 5, gateY - 49, 8, 7, 0xe7bd6a);
    s.solid(post, gateY - 6, 18, 17);
  }
  const marker = roadLeft - pathWidth - 150;
  draw(marker + 17, gateY - 38, 8, 49, 0x384955);
  draw(marker + 117, gateY - 38, 8, 49, 0x384955);
  draw(marker, gateY - 58, 142, 33, 0x233846);
  draw(marker + 3, gateY - 56, 136, 3, 0x9dc5bd);
  s.solid(marker + 17, gateY + 3, 8, 8);
  s.solid(marker + 117, gateY + 3, 8, 8);
  s.label('AIRPORT  →', marker + 71, gateY - 41, 15, '#f5e6bb', gateY + 27);

  // Raised gate arm beside the lane leaves the road and both footpaths open.
  draw(roadRight - 4, gateY - 2, 16, 15, 0x2d3f4e);
  for (let i = 0; i < 6; i++) draw(roadRight + 2, gateY - 53 + i * 9, 6, 9, i % 2 ? 0xd1c7a9 : 0xa75347);
  s.solid(roadRight - 4, gateY - 2, 16, 15);
  s.label('TERMINAL  ↑', doorX, streetY - 26, 16, '#f1e1b9', -976);

  return [
    { x: roadLeft - pathWidth, y: roadTop, w: pathWidth, h: streetY - roadTop, kind: 'path' as const },
    { x: roadLeft, y: roadTop, w: roadWidth, h: streetY - roadTop, kind: 'road' as const },
    { x: roadRight, y: roadTop, w: pathWidth, h: streetY - roadTop, kind: 'path' as const },
    { x: marker, y: gateY - 58, w: 142, h: 69, label: 'Airport Gate', kind: 'zone' as const },
  ];
}

export function drawTerminal(s: WorldScene) {
  drawApron(s);
  const { x, y, width, ground, doorX } = terminal;
  const right = x + width;
  const g = s.add.graphics().setDepth(ground);
  const fill: Fill = (a, b, w, h, color) => { g.fillStyle(color).fillRect(a, b, w, h); };

  s.floor('sidewalk', x - 24, ground, width + 48, 129, 2, -995);
  const plaza = s.add.graphics().setDepth(-988);
  s.groundShadow(x + width / 2, ground + 2, width + 30, 46, 0.32);
  plaza.fillStyle(0xc8c5b2).fillRect(x + 7, ground + 9, width - 14, 105);
  for (let i = 0; i < 3; i++) {
    plaza.fillStyle(0xb0b09f).fillRect(x + 7, ground + 16 + i * 38, width - 14, 2);
  }
  for (let xx = x + 34; xx < right - 14; xx += 68) {
    plaza.fillStyle(0xb0b09f).fillRect(xx, ground + 9, 2, 105);
  }
  plaza.fillStyle(0xddd4b8).fillRect(doorX - 83, ground + 4, 166, 109);
  plaza.fillStyle(0xa6a390).fillRect(doorX - 83, ground + 111, 166, 4);

  g.fillStyle(0x56717c).fillPoints([
    { x: x + 5, y: y + 88 }, { x: x + 62, y: y + 44 },
    { x: right + 40, y: y + 44 }, { x: right - 5, y: y + 88 },
  ], true);
  g.fillStyle(0x3d5664).fillPoints([
    { x: right - 6, y: y + 88 }, { x: right + 40, y: y + 44 },
    { x: right + 40, y: ground - 45 }, { x: right - 6, y: ground },
  ], true);
  // Low side wings frame the taller glass entrance pavilion.
  fill(x + 5, y + 88, width - 10, ground - y - 88, 0x314552);
  fill(x + 14, y + 103, width - 28, ground - y - 108, 0xc0c3b2);
  for (const left of [x + 14, right - 271]) {
    fill(left - 8, y + 81, 265, 22, 0x3d5664);
    fill(left - 7, y + 81, 263, 5, 0xb7c6c0);
    fill(left, y + 118, 257, 165, 0x243f53);
    for (let col = 0; col < 5; col++) {
      const xx = left + 7 + col * 49;
      fill(xx, y + 124, 44, 151, 0x508294);
      fill(xx + 3, y + 129, 38, 42, 0x78a5a9);
      fill(xx + 3, y + 210, 38, 59, 0x375e73);
      fill(xx, y + 198, 44, 4, 0x2c4c5d);
      fill(xx + 7, y + 224 + (col % 2) * 8, 16, 7, 0x9d9b74);
      fill(xx + 32, y + 126, 3, 142, 0x9ab8b6);
    }
    fill(left, y + 284, 257, 8, 0x50626a);
  }

  const roof = [
    { x: doorX - 219, y: y + 84 }, { x: doorX - 170, y: y + 40 },
    { x: doorX - 91, y: y + 17 }, { x: doorX + 91, y: y + 17 },
    { x: doorX + 170, y: y + 40 }, { x: doorX + 219, y: y + 84 },
  ];
  g.fillStyle(0x304653).fillPoints(roof, true);
  g.fillStyle(0x9caba8).fillPoints(roof.map(({ x, y }, i) => ({ x: x + (i < 3 ? 9 : -9), y: y + 6 })), true);
  fill(doorX - 203, y + 80, 406, ground - y - 80, 0x344e60);
  fill(doorX - 191, y + 87, 382, 194, 0x69949e);
  fill(doorX - 185, y + 94, 370, 180, 0x547f90);
  fill(doorX - 185, y + 168, 370, 44, 0x476b7b);
  fill(doorX - 185, y + 232, 370, 43, 0x416476);
  for (let xx = doorX - 180; xx < doorX + 185; xx += 51) {
    fill(xx, y + 92, 5, 191, 0x2a495e);
    fill(xx + 6, y + 96, 2, 171, 0x94b2b3);
    g.fillStyle(0xa8ccd0, 0.34).fillTriangle(xx + 10, y + 99, xx + 41, y + 99, xx + 10, y + 165);
  }
  for (const beam of [y + 154, y + 224]) {
    fill(doorX - 188, beam, 376, 5, 0x35586a);
  }

  fill(doorX - 178, y + 106, 356, 38, 0x243d50);
  fill(doorX - 174, y + 109, 348, 2, 0x8bb5b0);
  s.label('FRONT RANGE AIRPORT', doorX, y + 126, 23, '#f5edcf', ground + 2);

  // A glass canopy and lit recess lead into the open sliding doors.
  fill(doorX - 167, ground - 100, 334, 100, 0x263e52);
  fill(doorX - 147, ground - 97, 294, 91, 0x426476);
  fill(doorX - 53, ground - 92, 106, 87, 0x213f53);
  fill(doorX - 50, ground - 84, 100, 7, 0xd3ba7b);
  fill(doorX - 50, ground - 25, 100, 21, 0x587b86);
  for (const xx of [doorX - 139, doorX + 58]) {
    fill(xx, ground - 91, 81, 84, 0x294c62);
    fill(xx + 5, ground - 85, 71, 76, 0x77a4ad);
    fill(xx + 8, ground - 81, 63, 4, 0xb5d1c9);
    fill(xx + 36, ground - 85, 4, 76, 0x41697d);
  }
  fill(doorX - 176, ground - 119, 352, 25, 0x2d4d60);
  fill(doorX - 176, ground - 119, 352, 5, 0xadc4c0);
  for (let xx = doorX - 159; xx < doorX + 159; xx += 28) {
    fill(xx, ground - 112, 23, 10, 0x83a9b0);
  }
  for (const xx of [doorX - 170, doorX + 158]) {
    fill(xx, ground - 96, 12, 91, 0x8ea7a8);
    fill(xx + 1, ground - 96, 4, 91, 0xbdc9b8);
  }
  fill(doorX - 144, ground - 5, 288, 5, 0xb3c3ba);
  s.label('DEPARTURES', doorX, ground - 107, 13, '#f5edcf', ground + 3);
  s.label('ENTRANCE  ↑', doorX, ground + 78, 15, '#4b6570', -980);

  for (const xx of [x + 100, right - 100]) {
    s.pix('planter', xx, ground + 76, { scale: 3, foot: 18 });
    s.pix('tree', xx + (xx < doorX ? 83 : -83), ground + 67, { scale: 2, foot: 20, footW: 0.28 });
  }
  for (const xx of [doorX - 208, doorX + 208]) {
    s.pix('streetlight', xx, ground + 79, { scale: 1.15, foot: 7, footW: 0.4 });
  }

  s.solid(x, y + 39, width, ground - y - 62);
  s.solid(right, y + 48, 40, ground - y - 93);
  s.solid(x, ground - 23, doorX - 131 - x, 23);
  s.solid(doorX + 131, ground - 23, right - doorX - 131, 23);
}
