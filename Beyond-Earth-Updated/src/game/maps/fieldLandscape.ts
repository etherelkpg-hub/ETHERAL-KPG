
import type Phaser from 'phaser';
import type { FieldMap } from '../store';
import { nearestTrailPoint, roundTrail, type TrailPoint } from './fieldTravel';

type LandscapeRegion = Exclude<FieldMap, 'wadi'>;
type Coordinate = readonly [number, number];
type Graphics = Phaser.GameObjects.Graphics;
type Land = 'salt' | 'dunes' | 'strata' | 'basalt' | 'lagoon' | 'frost' | 'glacier' | 'lake' | 'gravel';
type Prop = 'cabin' | 'adobe' | 'ranger' | 'tent' | 'observatory' | 'mine' | 'truck' | 'tracked' | 'antenna' | 'supplies' | 'bench' | 'spring';
type Habitat = 'moss' | 'scrub' | 'cactus' | 'flowers';
type Zone = readonly [kind: Land, x: number, y: number, width: number, height: number, label?: string];
type Scenery = {
  zones: readonly Zone[];
  roads: readonly (readonly Coordinate[])[];
  trails: readonly (readonly Coordinate[])[];
  channels: readonly (readonly Coordinate[])[];
  props: readonly (readonly [Prop, number, number, number?])[];
  vegetation: readonly (readonly [Habitat, number, number, number])[];
  gravel: readonly (readonly [number, number, number, number])[];
  pathColor: number;
  waterColor?: number;
};

const landscapes: Record<LandscapeRegion, Scenery> = {
  haughton: {
    zones: [
      ['strata', 484, 805, 505, 495, 'Western Crater Rim'],
      ['strata', 1995, 761, 490, 460, 'Eastern Crater Rim'],
      ['strata', 792, 485, 450, 150, 'Impact Breccia'],
      ['frost', 616, 1120, 340, 230, 'Shaded Permafrost'],
      ['frost', 2079, 1080, 385, 215],
      ['glacier', 2110, 625, 282, 205, 'Rock Glacier'],
      ['lake', 2185, 1278, 228, 130, 'Frozen Depression'],
      ['gravel', 544, 1275, 396, 200],
      ['gravel', 1975, 1600, 345, 220, 'Impact Deposits'],
    ],
    roads: [[[226, 1495], [403, 1464], [590, 1380], [710, 1250], [743, 1020], [692, 797], [706, 665], [839, 533], [1040, 454], [1340, 453], [1530, 474], [1745, 560], [1873, 689], [1945, 936], [1942, 1150], [1846, 1350], [1889, 1515], [2060, 1648], [2305, 1640]]],
    trails: [
      [[710, 1250], [630, 1220], [479, 1260], [392, 1353]],
      [[692, 797], [591, 740], [432, 738], [345, 660]],
      [[1873, 689], [2010, 716], [2132, 680], [2270, 744]],
      [[1942, 1150], [2105, 1150], [2265, 1190]],
      [[1889, 1515], [1990, 1510], [2070, 1550], [2137, 1545]],
      [[692, 797], [612, 825], [523, 849], [407, 841]],
      [[590, 1380], [664, 1465], [795, 1573], [995, 1664], [1129, 1749], [1250, 1805]],
    ],
    channels: [
      [[322, 584], [286, 751], [301, 863], [416, 1025], [399, 1110], [285, 1275]],
      [[2360, 764], [2304, 951], [2320, 1120], [2257, 1220], [2365, 1395], [2350, 1550]],
    ],
    props: [
      ['cabin', 430, 660, 0xc39a74], ['cabin', 553, 667, 0xab6262], ['cabin', 562, 781, 0xbca995],
      ['antenna', 342, 695], ['supplies', 451, 789], ['tracked', 595, 880, 0xc18a50], ['tracked', 2212, 1540, 0xa6b7bf],
      ['tent', 2096, 1465, 0xb89151], ['tent', 2257, 1439, 0xa65f56], ['supplies', 2282, 1496],
      ['supplies', 510, 1255], ['bench', 781, 579], ['bench', 2264, 764], ['antenna', 2168, 1450],
    ],
    vegetation: [['moss', 207, 1140, 7], ['moss', 705, 1150, 4], ['moss', 2240, 987, 5]],
    gravel: [[453, 995, 290, 410], [2070, 1020, 460, 370], [620, 1374, 350, 260], [2083, 1580, 400, 260]],
    pathColor: 0xb0a193,
  },
  'death-valley': {
    zones: [
      ['salt', 451, 976, 655, 654, 'Badwater Salt Flats'],
      ['dunes', 2045, 870, 650, 505, 'Mesquite-Style Dunes'],
      ['strata', 2095, 1410, 590, 440, 'Painted Badlands'],
      ['strata', 536, 539, 536, 235, 'Canyon Walls'],
      ['gravel', 431, 1320, 460, 234, 'Dry Wash'],
      ['gravel', 2100, 1660, 495, 305],
    ],
    roads: [[[140, 1640], [372, 1580], [630, 1497], [747, 1370], [800, 1195], [815, 850], [785, 699], [857, 575], [1075, 469], [1425, 467], [1710, 511], [1800, 644], [1730, 828], [1745, 1000], [1820, 1205], [1816, 1400], [1859, 1580], [2160, 1750], [2425, 1715]]],
    trails: [
      [[747, 1370], [681, 1316], [641, 1268], [644, 1199], [708, 1217]],
      [[785, 699], [633, 672], [493, 628], [393, 606]],
      [[1800, 644], [1970, 651], [2058, 739], [2200, 763]],
      [[1820, 1205], [1984, 1194], [2200, 1271], [2305, 1373]],
      [[1859, 1580], [1965, 1555], [2090, 1581], [2197, 1580], [2264, 1650]],
      [[630, 1497], [695, 1572], [823, 1666], [1035, 1717], [1250, 1805]],
    ],
    channels: [
      [[115, 525], [223, 603], [247, 714], [170, 822], [105, 970], [139, 1180], [251, 1325], [394, 1400]],
      [[2438, 940], [2356, 1030], [2281, 1141], [2284, 1230], [2387, 1343], [2314, 1491]],
    ],
    props: [
      ['ranger', 451, 1530, 0xab7854], ['ranger', 600, 1490, 0xc39762], ['bench', 714, 1372],
      ['truck', 398, 1609, 0x55766a], ['truck', 569, 1578, 0xb58042], ['truck', 2029, 1693, 0x8e633e],
      ['tent', 2218, 1590, 0xc17d46], ['tent', 2298, 1622, 0xab9561], ['supplies', 2268, 1662],
      ['spring', 329, 1382], ['bench', 2250, 1360],
    ],
    vegetation: [['scrub', 764, 1119, 9], ['scrub', 2246, 1130, 10], ['scrub', 339, 1383, 9], ['cactus', 688, 558, 5], ['flowers', 2140, 1554, 8]],
    gravel: [[596, 560, 342, 219], [740, 1165, 165, 385], [1974, 1225, 456, 235], [2085, 1560, 500, 390]],
    pathColor: 0xd2ab79,
  },
  mcmurdo: {
    zones: [
      ['glacier', 2073, 595, 374, 500, 'Upper Glacier'],
      ['lake', 444, 1190, 594, 322, 'Western Frozen Lake'],
      ['frost', 680, 909, 303, 222, 'Permafrost Polygons'],
      ['frost', 2090, 1503, 477, 214, 'Frozen Ground'],
      ['gravel', 515, 1443, 493, 250, 'Exposed Valley Floor'],
      ['gravel', 2068, 1620, 449, 266],
      ['strata', 677, 554, 355, 155, 'Dry Valley Ridge'],
    ],
    roads: [[[138, 1625], [321, 1625], [522, 1521], [676, 1415], [757, 1261], [802, 1061], [768, 895], [760, 718], [830, 608], [1004, 485], [1298, 470], [1559, 482], [1751, 511], [1840, 638], [1762, 814], [1743, 1006], [1740, 1291], [1782, 1470], [1878, 1569], [2211, 1680], [2394, 1695]]],
    trails: [
      [[676, 1415], [611, 1303], [530, 1280], [410, 1294]],
      [[760, 718], [637, 747], [556, 795], [488, 811]],
      [[1840, 638], [1893, 696], [1919, 759], [1953, 818]],
      [[1782, 1470], [1906, 1457], [2020, 1461], [2160, 1501]],
      [[522, 1521], [639, 1537], [809, 1604], [978, 1685], [1120, 1767], [1250, 1805]],
    ],
    channels: [
      [[403, 743], [443, 826], [414, 879], [455, 934], [437, 997], [476, 1081]],
      [[2065, 775], [2026, 828], [2041, 872], [2006, 916], [1995, 958]],
    ],
    props: [
      ['cabin', 401, 1515, 0xb75c55], ['cabin', 551, 1494, 0xad7057], ['tent', 308, 1492, 0xbc9d6a],
      ['tent', 630, 1374, 0xbc8150], ['antenna', 322, 1542], ['supplies', 598, 1554], ['tracked', 508, 1606, 0xc0a25d],
      ['tracked', 2176, 1589, 0xaabdc8], ['supplies', 2164, 1528], ['antenna', 2070, 1513],
      ['bench', 533, 810], ['supplies', 640, 1270],
    ],
    vegetation: [],
    gravel: [[477, 940, 408, 310], [569, 1445, 428, 297], [2088, 1578, 620, 334], [1930, 696, 280, 190]],
    pathColor: 0xadaa9d,
    waterColor: 0x6ba6bc,
  },
  atacama: {
    zones: [
      ['strata', 439, 811, 574, 546, 'Valle de la Luna'],
      ['basalt', 2095, 518, 538, 356, 'Volcanic Foothills'],
      ['salt', 2092, 1044, 672, 640, 'Atacama Salt Flat'],
      ['lagoon', 2040, 915, 287, 151, 'Saline Lagoon'],
      ['lagoon', 2182, 1149, 265, 164, 'Shallow Wetland'],
      ['gravel', 454, 1268, 460, 246, 'Alluvial Plain'],
      ['gravel', 1991, 1549, 455, 245],
      ['strata', 566, 545, 385, 180, 'Salt Ridges'],
    ],
    roads: [[[122, 1644], [355, 1620], [579, 1493], [720, 1386], [789, 1180], [795, 876], [726, 688], [743, 542], [935, 430], [1278, 443], [1538, 470], [1772, 556], [1816, 699], [1770, 929], [1735, 1135], [1790, 1374], [1864, 1525], [2140, 1600], [2446, 1518]]],
    trails: [
      [[726, 688], [593, 686], [480, 738], [334, 724]],
      [[789, 1180], [660, 1082], [486, 1041], [316, 1152]],
      [[743, 542], [626, 471], [417, 478]],
      [[1816, 699], [1925, 638], [2145, 636], [2276, 692]],
      [[1770, 929], [1812, 978], [1901, 1055], [2004, 1054], [2134, 1004], [2235, 1001]],
      [[1790, 1374], [1891, 1279], [2060, 1265], [2265, 1245]],
      [[720, 1386], [744, 1501], [724, 1619], [645, 1783]],
      [[579, 1493], [661, 1545], [776, 1620], [923, 1691], [1088, 1732], [1250, 1805]],
    ],
    channels: [
      [[119, 547], [227, 656], [213, 796], [293, 899], [267, 1012], [324, 1138]],
      [[2317, 572], [2356, 702], [2273, 777], [2295, 851], [2399, 930]],
    ],
    props: [
      ['adobe', 384, 1471, 0xc48b61], ['adobe', 522, 1448, 0xcd9966], ['adobe', 381, 1586, 0x9f624a], ['adobe', 514, 1570, 0xbe8153],
      ['cabin', 655, 1330, 0xb97856], ['antenna', 690, 1308], ['supplies', 693, 1357], ['truck', 650, 1451, 0x936345],
      ['observatory', 450, 422, 0xe9e4d0], ['observatory', 622, 474, 0xd4dadc], ['antenna', 558, 462],
      ['mine', 575, 1732, 0xa8845f], ['mine', 699, 1789, 0xa9825f], ['supplies', 762, 1770], ['truck', 663, 1831, 0x607675],
      ['tent', 1933, 1509, 0xc28c52], ['tent', 2028, 1532, 0xa87954], ['bench', 1890, 1055],
    ],
    vegetation: [['scrub', 1930, 984, 9], ['scrub', 2229, 1220, 10], ['scrub', 426, 1524, 5], ['cactus', 504, 1050, 5]],
    gravel: [[445, 794, 550, 414], [645, 1221, 320, 311], [2057, 620, 547, 338], [2098, 1490, 425, 318]],
    pathColor: 0xc5a779,
  },
};

const fieldLandColors: Record<Land, readonly [number, number, number]> = {
  salt: [0xd0c5ad, 0xf6eedb, 0xb8aba0],
  dunes: [0xcfa06a, 0xe5b674, 0x9a673d],
  strata: [0x80605b, 0xb57955, 0xe6b084],
  basalt: [0x4b4145, 0x70605a, 0xa78d71],
  lagoon: [0xe2dfc3, 0x6b9d8b, 0x578987],
  frost: [0x8c9098, 0xadbdc1, 0x777b8b],
  glacier: [0x688c9e, 0xb4cfda, 0xe9f1ec],
  lake: [0x718e9d, 0xabccd2, 0xe1efea],
  gravel: [0x9a806b, 0xa99480, 0x6b6061],
};

function fieldFeaturePolygon(x: number, y: number, w: number, h: number, noise = 0) {
  return Array.from({ length: 16 }, (_, i) => {
    const angle = i * Math.PI / 8;
    const scale = .85 + ((i * 37 + noise) % 31) / 160;
    return { x: Math.round(x + Math.cos(angle) * w / 2 * scale), y: Math.round(y + Math.sin(angle) * h / 2 * scale) };
  });
}

function insideFieldFeature(x: number, y: number, cx: number, cy: number, w: number, h: number) {
  return ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2 < .64;
}

function fieldGroundZone(art: Graphics, zone: Zone, region: LandscapeRegion) {
  const [kind, x, y, w, h] = zone;
  const [edge, fill, line] = fieldLandColors[kind];
  const points = fieldFeaturePolygon(x, y, w, h, x % 31);
  const icy = kind === 'glacier' || kind === 'lake';
  const shore = icy || kind === 'lagoon';
  const inset = (scale: number) => points.map(p => ({ x: x + (p.x - x) * scale, y: y + (p.y - y) * scale }));
  if (shore) {
    art.fillStyle(edge, .18).fillPoints(inset(1.06), true);
    art.fillStyle(edge, .9).fillPoints(points, true);
    art.fillStyle(fill, .96).fillPoints(inset(.89), true);
  } else {
    for (const [scale, alpha] of [[1.044, .10], [1.01, .16], [.97, .25]]) {
      art.fillStyle(edge, alpha).fillPoints(inset(scale), true);
    }
    art.fillStyle(fill, kind === 'gravel' ? .28 : .68).fillPoints(inset(.92), true);
    art.fillStyle(fill, kind === 'gravel' ? .19 : .49).fillPoints(inset(.83), true);
  }
  for (const [i, point] of points.entries()) {
    const next = points[(i + 1) % points.length];
    for (let j = 1; j <= 8; j++) {
      const t = j / 9, shift = (j * 7 + i * 3) % 19 - 9;
      const px = Math.round(point.x + (next.x - point.x) * t + shift);
      const py = Math.round(point.y + (next.y - point.y) * t - shift * .6);
      art.fillStyle(j % 3 ? edge : fill, shore ? .29 : .39).fillRect(px, py, 3 + (i + j) % 8, 2 + j % 4);
    }
  }

  if (kind === 'salt' || kind === 'frost') {
    const spacing = kind === 'salt' ? 47 : 39;
    for (let py = y - h / 2 + 20, row = 0; py < y + h / 2; py += spacing * .78, row++) {
      for (let px = x - w / 2 + spacing / 2 + (row % 2) * spacing / 2; px < x + w / 2; px += spacing) {
        if (!insideFieldFeature(px, py, x, y, w - 16, h - 12)) continue;
        const cell = [{ x: px - spacing / 2, y: py - 5 }, { x: px - spacing / 6, y: py - spacing / 2 },
          { x: px + spacing / 3, y: py - spacing / 3 }, { x: px + spacing / 2, y: py + 5 },
          { x: px + spacing / 7, y: py + spacing / 2 }, { x: px - spacing / 3, y: py + spacing / 3 }];
        art.lineStyle(2, line, .68).strokePoints(cell, true);
        art.lineStyle(1, 0xf9f4dc, .57).lineBetween(cell[1].x, cell[1].y + 3, cell[2].x, cell[2].y + 3);
      }
    }
  }
  if (kind === 'strata' || kind === 'basalt' || kind === 'dunes' || icy || kind === 'lagoon') {
    const dunes = kind === 'dunes';
    const layered = kind === 'strata' || kind === 'basalt';
    const cold = region === 'haughton' || region === 'mcmurdo';
    const layers = layered ? (cold ? [0x564f54, 0x747078, 0x96827b, 0xb8a59a] : [0x854b46, 0xa76650, 0xcd8f5d, 0xebbe8a]) : [edge, line, icy ? 0xe3eff1 : fill];
    for (let i = 0; i < (dunes ? 23 : layered ? 16 : 10); i++) {
      const relY = ((i + .5) / (dunes ? 23 : layered ? 16 : 10) - .5) * 1.5;
      const reach = w * .39 * Math.sqrt(1 - relY * relY);
      const py = y + h * relY * .49;
      const band = [-1, -.7, -.37, 0, .32, .68, 1].map((f, j) => ({
        x: x + reach * f + (j % 2 ? 4 : 0),
        y: py + Math.round((Math.sin(i * .45 + j * .91) * (dunes ? 9 : layered ? 19 : 7) - j * (layered ? 2 : .45)) / 2) * 2,
      }));
      art.lineStyle(layered ? Math.max(5, h / 22) : dunes ? 3 : 2, layers[i % layers.length], layered ? .9 : .59).strokePoints(band, false);
      if (layered || dunes || icy) art.lineStyle(2, icy ? 0xe6f4f0 : 0xefcf9e, .37)
        .strokePoints(band.map(p => ({ x: p.x, y: p.y - 4 })), false);
    }
  }
  if (kind === 'basalt') {
    const cone = (cx: number, cy: number, size: number) => {
      const polygon = (color: number, vertices: number[][]) => art.fillStyle(color).fillPoints(vertices
        .map(([dx, dy]) => ({ x: cx + dx * size, y: cy + dy * size })), true);
      polygon(0x4f4548, [[-114, 63], [-78, 28], [-33, -65], [-19, -78], [14, -78], [36, -60], [87, 31], [123, 62], [70, 77], [-33, 81]]);
      polygon(0x796159, [[-104, 56], [-68, 23], [-29, -63], [-16, -73], [1, -66], [8, -45], [-4, 63], [-48, 73]]);
      polygon(0x605053, [[8, -63], [32, -53], [79, 34], [121, 60], [67, 67], [23, 36]]);
      polygon(0x39343f, [[-21, -72], [-12, -76], [11, -76], [25, -66], [9, -61], [-15, -64]]);
      for (const dx of [-55, -26, 46, 68]) {
        art.lineStyle(3, 0xa28a72, .63).strokePoints([{ x: cx + dx * .31 * size, y: cy - 44 * size },
          { x: cx + dx * .69 * size, y: cy + 12 * size }, { x: cx + dx * size, y: cy + 58 * size }], false);
      }
    };
    cone(x - 89, y + 12, 1.13);
    cone(x + 116, y + 33, .72);
  }
  const grit = kind === 'lagoon' ? 19 : icy ? 38 : 83;
  for (let i = 0; i < grit; i++) {
    const px = Math.round(x - w / 2 + (i * 67 + x) % w), py = Math.round(y - h / 2 + (i * 113 + y) % h);
    if (!insideFieldFeature(px, py, x, y, w, h)) continue;
    art.fillStyle(i % 3 ? line : 0xf1dec0, kind === 'lagoon' ? .24 : .34).fillRect(px, py, 2 + i % 7, i % 2 ? 2 : 3);
  }

}

function sampleFieldTrack(points: readonly TrailPoint[], spacing: number, visit: (x: number, y: number, nx: number, ny: number, index: number) => void) {
  let offset = 0, index = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (!length) continue;
    for (; offset < length; offset += spacing) {
      visit(a.x + dx * offset / length, a.y + dy * offset / length, -dy / length, dx / length, index++);
    }
    offset -= length;
  }
}

function fieldGroundTrails(art: Graphics, scene: Scenery) {
  const main = scene.roads.map(nodes => roundTrail(nodes, 112));
  const tracks = [
    ...main.map(points => ({ points, width: 42 })),
    ...scene.trails.map(([start, ...end]) => ({
      points: roundTrail([nearestTrailPoint(main[0], start), ...end], 64), width: 20,
    })),
  ];
  for (const { points, width } of tracks) {
    art.lineStyle(width + 22, scene.pathColor, .14).strokePoints(points, false);
    art.lineStyle(width + 9, scene.pathColor, .3).strokePoints(points, false);
    art.lineStyle(width, scene.pathColor, .72).strokePoints(points, false);
  }
  for (const { points, width } of tracks) {
    sampleFieldTrack(points, 10, (x, y, nx, ny, index) => {
      for (const side of [-1, 1]) {
        const margin = side * (width / 2 + (index * 13 % 14) - 6);
        const px = Math.round(x + nx * margin), py = Math.round(y + ny * margin);
        if (index % 4) art.fillStyle(index % 3 ? scene.pathColor : 0x69574d, .26).fillRect(px, py, 4 + index % 5, 2 + index % 2);
        if (width > 20 && index % 8 < 4) {
          const rut = side * width * .24;
          art.fillStyle(0x927e68, .27).fillRect(Math.round(x + nx * rut), Math.round(y + ny * rut), 4, 3);
        }
      }
    });

  }
  for (const nodes of scene.channels) {
    const points = roundTrail(nodes, 32);
    art.lineStyle(25, scene.waterColor ? 0xc2cdcb : 0x765b54, .66).strokePoints(points, false);
    art.lineStyle(14, scene.waterColor ?? 0x99806d, .92).strokePoints(points, false);
    art.lineStyle(3, scene.waterColor ? 0xc4e3df : 0xb39a81, .9).strokePoints(points.map(p => ({ x: p.x - 3, y: p.y - 2 })), false);
    for (const [i, p] of points.entries()) {
      if (i % 3 === 0) art.fillStyle(scene.waterColor ? 0x6a7265 : 0x6e5e56, .65).fillRect(p.x + 8, p.y + 3, 5, 4);
    }

  }
}


function fieldStone(art: Graphics, x: number, y: number, size: number, cold: boolean, variant: number) {
  const dark = cold ? 0x575361 : 0x694943;
  const middle = cold ? 0x888487 : 0x9d7359;
  const light = cold ? 0xb9b4ae : 0xc69d77;
  const w = size, h = Math.max(5, Math.round(size * .58));
  art.fillStyle(dark, cold ? .26 : .38).fillEllipse(x + w * .19, y + h * .27, w * 1.37, h * .72);
  art.fillStyle(dark).fillPoints([
    { x: x - w * .49, y }, { x: x - w * .39, y: y - h * .64 }, { x: x - w * .14, y: y - h },
    { x: x + w * .29, y: y - h * .91 }, { x: x + w * .5, y: y - h * .3 }, { x: x + w * .39, y: y + 2 },
  ], true);
  art.fillStyle(variant % 3 === 0 ? light : middle).fillPoints([
    { x: x - w * .4, y: y - h * .28 }, { x: x - w * .32, y: y - h * .65 }, { x: x - w * .13, y: y - h * .89 },
    { x: x + w * .24, y: y - h * .84 }, { x: x + w * .35, y: y - h * .6 }, { x: x + w * .1, y: y - h * .51 },
  ], true);
  art.fillStyle(light, .6).fillRect(x - w * .22, y - h * .7, Math.max(3, w * .27), 2);
}

function fieldVegetation(art: Graphics, [kind, cx, cy, count]: Scenery['vegetation'][number]) {
  for (let i = 0; i < count; i++) {
    const x = cx + (i * 39 + 17) % 110 - 55, y = cy + (i * 53 + 16) % 88 - 44;
    if (kind === 'moss') {
      art.fillStyle(0x63654b, .8).fillEllipse(x, y, 10 + i % 5, 5 + i % 3);
      art.fillStyle(0x8b865b, .6).fillRect(x - 2, y - 3, 5, 2);
    } else if (kind === 'cactus') {
      art.fillStyle(0x4b4d41).fillRect(x - 2, y - 14, 5, 15).fillRect(x - 6, y - 10, 5, 4);
      art.fillStyle(0x79805a).fillRect(x, y - 13, 2, 12).fillRect(x + 3, y - 7, 4, 3);
    } else {
      art.fillStyle(0x605939, .76).fillEllipse(x + 2, y + 2, 16, 6);
      art.fillStyle(0x7c8053).fillEllipse(x, y - 2, 13, 8).fillEllipse(x + 6, y - 4, 7, 5);
      art.fillStyle(kind === 'flowers' ? (i % 2 ? 0xe1c85e : 0xd69c99) : 0xa8a270)
        .fillRect(x - 2, y - 7, 4, 3).fillRect(x + 5, y - 6, 3, 2);
    }
  }
}

function fieldLandscapeGroundDetails(art: Graphics, region: LandscapeRegion) {
  if (region === 'haughton') {
    const rim = roundTrail([[380, 1281], [278, 1087], [261, 838], [335, 680], [483, 555], [730, 440], [970, 380],
      [1264, 348], [1590, 371], [1842, 444], [2050, 562], [2179, 709], [2251, 920], [2240, 1080], [2167, 1293]], 93);
    art.lineStyle(59, 0x56505d, .84).strokePoints(rim, false);
    art.lineStyle(37, 0x8c7973, .95).strokePoints(rim.map(p => ({ x: p.x - 4, y: p.y - 13 })), false);
    art.lineStyle(8, 0xbba792, .92).strokePoints(rim.map(p => ({ x: p.x - 5, y: p.y - 21 })), false);
    for (const [i, point] of rim.entries()) {
      if (i % 7 === 0) fieldStone(art, point.x, point.y, 22 + i % 30, true, i);
    }
  }
  if (region === 'death-valley') {
    art.fillStyle(0xa98361, .72).fillRoundedRect(335, 1537, 304, 100, 12);
    art.lineStyle(2, 0xe2cc9b, .82).strokeRoundedRect(341, 1543, 292, 88, 8);
    for (const x of [397, 454, 511, 568]) art.lineStyle(2, 0xe2cc9b, .73).lineBetween(x, 1560, x, 1619);
  }
  if (region === 'atacama') {
    art.fillStyle(0xa37557, .35).fillRoundedRect(313, 1419, 274, 184, 7);
    art.fillStyle(0x916e54, .55).fillRect(447, 1434, 5, 146);
    for (let i = 0; i < 12; i++) art.fillStyle(0xbd9870, .73).fillRect(402 + i * 11, 1507, 8, 3);
  }
}

// This ground pass is clipped to the original research center by the region builder.
export function paintFieldCenter(ground: Graphics, region: LandscapeRegion) {
  const scene = landscapes[region];
  fieldLandscapeGroundDetails(ground, region);
  for (const zone of scene.zones) fieldGroundZone(ground, zone, region);
  fieldGroundTrails(ground, scene);
  for (const [kind, x, y] of scene.props) {
    if (kind !== 'cabin' && kind !== 'ranger' && kind !== 'adobe' && kind !== 'tent' && kind !== 'mine' && kind !== 'observatory') continue;
    const apron = fieldFeaturePolygon(x + 6, y - 9, kind === 'tent' ? 123 : 148, 63, Math.round(x / 17));
    ground.fillStyle(scene.pathColor, .33).fillPoints(apron, true);
    for (const [i, p] of apron.entries()) {
      ground.fillStyle(i % 2 ? 0x826d60 : scene.pathColor, .36).fillRect(p.x, p.y, 4 + i % 5, 3);
    }
  }
  const cold = region === 'haughton' || region === 'mcmurdo';
  for (const [cx, cy, w, h] of scene.gravel) {
    for (let i = 0; i < 78; i++) {
      const x = Math.round(cx - w / 2 + (i * 121 + cx) % w), y = Math.round(cy - h / 2 + (i * 79 + cy) % h);
      if (!insideFieldFeature(x, y, cx, cy, w + 100, h + 60)) continue;
      if (i % 5 === 0) fieldStone(ground, x, y, 19 + (i * 17) % 24, cold, i);
      else ground.fillStyle(cold ? 0x615f67 : 0x8d6650, .42).fillRect(x, y, 3 + i % 7, 2 + i % 4);
    }
  }
  for (const patch of scene.vegetation) fieldVegetation(ground, patch);
}
