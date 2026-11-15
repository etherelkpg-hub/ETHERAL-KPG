import { audio } from '../audio';
import { say } from '../story';
import { store } from '../store';
import type { WorldScene } from '../scenes/WorldScene';

const wall = -410;
const floor = -850;
const wood = 0x8e573c;
const edge = 0x49322a;
const cream = 0xf1dfc3;
const steel = 0x627679;

function box(s: WorldScene, x: number, y: number, w: number, h: number, color: number, depth = wall, alpha = 1) {
  s.add.rectangle(x, y, w, h, color, alpha).setOrigin(0).setDepth(depth);
}

const doorFrame = 0x694433;
const doorFace = 0xb27a51;
const doorHighlight = 0xd59f68;
const doorLatch = 0xe8c681;

export function openInteriorDoor(s: WorldScene, left: number, right: number, top: number, length: number) {
  const bottom = top + length;
  const hinge = right - 15;
  const leafEnd = top + 71;
  box(s, left, top, right - left, length, 0xa47755, -805);
  box(s, left + 5, top + 2, right - left - 10, length - 4, 0xbf946d, -804);
  box(s, left - 3, top, 8, length, doorFrame, bottom);
  box(s, right - 5, top, 8, length, doorFrame, bottom);
  box(s, left - 1, top, 3, length, doorHighlight, bottom + 1);
  box(s, right, top, 2, length, doorHighlight, bottom + 1);

  box(s, hinge, top + 4, 14, 67, doorFrame, leafEnd);
  box(s, hinge + 2, top + 6, 9, 62, doorFace, leafEnd);
  box(s, hinge + 3, top + 9, 3, 54, doorHighlight, leafEnd);
  box(s, hinge + 7, leafEnd - 12, 5, 4, doorLatch, leafEnd + 1);
  s.solid(hinge, top + 4, 14, 67);
}

export function openSideDoor(s: WorldScene, left: number, top: number, bottom: number) {
  const right = left + 24;
  const leafLeft = left - 45;
  box(s, left, top, 24, bottom - top, 0xa47755, -805);
  box(s, left + 2, top + 5, 20, bottom - top - 10, 0xbf946d, -804);
  box(s, left - 2, top - 3, 28, 8, doorFrame, top + 6);
  box(s, left - 2, bottom - 5, 28, 8, doorFrame, bottom + 3);
  box(s, left, bottom - 5, 24, 3, doorHighlight, bottom + 4);

  box(s, leafLeft, top + 4, right - leafLeft, 14, doorFrame, top + 18);
  box(s, leafLeft + 2, top + 6, right - leafLeft - 4, 9, doorFace, top + 18);
  box(s, leafLeft + 4, top + 7, right - leafLeft - 10, 3, doorHighlight, top + 18);
  box(s, leafLeft + 8, top + 11, 4, 4, doorLatch, top + 19);
  s.solid(leafLeft, top + 4, right - leafLeft, 14);
}

function shelf(s: WorldScene, x: number, y: number, width: number) {
  box(s, x + 4, y + 4, width, 8, edge, wall, 0.5);
  box(s, x + 8, y + 4, 6, 12, edge);
  box(s, x + width - 14, y + 4, 6, 12, edge);
  box(s, x, y, width, 7, wood);
  [0xa94c3b, 0x527c8c, 0xcda25d].forEach((color, i) => {
    const h = 13 + i * 3;
    box(s, x + 8 + i * 8, y - h, 7, h, color);
  });
  s.prop('home-plant', x + width - 14, y + 1, 23, { solid: false, depth: wall });
}

function lamp(s: WorldScene, x: number, y: number) {
  box(s, x + 2, y, 16, 25, edge);
  box(s, x + 5, y + 4, 10, 16, 0xffce79);
  box(s, x + 8, y + 6, 4, 11, 0xffeab4);
  box(s, x, y, 20, 4, edge);
  s.glow(x + 10, y + 13, 63, 0xffbf72, 0.24);
}

type Pixel = [x: number, y: number, width: number, height: number, color: string];

export function buildHomeFurniture(s: WorldScene) {
  const ink = '#342632', oak = '#875239', light = '#ba8055', amber = '#d49a42';
  const linen = '#e6d5af', teal = '#397b7b', shade = '#254d58', green = '#698443';
  const shadow = '#25232b';
  const draw = (name: string, w: number, h: number, pixels: Pixel[]) => {
    if (s.textures.exists(name)) return;
    const texture = s.textures.createCanvas(name, w, h)!;
    const context = texture.getContext();
    for (const [x, y, width, height, color] of pixels) {
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
    }
    texture.refresh();
  };
  draw('home-bed', 42, 48, [
    [3, 2, 36, 45, ink], [5, 3, 32, 12, oak], [6, 4, 30, 2, light],
    [5, 14, 32, 26, '#ad9c83'], [7, 13, 28, 10, linen], [9, 14, 24, 2, '#fff0c7'],
    [5, 23, 32, 18, shade], [7, 23, 28, 16, teal], [7, 25, 28, 3, '#64a19a'],
    [9, 30, 24, 1, '#4b8c86'], [5, 40, 32, 5, oak], [6, 40, 30, 1, light],
  ]);
  draw('home-desk', 48, 37, [
    [3, 30, 42, 5, shadow], [4, 23, 13, 13, ink], [6, 25, 10, 8, oak],
    [7, 26, 8, 1, light], [7, 29, 8, 1, light], [10, 27, 3, 1, linen], [10, 31, 3, 1, linen],
    [38, 23, 5, 13, ink], [39, 24, 3, 10, oak], [17, 24, 21, 3, oak],
    [1, 15, 46, 10, ink], [3, 16, 42, 6, light], [3, 22, 42, 2, oak],
    [4, 16, 40, 1, '#d3a275'],
    [12, 3, 23, 13, ink], [14, 5, 19, 9, '#68aebd'], [15, 10, 17, 3, '#3a697e'],
    [15, 5, 12, 1, '#9cd4d1'], [22, 15, 3, 3, ink], [18, 17, 11, 2, shadow],
    [17, 20, 14, 2, shadow], [34, 19, 3, 2, ink], [5, 18, 5, 3, linen],
  ]);
  draw('home-wardrobe', 27, 46, [
    [1, 1, 25, 44, ink], [3, 3, 21, 38, oak], [3, 3, 21, 2, light],
    [5, 7, 7, 25, light], [15, 7, 7, 25, light], [6, 8, 5, 22, oak],
    [16, 8, 5, 22, oak], [10, 19, 2, 5, linen], [15, 19, 2, 5, linen],
    [5, 35, 17, 5, light], [11, 37, 5, 1, ink],
  ]);
  draw('home-bookcase', 26, 44, [
    [1, 1, 24, 42, ink], [3, 3, 20, 38, oak], [3, 3, 20, 2, light],
    ...[6, 17, 28].flatMap((y): Pixel[] => [
      [4, y, 18, 10, shadow], [5, y + 2, 3, 7, teal], [9, y + 1, 3, 8, amber],
      [13, y + 3, 2, 6, linen], [16, y + 2, 4, 7, '#a85e4e'], [4, y + 9, 18, 2, light],
    ]),
  ]);
  const gold = '#b5762f', goldLight = '#e6b25b';
  draw('home-sofa', 70, 28, [
    [3, 3, 64, 23, ink], [5, 4, 60, 14, gold], [7, 5, 56, 10, amber],
    [7, 5, 56, 2, goldLight], [24, 7, 1, 9, gold], [45, 7, 1, 9, gold],
    [8, 16, 54, 7, goldLight], [8, 20, 54, 3, amber],
    [3, 12, 6, 11, gold], [61, 12, 6, 11, gold],
    [4, 12, 4, 2, goldLight], [62, 12, 4, 2, goldLight],
    [6, 23, 58, 3, '#935527'], [5, 26, 5, 2, oak], [60, 26, 5, 2, oak],
  ]);
  draw('home-sofa-side', 26, 52, [
    [3, 2, 21, 48, ink], [4, 4, 18, 44, gold], [8, 8, 13, 34, amber],
    [9, 10, 11, 13, goldLight], [9, 26, 11, 13, goldLight], [4, 5, 5, 42, gold],
    [5, 6, 2, 40, goldLight], [8, 4, 14, 5, gold], [8, 43, 14, 5, gold],
    [6, 48, 5, 3, oak], [19, 48, 4, 3, oak],
  ]);
  draw('home-tv-table', 50, 25, [
    [4, 18, 42, 5, shadow], [5, 19, 5, 5, ink], [40, 19, 5, 5, ink],
    [2, 2, 46, 19, ink], [4, 3, 42, 7, oak], [6, 3, 17, 5, light],
    [27, 3, 17, 5, light], [19, 5, 3, 1, linen], [28, 5, 3, 1, linen],
    [3, 9, 44, 7, light], [4, 9, 42, 1, '#d3a275'], [5, 14, 40, 1, '#a16c48'],
    [4, 16, 42, 4, oak], [5, 19, 40, 1, '#693e32'],
  ]);
  draw('home-side-table', 25, 25, [
    [4, 20, 17, 4, shadow], [4, 13, 4, 10, ink], [17, 13, 4, 10, ink],
    [6, 13, 2, 9, oak], [17, 13, 2, 9, oak], [6, 17, 13, 3, oak],
    [2, 4, 21, 11, ink], [3, 5, 19, 7, light], [4, 6, 17, 1, '#d3a275'],
    [3, 12, 19, 2, oak],
  ]);
  draw('home-tv', 52, 26, [
    [2, 1, 48, 21, ink], [4, 2, 44, 2, '#65858b'], [4, 4, 44, 16, '#43535b'],
    [8, 6, 36, 12, '#35454e'], [19, 10, 14, 1, '#263039'], [19, 12, 14, 1, '#263039'],
    [19, 14, 14, 1, '#263039'], [25, 21, 2, 4, ink], [16, 24, 20, 2, ink],
  ]);
  draw('sisters-cat', 28, 22, [
    [2, 7, 4, 2, ink], [1, 8, 3, 5, ink], [2, 12, 5, 4, ink],
    [4, 14, 7, 3, ink], [3, 8, 2, 5, '#b97443'], [4, 12, 4, 3, '#b97443'],
    [6, 11, 17, 9, ink], [8, 10, 13, 9, '#d28d50'],
    [9, 11, 11, 3, '#edb36e'], [8, 14, 2, 3, '#9b593c'],
    [12, 11, 2, 4, '#a76641'], [15, 12, 2, 3, '#a76641'],
    [7, 18, 5, 3, ink], [16, 18, 7, 3, ink], [8, 18, 3, 2, '#f3d5a4'],
    [17, 18, 5, 2, '#f3d5a4'],
    [16, 3, 4, 6, ink], [22, 3, 4, 6, ink], [17, 2, 2, 4, ink], [23, 2, 2, 4, ink],
    [17, 4, 2, 3, '#de9764'], [23, 4, 2, 3, '#de9764'],
    [15, 7, 12, 9, ink], [16, 8, 10, 7, '#dd9a59'],
    [18, 8, 2, 2, '#a6653d'], [22, 8, 2, 2, '#a6653d'],
    [17, 11, 2, 1, '#262635'], [23, 11, 2, 1, '#262635'],
    [18, 13, 7, 3, '#ffe0b1'], [20, 13, 2, 1, '#a25760'],
    [20, 14, 2, 1, '#573d39'],
  ]);
  draw('home-plant', 17, 24, [
    [7, 3, 3, 13, green], [2, 5, 6, 4, '#5d823e'], [9, 5, 6, 4, '#496b3a'],
    [1, 10, 7, 4, '#46673d'], [9, 10, 7, 4, green], [5, 2, 6, 4, '#88a354'],
    [4, 15, 9, 8, ink], [4, 15, 9, 3, '#c48662'], [5, 18, 7, 4, '#9c5d49'],
  ]);
}

export function dressBedroom(s: WorldScene) {
  shelf(s, 25, 76, 71);
  lamp(s, 179, 91);
  s.deco('painting', 270, 105, 1.85);
  s.deco('painting2', 350, 105, 1.8);
  box(s, 198, 347, 226, 128, 0x173c3e, floor);
  box(s, 203, 352, 216, 118, 0x557d6e, floor);
  box(s, 208, 357, 206, 108, 0x275355, floor);
  for (const x of [225, 266, 307, 348, 389]) {
    box(s, x, 366, 8, 3, 0x759688, floor);
    box(s, x, 452, 8, 3, 0x759688, floor);
  }
}

export function dressBathroom(s: WorldScene) {
  const x = 620, y = 150;
  const chrome = 0x596d73, tile = 0x7caaa6, porcelain = 0xf4e9d9;
  const fixture = (dx: number, dy: number, w: number, h: number, color: number, depth = wall, alpha = 1) =>
    box(s, x + dx, y + dy, w, h, color, depth, alpha);

  // Fixtures meet the rear wall at y = 150.
  fixture(0, -110, 96, 110, 0x6f969a, wall, 0.32);
  fixture(22, -83, 4, 81, chrome);
  fixture(23, -86, 28, 4, chrome);
  fixture(45, -81, 17, 5, chrome);
  fixture(46, -77, 15, 2, 0xadc0bf);
  fixture(17, -39, 14, 7, chrome);
  fixture(18, -40, 5, 2, 0xdce0d3);
  fixture(61, -38, 22, 4, chrome);
  fixture(64, -48, 5, 10, 0x85aaa0);
  fixture(73, -51, 6, 13, 0xe3c699);

  const showerFront = y + 78;
  fixture(0, 0, 97, 78, 0x576f73, floor);
  fixture(4, 1, 89, 71, tile, floor);
  for (const row of [20, 43, 64]) fixture(4, row, 89, 1, 0x628c8c, floor);
  for (const col of [27, 51, 75]) fixture(col, 1, 1, 71, 0x628c8c, floor);
  fixture(37, 51, 14, 10, chrome, floor);
  for (const col of [39, 43, 47]) fixture(col, 53, 1, 6, 0x405a61, floor);
  fixture(1, -63, 94, 139, 0xa5d5d5, showerFront, 0.15);
  fixture(3, -51, 2, 110, 0xe1f4eb, showerFront, 0.54);
  fixture(75, -46, 3, 89, 0xe1f4eb, showerFront, 0.36);
  for (const col of [0, 47, 94]) fixture(col, -64, 3, 140, chrome, showerFront);
  fixture(0, -64, 97, 3, chrome, showerFront);
  fixture(0, 73, 97, 5, chrome, showerFront);
  fixture(53, 5, 11, 3, 0xe8ede1, showerFront);
  s.solid(x, y, 97, 78);

  const toiletFront = y + 55;
  fixture(115, -19, 43, 37, 0xc7b6a6, toiletFront);
  fixture(118, -19, 37, 32, porcelain, toiletFront);
  fixture(113, -22, 47, 6, 0xffefdb, toiletFront);
  fixture(145, -12, 7, 3, chrome, toiletFront);
  fixture(123, 30, 26, 25, 0xd1c2b1, toiletFront);
  s.add.ellipse(x + 136, y + 34, 48, 33, 0xcdbdab).setDepth(toiletFront);
  s.add.ellipse(x + 136, y + 27, 46, 27, porcelain).setDepth(toiletFront);
  s.add.ellipse(x + 136, y + 27, 30, 15, 0xa4b3ad).setDepth(toiletFront);
  s.solid(x + 112, y, 48, 55);

  fixture(175, -88, 79, 66, 0x644938);
  fixture(180, -83, 69, 56, 0x9fbbb9);
  fixture(181, -82, 67, 3, 0xd8e4d8);
  fixture(190, -76, 5, 38, 0xe6f1e3, wall, 0.65);
  fixture(199, -71, 2, 28, 0xe6f1e3, wall, 0.52);
  fixture(259, -56, 7, 22, chrome);
  fixture(255, -49, 11, 16, 0xd9c6a8);

  const vanityFront = y + 46;
  fixture(173, 40, 83, 7, 0x36575b, floor, 0.30);
  fixture(173, 12, 83, 29, 0x7d563f, vanityFront);
  fixture(177, 16, 36, 20, 0xa87752, vanityFront);
  fixture(216, 16, 36, 20, 0xa87752, vanityFront);
  fixture(207, 24, 3, 7, 0xf3cd96, vanityFront);
  fixture(220, 24, 3, 7, 0xf3cd96, vanityFront);
  fixture(171, -2, 87, 16, porcelain, vanityFront);
  fixture(171, 11, 87, 4, 0xb8a493, vanityFront);
  s.add.ellipse(x + 214, y + 5, 44, 12, 0xadbcb6).setDepth(vanityFront);
  s.add.ellipse(x + 214, y + 5, 34, 8, 0xdde3d8).setDepth(vanityFront);
  fixture(212, -12, 4, 13, chrome, vanityFront);
  fixture(212, -12, 10, 3, chrome, vanityFront);
  fixture(241, -9, 7, 9, 0x7b9b89, vanityFront);
  s.solid(x + 171, y, 87, 42);

  fixture(107, 132, 133, 52, 0x748e86, floor);
  fixture(111, 136, 125, 44, 0xa6b4a0, floor);
  fixture(118, 143, 111, 30, 0xbfc8ae, floor);
  return { sink: { x: x + 214, y: vanityFront + 22 } };
}

export function dressHall(s: WorldScene, entranceWallY: number, passageLeft: number, passageRight: number, rightEdge: number) {
  for (const [left, right, y] of [[0, 400, 544], [490, 700, 544], [780, 888, 544], [912, passageLeft, entranceWallY], [passageRight, rightEdge, entranceWallY]]) {
    box(s, left, y + 12, right - left, 19, 0xc4ad92, -585);
    box(s, left, y + 31, right - left, 3, 0xd4bf9b, -584);
    box(s, left, y + 52, right - left, 12, 0x925a43, -583);
    for (let x = left + 35; x < right - 8; x += 53) box(s, x, y + 54, 2, 8, edge, -582);
  }
  shelf(s, 55, 583, 94);
  shelf(s, 505, 583, 69);
  lamp(s, 252, 561);
  lamp(s, 660, 560);
  lamp(s, 847, 561);
  shelf(s, 980, entranceWallY + 37, 104);
  lamp(s, passageLeft - 46, entranceWallY + 17);
  shelf(s, passageRight + 50, entranceWallY + 37, 96);
  lamp(s, rightEdge - 52, entranceWallY + 17);
}

export function dressLiving(s: WorldScene, rightEdge: number) {
  s.deco('painting2', 1155, 103, 1.7);
  s.deco('painting', rightEdge - 185, 104, 1.7);
  lamp(s, 987, 84);
  lamp(s, rightEdge - 100, 84);
  const sideTable = s.pix('home-side-table', rightEdge - 63, 647, { scale: 2, foot: 21, footW: 0.82 });
  s.prop('home-plant', sideTable.x, sideTable.y - 29, 24, { solid: false, depth: sideTable.depth + 1 });
}

export function dressSisters(s: WorldScene) {
  s.deco('painting2', 177, 843, 2);
  const bed = s.prop('home-bed', 305, 0, 133, { topY: 858, foot: 116 });
  s.npc('lelas-seat', bed.x, 955, 'lelas-seat', bed.depth + 1);
  s.label('Lelas', bed.x, bed.y + 15, 13, '#f5e3bd', bed.y + 16);
  s.interact('lelas', bed.x, bed.y + 20, 67, 'Lelas · Nintendo Switch', () => {
    audio.play('handheld');
    say([{ speaker: 'staff', name: 'Lelas', portrait: 'lelas', text: 'One second, Mateo. I’m almost at the next level!' }]);
  });

  s.flat('rug-bed', 190, 1161, 3.3);
  s.add.ellipse(180, 1127, 54, 12, 0x1e2631, 0.27).setDepth(1126);
  s.add.image(180, 1129, 'sisters-cat').setOrigin(0.5, 1).setScale(2.5).setDepth(1129);
  const sofa = s.prop('home-sofa', 147, 1061, 150, { foot: 47 });
  if (!store.get().game.flags.lorelaiAtLukes) {
    s.npc('lorelai-seat', 147, 1058, 'lorelai-seat', sofa.depth + 1);
    s.label('Lorelai', 147, 1076, 13, '#f5e3bd', 1077);
  }
  s.prop('home-bookcase', 30, 0, 43, { topY: 817, foot: 32 });
  s.pix('nightstand', 237, 1062, { scale: 2, foot: 21 });
  s.glow(237, 1025, 84, 0xffc476, 0.3);
}

export function dressKitchen(s: WorldScene) {
  const x = 570, y = 854, front = y + 56;
  const oak = 0xb28561, stone = 0xceab86, enamel = 0xe0d7bf, hardware = 0x7e6355;
  const fixture = (dx: number, dy: number, w: number, h: number, color: number, depth = wall, alpha = 1) =>
    box(s, x + dx, y + dy, w, h, color, depth, alpha);
  const cupboard = (dx: number, dy: number, w: number, h: number, depth = wall) => {
    fixture(dx, dy, w, h, hardware, depth);
    fixture(dx + 2, dy + 2, w - 4, h - 4, enamel, depth);
    fixture(dx + 5, dy + 5, w - 10, h - 10, 0xc4af94, depth);
    fixture(dx + 7, dy + 7, w - 14, h - 14, 0xd6c2a4, depth);
    fixture(dx + w - 9, dy + h - 14, 3, 8, hardware, depth);
  };

  // Cabinets, range hood and backsplash sit on the rear wall face.
  fixture(0, -59, 230, 59, 0xbba68e);
  for (const row of [-30, -15]) {
    fixture(0, row, 230, 1, 0x9e8e7f);
    for (let col = row === -30 ? 10 : 24; col < 230; col += 30) fixture(col, row, 1, 15, 0x9e8e7f);
  }
  fixture(1, -62, 112, 5, 0x9a7760);
  for (const col of [2, 39, 76]) cupboard(col, -58, 36, 30);
  cupboard(180, -58, 48, 30);
  fixture(128, -62, 26, 19, 0x727c80);
  fixture(130, -61, 5, 18, 0x9da3a1);
  fixture(116, -46, 50, 13, 0x7c8687);
  fixture(113, -38, 56, 7, 0x586367);
  fixture(116, -38, 49, 2, 0xa5aba5);
  fixture(154, -35, 7, 2, 0xe0bf80);
  fixture(179, -19, 39, 3, hardware);
  for (const col of [185, 198, 211]) {
    fixture(col, -16, 2, 10, 0x767a72);
    fixture(col - 2, -8, 6, 5, 0x5b6563);
  }

  fixture(0, 0, 230, 54, hardware, front);
  fixture(3, 2, 224, 46, oak, front);
  fixture(1, 48, 227, 6, 0x6b5146, front);
  for (const [col, width] of [[3, 37], [41, 37], [79, 33], [169, 29], [199, 28]]) {
    cupboard(col, 22, width, 25, front);
  }
  fixture(0, 0, 230, 20, stone, front);
  fixture(0, 1, 230, 3, 0xe0c49c, front);
  fixture(0, 17, 230, 4, 0xa97c5c, front);

  // The sink and range are built into one counter.
  fixture(10, 5, 65, 12, steel, front);
  fixture(13, 7, 59, 8, 0x42575b, front);
  fixture(41, 7, 2, 8, 0x8c9c95, front);
  fixture(38, -6, 4, 12, steel, front);
  fixture(38, -6, 10, 3, steel, front);
  fixture(54, -6, 5, 7, 0x7a9a7a, front);
  fixture(114, 0, 53, 54, 0x7f8889, front);
  fixture(117, 2, 47, 16, 0x5d6368, front);
  for (const col of [129, 151]) for (const row of [6, 13]) {
    s.add.ellipse(x + col, y + row, 13, 5, 0x353b44).setDepth(front);
  }
  fixture(119, 25, 43, 24, 0x424950, front);
  fixture(123, 29, 35, 16, 0x5a656b, front);
  fixture(123, 26, 35, 3, 0xc0bcac, front);
  for (const col of [123, 132, 141, 150, 159]) fixture(col, 20, 3, 3, 0x4a5053, front);
  fixture(198, 5, 20, 11, 0xb2815f, front);
  fixture(201, 6, 14, 3, 0xe0bc8f, front);
  s.solid(x, y, 230, 54);

  const fridgeX = 233, fridgeW = 75, fridgeFront = y + 56;
  fixture(fridgeX - 2, -61, fridgeW + 4, 117, 0x697273, fridgeFront);
  fixture(fridgeX, -59, fridgeW, 110, 0xbbbfb5, fridgeFront);
  fixture(fridgeX + 3, -56, fridgeW - 8, 35, 0xe2e0cf, fridgeFront);
  fixture(fridgeX + 3, -17, fridgeW - 8, 64, 0xd6d7c7, fridgeFront);
  fixture(fridgeX + 3, -17, fridgeW - 8, 3, 0xeae8d6, fridgeFront);
  fixture(fridgeX + 8, -45, 4, 16, 0x818b86, fridgeFront);
  fixture(fridgeX + 8, -8, 4, 21, 0x818b86, fridgeFront);
  fixture(fridgeX + 48, -47, 11, 14, 0xedd39d, fridgeFront);
  fixture(fridgeX + 52, -48, 4, 3, 0x9c6953, fridgeFront);
  s.solid(x + fridgeX - 2, y, fridgeW + 4, 56);

  fixture(9, 89, 206, 32, 0x8d7965, floor);
  fixture(13, 93, 198, 24, 0xbba789, floor);
  fixture(20, 99, 184, 12, 0xcbb797, floor);
  return {
    fridge: { x: x + fridgeX + fridgeW / 2, y: fridgeFront + 22 },
    sink: { x: x + 42, y: front + 22 },
    counter: { x: x + 198, y: front + 22 },
  };
}
