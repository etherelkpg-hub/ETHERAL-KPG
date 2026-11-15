import type Phaser from 'phaser';
import type { FieldMap } from '../store';
import { say } from '../story';
import type { OutlineItem, WorldScene } from '../scenes/WorldScene';
import { nearestTrailPoint, roundTrail, type TrailPoint } from './fieldTravel';

export type PerimeterRegion = Exclude<FieldMap, 'wadi'>;
export const FIELD_REGION_SIZE = { w: 2500, h: 1910 };
export const FIELD_RESEARCH_CENTER = { left: 830, top: 508, right: 1670, bottom: 1500 };

type Point = readonly [number, number];
type Area = readonly [x: number, y: number, width: number, height: number];
type Graphics = Phaser.GameObjects.Graphics;
type Terrain = 'volcano' | 'salt-ridges' | 'saline-lagoon' | 'geysers' | 'impact-rim' | 'gullies' | 'breccia'
  | 'permafrost' | 'badlands' | 'dunes' | 'canyon' | 'salt-flat' | 'glacier' | 'frozen-lake' | 'meltwater' | 'patterned-ground';

interface Landmark {
  kind: Terrain;
  name: string;
  text: string;
  area: Area;
  approach: readonly [Point, Point, Point];
}

interface Perimeter {
  circuit: readonly Point[];
  road: { shade: number; gravel: number; dust: number };
  ridge: readonly [shadow: number, stone: number, light: number];
  landmarks: readonly [north: Landmark, east: Landmark, south: Landmark, west: Landmark];
}

const perimeters: Record<PerimeterRegion, Perimeter> = {
  atacama: {
    road: { shade: 0x967758, gravel: 0xc4a379, dust: 0xe4c79c },
    ridge: [0x504655, 0x796477, 0xb49487],
    circuit: [[1250, 1592], [955, 1592], [773, 1497], [711, 1328], [740, 1090], [734, 864], [699, 699], [735, 531],
      [905, 454], [1124, 451], [1381, 459], [1588, 437], [1739, 490], [1797, 644], [1765, 838], [1755, 1088],
      [1790, 1329], [1728, 1495], [1552, 1592], [1250, 1592]],
    landmarks: [
      { kind: 'volcano', name: 'Licancabur Volcano', area: [1330, 251, 965, 365],
        approach: [[1124, 451], [1233, 415], [1390, 403]],
        text: 'Licancabur is a stratovolcano on the Chile–Bolivia border. A small lake sits inside its summit crater.' },
      { kind: 'saline-lagoon', name: 'Laguna Chaxa', area: [2125, 931, 640, 740],
        approach: [[1765, 838], [1838, 926], [1900, 997]],
        text: 'Chaxa is a shallow saline lagoon in the Soncor wetlands. Brine and pale salt crust meet along its irregular shore.' },
      { kind: 'geysers', name: 'El Tatio Geysers', area: [597, 1677, 613, 343],
        approach: [[773, 1497], [703, 1556], [672, 1627]],
        text: 'Geothermal vents bring steam and hot water to the surface. The columns stand out in cold morning air high in the Andes.' },
      { kind: 'salt-ridges', name: 'Valle de la Luna', area: [353, 864, 642, 696],
        approach: [[734, 864], [670, 958], [593, 1044]],
        text: 'Ridges of the Cordillera de la Sal show folded beds of salt and sediment. Erosion exposed their sharp crests and pale veins.' },
    ],
  },
  haughton: {
    road: { shade: 0x6f6361, gravel: 0xa49888, dust: 0xc8bdab },
    ridge: [0x464653, 0x6b6879, 0x9e9da3],
    circuit: [[1250, 1598], [982, 1598], [793, 1512], [718, 1365], [699, 1169], [740, 909], [715, 719], [746, 546],
      [932, 472], [1180, 443], [1435, 442], [1664, 471], [1772, 592], [1808, 784], [1778, 991], [1750, 1224],
      [1777, 1421], [1550, 1598], [1250, 1598]],
    landmarks: [
      { kind: 'impact-rim', name: 'Haughton Impact Rim', area: [1280, 294, 1540, 306],
        approach: [[932, 472], [1040, 429], [1150, 413]],
        text: 'This curved rim belongs to a complex impact crater on Devon Island. Erosion has exposed faulted and uplifted sedimentary rock.' },
      { kind: 'breccia', name: 'Impact Melt Breccia', area: [2130, 854, 590, 672],
        approach: [[1808, 784], [1870, 868], [1961, 934]],
        text: 'The impact mixed fragments of limestone, sandstone and basement rocks into melt-bearing breccia. Outcrops expose those fragments in a fine matrix.' },
      { kind: 'permafrost', name: 'Permafrost Polygons', area: [1935, 1632, 840, 435],
        approach: [[1777, 1421], [1832, 1494], [1915, 1558]],
        text: 'Thermal contraction opens cracks in frozen ground. Repeated freezing and thawing help shape the polygon network visible at the surface.' },
      { kind: 'gullies', name: 'Meltwater Gullies', area: [362, 1030, 624, 756],
        approach: [[740, 909], [679, 1021], [578, 1099]],
        text: 'Seasonal meltwater from snow and shallow ground ice cuts narrow gullies into the rocky polar desert.' },
    ],
  },
  'death-valley': {
    road: { shade: 0xb28b61, gravel: 0xd4ad78, dust: 0xf5d5a1 },
    ridge: [0x8d604b, 0xb98058, 0xdda779],
    circuit: [[1250, 1585], [965, 1585], [780, 1506], [728, 1333], [741, 1122], [703, 929], [705, 730], [730, 563],
      [884, 478], [1148, 440], [1424, 440], [1664, 464], [1767, 588], [1743, 812], [1773, 1001], [1805, 1235],
      [1768, 1429], [1533, 1585], [1250, 1585]],
    landmarks: [
      { kind: 'badlands', name: 'Zabriskie Point', area: [1250, 278, 1460, 360],
        approach: [[884, 478], [1035, 432], [1180, 402]],
        text: 'The badlands expose eroded lake and alluvial sediments. Dense gullies cut yellow slopes below Zabriskie Point.' },
      { kind: 'dunes', name: 'Mesquite Flat Sand Dunes', area: [2132, 856, 638, 740],
        approach: [[1743, 812], [1820, 884], [1904, 954]],
        text: 'Wind moves sand into dunes and continually redraws the ripples. The shaded slip faces show which side the sand falls down.' },
      { kind: 'salt-flat', name: 'Badwater Basin', area: [1991, 1645, 875, 403],
        approach: [[1768, 1429], [1828, 1517], [1907, 1569]],
        text: 'Evaporation leaves a broad white salt crust in the basin. Growth and contraction form raised polygon edges in the crust.' },
      { kind: 'canyon', name: 'Mosaic Canyon', area: [350, 969, 648, 822],
        approach: [[705, 730], [640, 821], [587, 932]],
        text: 'Flash floods polished the winding narrows. The canyon takes its name from breccia with angular fragments cemented together.' },
    ],
  },
  mcmurdo: {
    road: { shade: 0x726e67, gravel: 0xaaa395, dust: 0xd0c6b5 },
    ridge: [0x434f5d, 0x677785, 0x9a9fa4],
    circuit: [[1250, 1590], [981, 1590], [795, 1514], [735, 1354], [745, 1162], [720, 944], [708, 751], [738, 582],
      [891, 481], [1154, 455], [1420, 442], [1643, 465], [1770, 586], [1774, 804], [1754, 997], [1770, 1191],
      [1728, 1391], [1570, 1590], [1250, 1590]],
    landmarks: [
      { kind: 'glacier', name: 'Taylor Glacier and Blood Falls', area: [1300, 257, 1240, 390],
        approach: [[891, 481], [1004, 441], [1130, 402]],
        text: 'Taylor Glacier ends in Taylor Valley. Iron in saline outflow oxidizes at the surface and stains the ice rusty red.' },
      { kind: 'frozen-lake', name: 'Lake Bonney', area: [2127, 900, 639, 806],
        approach: [[1774, 804], [1822, 901], [1887, 1018]],
        text: 'Lake Bonney has two lobes linked by a narrow passage. The lake stays ice-covered, with narrow thawed margins possible in summer.' },
      { kind: 'meltwater', name: 'Priscu Stream', area: [2010, 1563, 705, 642],
        approach: [[1728, 1391], [1781, 1486], [1851, 1551]],
        text: 'In summer, meltwater briefly runs down channels into the dry-valley lakes. Priscu Stream feeds the east lobe of Lake Bonney.' },
      { kind: 'patterned-ground', name: 'Taylor Valley Patterned Ground', area: [368, 1015, 654, 740],
        approach: [[720, 944], [663, 1031], [581, 1133]],
        text: 'Thermal contraction creates polygonal cracks in the frozen soil. Much of the valley floor is exposed gravel above permafrost.' },
    ],
  },
};

const asPoints = (points: readonly Point[]) => points.map(([x, y]) => ({ x, y }));
const inside = (x: number, y: number, [cx, cy, w, h]: Area) => ((x - cx) * 2 / w) ** 2 + ((y - cy) * 2 / h) ** 2 < 1;
const fromArea = ([cx, cy, w, h]: Area, points: readonly Point[]) =>
  points.map(([x, y]) => ({ x: Math.round(cx + x * w / 2), y: Math.round(cy + y * h / 2) }));

const apron: Point[] = [[-.99,-.08],[-.86,-.55],[-.6,-.76],[-.19,-.91],[.17,-.84],[.57,-.69],[.79,-.51],[.98,-.13],
  [.89,.25],[.72,.62],[.46,.86],[.08,.94],[-.28,.83],[-.59,.72],[-.86,.47],[-.96,.18]];

function stoneField(art: Graphics, area: Area, dark: number, light: number, count: number) {
  const [cx, cy, w, h] = area;
  for (let i = 0; i < count; i++) {
    const x = Math.round(cx - w / 2 + (i * 137 + cx) % w);
    const y = Math.round(cy - h / 2 + (i * 173 + cy) % h);
    if (!inside(x, y, area)) continue;
    const size = i % 8 === 0 ? 10 + i % 9 : 2 + i % 7;
    art.fillStyle(dark, .32).fillRect(x + 2, y + 2, size + 2, Math.ceil(size / 3));
    art.fillStyle(i % 3 ? light : dark, .62).fillRect(x, y, size, Math.ceil(size / 3));
  }
}

function blendGround(art: Graphics, area: Area, shade: number, ground: number) {
  const [x, y, w, h] = area;
  art.fillStyle(shade, .13).fillPoints(fromArea([x, y, w + 52, h + 38], apron), true);
  art.fillStyle(ground, .24).fillPoints(fromArea([x, y, w + 15, h + 6], apron), true);
  art.fillStyle(ground, .35).fillPoints(fromArea([x, y, w * .91, h * .91], apron), true);
}

function paintDistantRidges(art: Graphics, [shade, rock, light]: Perimeter['ridge']) {
  art.fillStyle(shade, .52).fillPoints(asPoints([[0,16],[237,119],[492,79],[657,135],[853,71],[1068,134],
    [1341,56],[1577,125],[1883,58],[2138,106],[2500,42],[2500,210],[2324,177],[2080,214],[1848,170],
    [1500,223],[1240,159],[941,210],[627,194],[319,232],[0,186]]), true);
  for (const [x, y, w, h] of [[270, 196, 545, 227], [2220, 198, 790, 252], [645, 167, 541, 206]]) {
    art.fillStyle(rock, .9).fillPoints(fromArea([x, y, w, h], [[-1,.63],[-.7,.21],[-.54,.14],[-.3,-.68],[-.12,-.59],
      [.03,-.89],[.19,-.76],[.27,-.36],[.47,-.24],[.64,.23],[1,.67],[.51,.86],[-.08,.79],[-.56,.95]]), true);
    art.fillStyle(shade, .77).fillPoints(fromArea([x, y, w, h], [[.03,-.89],[.19,-.76],[.27,-.36],[.47,-.24],[.64,.23],
      [1,.67],[.51,.86],[.2,.47],[-.03,.08]]), true);
    art.lineStyle(3, light, .51).strokePoints(fromArea([x, y, w, h], [[-.7,.46],[-.38,.27],[-.31,-.2],[-.12,-.51],[.03,-.76]]));
  }
}

function paintVerge(art: Graphics, { ridge: [shadow, rock, light], road }: Perimeter) {
  for (const area of [[135, 1418, 338, 543], [386, 1830, 660, 246], [2325, 1443, 358, 488], [2163, 1842, 584, 207]] as const) {
    const [x, y, w, h] = area;
    art.fillStyle(rock, .13).fillPoints(fromArea(area, apron), true);
    art.fillStyle(road.gravel, .22).fillPoints(fromArea([x + 19, y + 14, w * .78, h * .72], apron), true);
    stoneField(art, area, shadow, light, 126);
  }
}

function paintVolcano(art: Graphics, area: Area) {
  blendGround(art, area, 0x704e54, 0x9b7061);
  art.fillStyle(0x695862).fillPoints(fromArea(area, [[-.97,.77],[-.77,.41],[-.58,.17],[-.37,-.19],[-.23,-.5],[-.13,-.85],[-.07,-.94],
    [.12,-.95],[.21,-.85],[.31,-.49],[.56,-.02],[.66,.26],[.96,.78],[.63,.88],[.24,.76],[-.12,.91],[-.61,.85]]), true);
  art.fillStyle(0x976e64).fillPoints(fromArea(area, [[-.97,.77],[-.65,.32],[-.34,-.23],[-.15,-.84],[-.05,-.89],[.03,-.62],
    [-.02,-.19],[-.22,.42],[-.33,.72],[-.61,.85]]), true);
  art.fillStyle(0x473e4d).fillPoints(fromArea(area, [[.12,-.92],[.22,-.85],[.31,-.49],[.56,-.02],[.96,.78],[.63,.88],
    [.44,.53],[.26,.34],[.1,-.34],[.03,-.62]]), true);
  art.fillStyle(0xc6a68a).fillPoints(fromArea(area, [[-.27,-.6],[-.13,-.85],[-.07,-.94],[.12,-.95],[.22,-.84],[.28,-.6],[.13,-.73],
    [.03,-.68],[-.08,-.78],[-.16,-.63]]), true);
  art.fillStyle(0x554552).fillPoints(fromArea(area, [[-.09,-.9],[-.04,-.94],[.1,-.95],[.17,-.88],[.11,-.8],[-.02,-.8]]), true);
  art.fillStyle(0x759896).fillPoints(fromArea(area, [[-.039,-.866],[.091,-.886],[.124,-.847],[.08,-.816],[-.005,-.818]]), true);
  for (const slope of [-.73, -.54, -.38, -.15, .24, .43, .68]) {
    art.lineStyle(4, slope > 0 ? 0x836a70 : 0xb18c73, .56).strokePoints(fromArea(area,
      [[slope * .22, -.58], [slope * .48, -.1], [slope * .62, .18], [slope, .71]]));
  }
}

function paintErodedRidges(art: Graphics, area: Area, salt: boolean) {
  const [cx, cy, w, h] = area;
  const [shadow, base, ochre, pale] = salt ? [0x734452, 0x9f5a61, 0xbb795d, 0xe6c69d] : [0x8b533b, 0xb0774d, 0xd9a35e, 0xf3cc8a];
  blendGround(art, area, shadow, ochre);
  for (let i = 0; i < 5; i++) {
    const peak: Area = [cx + (i - 2) * w * .157, cy + (i % 3 - 1) * h * .115, w * (.34 + i % 2 * .12), h * (.72 + i % 3 * .08)];
    art.fillStyle(shadow, .38).fillPoints(fromArea(peak, [[-.99,.65],[-.84,-.53],[-.31,-.88],[.15,-.94],[.97,-.32],[.9,.5],[.41,1],[-.42,.87]]), true);
    art.fillStyle(base).fillPoints(fromArea(peak, [[-.86,.63],[-.82,.18],[-.62,.02],[-.53,-.45],[-.23,-.57],[-.11,-.86],[.12,-.86],
      [.36,-.54],[.5,-.39],[.62,.06],[.86,.33],[.84,.64],[.43,.91],[.09,.69],[-.21,.84],[-.61,.79]]), true);
    art.fillStyle(ochre).fillPoints(fromArea(peak, [[-.86,.63],[-.58,.22],[-.53,-.45],[-.23,-.57],[-.11,-.86],[.12,-.86],
      [.22,-.6],[.13,-.29],[.24,.13],[.12,.36],[.09,.69],[-.21,.84],[-.61,.79]]), true);
    for (let band = 0; band < 7; band++) {
      const y = -.57 + band * .19, extent = .30 + band * .068;
      const line: Point[] = [[-extent,y+.12],[-extent*.65,y+.04],[-extent*.29,y-.048],[.12,y-.06],[extent*.56,y+.025],[extent,y+.19]];
      art.lineStyle(band % 3 ? 4 : 8, band % 3 ? pale : shadow, .74).strokePoints(fromArea(peak, line));
    }
    for (const x of [-.37, -.12, .19, .45]) {
      art.lineStyle(3, shadow, .6).strokePoints(fromArea(peak, [[x*.32,-.52],[x*.48,-.28],[x*.65,-.02],[x,.52],[x*1.19,.71]]));
    }
  }
  stoneField(art, [cx, cy + h * .28, w, h * .4], shadow, pale, 110);
}

function paintPolygons(art: Graphics, area: Area, salt: boolean) {
  const [cx, cy, w, h] = area;
  const [shadow, ground, saltEdge] = salt ? [0xa99a7c, 0xf0e5c9, 0xfff6e2] : [0x655f63, 0xaaa6a4, 0xc8c3ba];
  blendGround(art, area, shadow, ground);
  art.fillStyle(ground, salt ? .92 : .64).fillPoints(fromArea(area, apron), true);
  const r = salt ? 28 : 31, rowSpacing = Math.sqrt(3) * r;
  for (let col = 0, x = cx - w / 2 + r; x < cx + w / 2 - r; x += r * 1.5, col++) {
    for (let row = 0, y = cy - h / 2 + r + (col % 2) * rowSpacing / 2; y < cy + h / 2 - r; y += rowSpacing, row++) {
      if (!inside(x, y, [cx, cy, w * .86, h * .82])) continue;
      const corners = Array.from({ length: 6 }, (_, i) => {
        const px = Math.round(x + Math.cos(i * Math.PI / 3) * r);
        const py = Math.round(y + Math.sin(i * Math.PI / 3) * r);
        return { x: px + (px * 17 + py * 7) % 9 - 4, y: py + (px * 13 + py * 11) % 9 - 4 };
      });
      art.fillStyle((row + col) % 4 ? ground : saltEdge, .28).fillPoints(corners, true);
      art.lineStyle(salt ? 2 : 3, shadow, salt ? .61 : .7).strokePoints(corners, true);
      art.lineStyle(2, saltEdge, .78).lineBetween(corners[1].x, corners[1].y + 3, corners[2].x, corners[2].y + 3);
    }
  }
  stoneField(art, area, shadow, saltEdge, salt ? 92 : 170);
}

function paintWater(art: Graphics, area: Area, frozen: boolean) {
  const [x, y, w, h] = area;
  const [dark, rim, fill, light] = frozen ? [0x5b7788, 0xd0e5df, 0x8eb8ca, 0xeaf5ee] : [0x6e9784, 0xeee8c7, 0x649b8e, 0xc5d9b4];
  art.fillStyle(dark, .31).fillPoints(fromArea([x + 7, y + 12, w + 30, h + 23], apron), true);
  art.fillStyle(rim).fillPoints(fromArea(area, apron), true);
  art.fillStyle(fill).fillPoints(fromArea([x, y, w * .9, h * .87], apron), true);
  art.lineStyle(4, dark, .58).strokePoints(fromArea([x, y, w * .89, h * .86], apron), true);
  for (let i = 0; i < 62; i++) {
    const px = Math.round(x - w * .43 + (i * 193 + w) % (w * .86));
    const py = Math.round(y - h * .42 + (i * 107 + h) % (h * .84));
    if (!inside(px, py, [x, y, w * .65, h * .65])) continue;
    art.fillStyle(i % 3 ? light : dark, frozen ? .51 : .36).fillRect(px, py, 8 + i * 13 % 35, 2 + i % 3);
  }
  if (frozen) {
    for (const offset of [-.34, -.04, .27]) {
      art.lineStyle(3, dark, .54).strokePoints(fromArea(area,
        [[-.7,offset+.3],[-.34,offset+.03],[-.19,offset+.11],[.16,offset],[.33,offset-.19],[.62,offset-.3]]));
      art.lineStyle(2, light, .72).strokePoints(fromArea(area,
        [[-.68,offset+.31],[-.3,offset+.05],[.15,offset+.025],[.34,offset-.16],[.5,offset-.27]]));
    }
  }
}

function paintGeysers(art: Graphics, area: Area) {
  const [cx, cy, w, h] = area;
  blendGround(art, area, 0x947356, 0xc2ae88);
  stoneField(art, area, 0x876b57, 0xd5bc90, 110);
  for (const [ox, oy, size] of [[-.31,.21,1.1],[-.16,-.26,.71],[.03,.08,1.04],[.18,.37,.55],[.34,-.16,.88]]) {
    const x = cx + ox * w, y = cy + oy * h;
    art.fillStyle(0xa28162, .6).fillEllipse(x, y + 7, 110 * size, 43 * size);
    art.fillStyle(0xe5d2aa).fillEllipse(x, y, 93 * size, 31 * size);
    art.fillStyle(0xac7b49).fillEllipse(x, y - 2, 53 * size, 21 * size);
    art.fillStyle(0x629484).fillEllipse(x, y - 4, 37 * size, 15 * size);
    art.fillStyle(0xc3e3df, .73).fillRect(x - 9 * size, y - 10 * size, 20 * size, 6 * size);
    for (let i = 0; i < 6; i++) {
      const sx = x + ((i * 19) % 23 - 5) * size, sy = y - (i * 16 + 15) * size;
      art.fillStyle(0xffefd8, .68 - i * .065).fillEllipse(sx, sy, (16 + i * 9) * size, (23 + i * 5) * size);
      art.fillStyle(0xfdf8ee, .51 - i * .055).fillEllipse(sx - 4 * size, sy - 4 * size, (12 + i * 7) * size, 14 * size);
    }
  }
}

function band(art: Graphics, area: Area, nodes: readonly Point[], widths: readonly (readonly [number, number, number])[]) {
  const rounded = roundTrail(fromArea(area, nodes).map(({ x, y }) => [x, y]), 50);
  for (const [width, color, alpha] of widths) art.lineStyle(width, color, alpha).strokePoints(rounded, false);
}

function paintImpactRim(art: Graphics, area: Area) {
  blendGround(art, area, 0x5d5459, 0x8e7d74);
  const rim: Point[] = [[-.98,.5],[-.83,.02],[-.63,-.31],[-.4,-.59],[-.13,-.74],[.17,-.79],[.49,-.59],[.72,-.34],[.89,-.01],[1,.45]];
  band(art, area, rim, [[131,0x4d4650,.48],[105,0x68565a,.89],[68,0x958176,.95],[50,0xb5a392,.91],[13,0xe0c9b2,.62]]);
  for (const side of [-1, 1]) {
    const faults = rim.slice(1, -1).map(([x, y], i) => [x, y + side * (.25 + i % 3 * .05)] as const);
    band(art, area, faults, [[17,0x756466,.61],[5,0xd0bba7,.65]]);
  }
  for (const [i, [x, y]] of rim.entries()) {
    const [clast] = fromArea(area, [[x, y - .14]]);
    stoneField(art, [clast.x, clast.y, 114, 66], 0x4f4551, 0xc8b2a8, 13 + i);
  }
}

function paintBreccia(art: Graphics, area: Area) {
  const [cx, cy, w, h] = area;
  blendGround(art, area, 0x625764, 0xa19899);
  art.fillStyle(0x817779, .74).fillPoints(fromArea(area, apron), true);
  const colors = [0x8c7065, 0xac8d7b, 0xcbb8a0, 0x584f5a, 0x9a949e, 0x696571];
  for (let i = 0; i < 128; i++) {
    const x = Math.round(cx - w / 2 + (i * 137 + cx) % w), y = Math.round(cy - h / 2 + (i * 191 + cy) % h);
    if (!inside(x, y, [cx, cy, w * .86, h * .83])) continue;
    const size = 11 + (i * 17) % 58;
    const vertices = fromArea([x, y, size * 1.55, size], [[-1,.23],[-.59,-.68],[.1,-1],[.71,-.7],[.94,.17],[.45,.83],[-.39,.69]]);
    art.fillStyle(0x554650, .63).fillPoints(vertices.map(p => ({ x: p.x + 4, y: p.y + 5 })), true);
    art.fillStyle(colors[i % colors.length]).fillPoints(vertices, true);
    art.lineStyle(2, 0xeee0c6, .61).strokePoints(vertices.slice(0, 4));
  }
}

function paintGullies(art: Graphics, area: Area, canyon: boolean) {
  blendGround(art, area, canyon ? 0x956748 : 0x6d6773, canyon ? 0xd1ad82 : 0xa4988e);
  const main: Point[] = [[-.35,-.95],[-.64,-.62],[-.32,-.37],[-.13,-.15],[-.42,.03],[-.19,.32],
    [.15,.51],[.51,.56],[.66,.79],[.9,.8]];
  if (canyon) {
    band(art, area, main, [[188,0x9f7357,.46],[149,0x815845,.87],[123,0xb9825c,.98],[96,0xdab891,1],[69,0xeed7ae,1],[42,0xe8c191,1]]);
    for (const side of [-1, 1]) {
      const ledge = main.map(([x, y], i) => [x + side * (.14 + i % 2 * .024), y - side * .065] as const);
      band(art, area, ledge, [[7,0xf5e3c4,.72],[2,0x8c5a49,.81]]);
    }
  } else {
    band(art, area, main, [[113,0x675e65,.37],[82,0x766871,.64],[56,0x9a8b81,.94],[29,0x5c5662,.69],[10,0x8dabae,.86]]);
    band(art, area, [[-.87,-.37],[-.62,-.31],[-.45,-.14],[-.13,-.15]], [[37,0x8e7d78,.9],[12,0x5e5662,.68]]);
    band(art, area, [[.57,-.79],[.32,-.57],[.33,-.26],[.2,.1],[-.19,.32]], [[40,0x958479,.89],[12,0x645c65,.77]]);
  }
  stoneField(art, area, canyon ? 0x8a5a4d : 0x686270, canyon ? 0xe3bf98 : 0xc4b9b4, 185);
}

function paintDunes(art: Graphics, area: Area) {
  const [cx, cy, w, h] = area;
  blendGround(art, area, 0xb2824f, 0xd7af77);
  for (let i = 0; i < 5; i++) {
    const dune: Area = [cx + (i % 2 ? -1 : 1) * 35, cy + (i - 2) * h * .142, w * (.89 - Math.abs(i-2) * .10), h * .45];
    art.fillStyle(0xb38253, .64).fillPoints(fromArea(dune, [[-.99,.12],[-.68,-.38],[-.41,-.53],[-.06,-.56],[.24,-.43],
      [.64,-.16],[.93,.45],[.62,.37],[.32,.2],[.03,.34],[-.29,.52],[-.59,.48]]), true);
    art.fillStyle(0xe3b879).fillPoints(fromArea(dune, [[-.99,.12],[-.7,-.43],[-.42,-.67],[-.05,-.73],[.25,-.55],
      [.64,-.26],[.93,.45],[.56,.23],[.19,-.08],[-.05,-.12],[-.35,-.07],[-.67,.12]]), true);
    for (let j = 0; j < 6; j++) {
      art.lineStyle(j === 1 ? 5 : 2, j % 2 ? 0xf9dca2 : 0xce9a61, .67).strokePoints(fromArea(dune,
        [[-.81,-.03+j*.034],[-.55,-.27+j*.033],[-.16,-.5+j*.048],[.2,-.39+j*.04],[.51,-.14+j*.052],[.73,.13+j*.042]]));
    }
  }
}

function paintGlacier(art: Graphics, area: Area) {
  const ice: Point[] = [[-.93,-.76],[-.66,-.96],[-.4,-.8],[-.09,-.92],[.15,-.81],[.48,-.9],[.86,-.91],[.94,-.55],[.79,-.24],
    [.86,-.02],[.76,.34],[.58,.44],[.5,.73],[.23,.91],[.15,.77],[-.07,.91],[-.32,.77],[-.41,.53],[-.62,.48],[-.74,.24],[-.92,.05]];
  art.fillStyle(0x435c6c, .56).fillPoints(fromArea(area, ice.map(([x,y]) => [x+.04,y+.08])), true);
  art.fillStyle(0x8ca9b8).fillPoints(fromArea(area, ice), true);
  art.fillStyle(0xc1d5da).fillPoints(fromArea(area, [[-.91,-.74],[-.59,-.91],[-.19,-.8],[.11,-.85],[.39,-.75],[.72,-.91],[.86,-.75],
    [.71,-.59],[.53,-.37],[.25,-.37],[.15,-.19],[-.24,.05],[-.4,.43],[-.61,.44],[-.86,.03]]), true);
  for (let i = 0; i < 13; i++) {
    const x = -.84 + i * .125;
    const drift = (i * 17 % 9 - 4) * .013;
    const top = -.77 + i % 4 * .065, bottom = .16 + i % 5 * .064;
    art.lineStyle(i % 3 ? 4 : 7, i % 2 ? 0xe0eff0 : 0x5b8196, .71).strokePoints(fromArea(area,
      [[x,top],[x-.022+drift,-.43],[x+.046,-.28],[x+.033-drift*.36,-.04],[x+.07+drift,bottom]]));
    if (i % 3 === 0) {
      art.lineStyle(3, 0xe8f2ef, .55).strokePoints(fromArea(area,
        [[x+.09,-.31],[x+.06,-.17],[x+.033-drift*.36,-.04],[x+.024,.12]]));
    }
  }
  band(art, area, [[.13,.08],[.083,.34],[.14,.53],[.11,.73],[.25,.94]], [[40,0xa35d49,.82],[20,0xc77c55,.91],[7,0xe2a073,.89]]);
}

function paintMeltwater(art: Graphics, area: Area) {
  blendGround(art, area, 0x6c7277, 0x9b9990);
  stoneField(art, area, 0x586068, 0xc4c0b4, 200);
  band(art, area, [[.44,.93],[.1,.78],[.18,.48],[-.24,.28],[-.29,.03],[.11,-.17],[.24,-.42],[.51,-.64],[.46,-.93]],
    [[77,0x697a82,.48],[50,0x757d7e,.9],[25,0x83b4c0,.97],[7,0xc8e9e3,.88]]);
  band(art, area, [[.05,.48],[.53,.32],[.52,.01],[.11,-.17]], [[28,0x6f858f,.64],[11,0xa2cfd0,.77]]);
}

function paintLandmark(art: Graphics, { kind, area }: Landmark) {
  const [x,y,w,h] = area;
  switch (kind) {
    case 'volcano': paintVolcano(art, area); break;
    case 'salt-ridges': paintErodedRidges(art, area, true); break;
    case 'saline-lagoon':
      paintPolygons(art, area, true);
      paintWater(art, [x + 18, y - 64, w * .68, h * .45], false);
      paintWater(art, [x - 45, y + 133, w * .31, h * .19], false);
      break;
    case 'geysers': paintGeysers(art, area); break;
    case 'impact-rim': paintImpactRim(art, area); break;
    case 'gullies': paintGullies(art, area, false); break;
    case 'breccia': paintBreccia(art, area); break;
    case 'permafrost': case 'patterned-ground': paintPolygons(art, area, false); break;
    case 'badlands': paintErodedRidges(art, area, false); break;
    case 'dunes': paintDunes(art, area); break;
    case 'canyon': paintGullies(art, area, true); break;
    case 'salt-flat': paintPolygons(art, area, true); break;
    case 'glacier': paintGlacier(art, area); break;
    case 'frozen-lake':
      blendGround(art, area, 0x6e777a, 0x8d9da4);
      band(art, area, [[-.34,.02],[-.11,-.03],[.12,.06],[.21,.18]], [[58,0xd0e5df,1],[41,0x91b9c9,1]]);
      paintWater(art, [x - 90,y - 130,w * .73,h * .49], true);
      paintWater(art, [x + 64,y + 133,w * .78,h * .56], true);
      break;
    case 'meltwater': paintMeltwater(art, area); break;
  }
}

function trackOutline(points: TrailPoint[], width: number): OutlineItem {
  return { x: 0, y: 0, ...FIELD_REGION_SIZE, kind: 'path', shape: 'trail', points, strokeWidth: width };
}

function paintTracks(art: Graphics, { circuit, road, landmarks }: Perimeter): OutlineItem[] {
  const loop = roundTrail(circuit, 128);
  const { w, h } = FIELD_REGION_SIZE;
  const approaches = landmarks.map(({ approach: [join, bend, end] }) => ({
    points: roundTrail([nearestTrailPoint(loop, join), bend, end], 57), width: 23,
  }));
  const exit = roundTrail([circuit[0], [w / 2 + 20, h - 171], [w / 2, h - 9]], 66);
  const tracks = [{ points: loop, width: 44 }, { points: exit, width: 32 }, ...approaches];
  for (const [spread, color, alpha] of [[21,road.shade,.16], [9,road.gravel,.67], [0,road.gravel,.93], [-13,road.dust,.37]]) {
    for (const { points, width } of tracks) art.lineStyle(width + spread, color, alpha).strokePoints(points, false);
  }
  for (const { approach: [, , [x,y]] } of landmarks) {
    art.fillStyle(road.shade, .2).fillEllipse(x, y, 83, 62);
    art.fillStyle(road.gravel, .72).fillEllipse(x, y, 64, 44);
    art.fillStyle(road.dust, .34).fillEllipse(x, y, 55, 34);
  }
  for (const { points, width } of tracks) {
    for (let i = 0; i < points.length; i += 3) {
      const p = points[i], next = points[i + 1] ?? points[i - 1];
      const length = Math.hypot(next.x - p.x, next.y - p.y) || 1;
      for (const side of [-1, 1]) {
        const offset = side * (width * .49 + (i * 5 % 13) - 5);
        const x = p.x + (p.y - next.y) * offset / length, y = p.y + (next.x - p.x) * offset / length;
        art.fillStyle(i % 2 ? road.dust : road.shade, .38).fillRect(Math.round(x), Math.round(y), 3 + i % 6, 2 + i % 3);
      }
    }
  }
  return tracks.map(({ points, width }) => trackOutline(points, width));
}

export function paintFieldPerimeter(art: Graphics, region: PerimeterRegion): OutlineItem[] {
  const scene = perimeters[region];
  paintDistantRidges(art, scene.ridge);
  paintVerge(art, scene);
  const outlines = scene.landmarks.map((landmark): OutlineItem => {
    paintLandmark(art, landmark);
    const [x,y,w,h] = landmark.area;
    const icy = landmark.kind === 'glacier' || landmark.kind === 'frozen-lake';
    const water = icy || landmark.kind === 'saline-lagoon' || landmark.kind === 'meltwater';
    return { x: x - w/2, y: y - h/2, w, h, kind: water ? 'water' : 'zone', shape: 'polygon', points: fromArea(landmark.area, apron) };
  });
  return [...outlines, ...paintTracks(art, scene)];
}

export function placeFieldLandmarks(scene: WorldScene, region: PerimeterRegion): OutlineItem[] {
  const { road, landmarks } = perimeters[region];
  return landmarks.map(({ approach: [, , [x, y]], kind, name, text }) => {
    const sign = scene.add.graphics().setDepth(y);
    sign.fillStyle(0x362f32, .32).fillEllipse(x + 5, y + 3, 62, 15);
    sign.fillStyle(0x4c3f3d).fillRect(x - 3, y - 29, 6, 30).fillRoundedRect(x - 29, y - 43, 58, 22, 2);
    sign.fillStyle(road.gravel).fillRect(x - 26, y - 40, 52, 14);
    sign.fillStyle(0xffeac1).fillRect(x - 18, y - 36, 23, 2).fillRect(x - 18, y - 31, 15, 2);
    sign.fillStyle(road.shade).fillRect(x + 12, y - 36, 6, 6);
    scene.interact('landmark-' + kind, x, y + 12, 64, 'Read · ' + name, () => say([{ speaker: 'narrator', name, text }]));
    return { x: x - 30, y: y - 43, w: 60, h: 49, kind: 'site', label: name };
  });
}
