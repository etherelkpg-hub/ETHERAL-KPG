import { BUILDERS, type MapBuild, type OutlineItem, type WorldScene } from '../scenes/WorldScene';
import { fieldExit } from './fieldTravel';
import { fieldEquipmentRing } from './fieldStation';
import { paintFieldCenter } from './fieldLandscape';
import { FIELD_REGION_SIZE, FIELD_RESEARCH_CENTER, paintFieldPerimeter, placeFieldLandmarks, type PerimeterRegion as Region } from './fieldPerimeter';

type Point = readonly [number, number];
const { w: W, h: H } = FIELD_REGION_SIZE;
const EXIT_X = W / 2;
const perimeterOutlines: Partial<Record<Region, OutlineItem[]>> = {};

const terrain = {
  atacama: {
    name: 'Atacama Desert, Chile', ground: 0xbca680, middle: 0xd0ba93, shade: 0x897b70,
    ridge: 0x76697a, crest: 0xd8c4a1, grain: 0xf0dbaf, basin: 0xcab498,
    edge: [[0, 316], [257, 233], [554, 282], [822, 218], [1128, 306], [1451, 245], [1802, 317], [2092, 240], [2500, 354]],
  },
  haughton: {
    name: 'Haughton Crater, Canada', ground: 0x8d8587, middle: 0x9d9493, shade: 0x706c78,
    ridge: 0x575361, crest: 0xb2aab1, grain: 0xc5c0c3, basin: 0x98989e,
    edge: [[0, 585], [260, 431], [526, 287], [836, 220], [1188, 190], [1520, 209], [1846, 282], [2212, 383], [2500, 584]],
  },
  'death-valley': {
    name: 'Death Valley, California', ground: 0xe3bf83, middle: 0xeac991, shade: 0xc89865,
    ridge: 0xa67455, crest: 0xe6b88d, grain: 0xf5ddaa, basin: 0xeed9b3,
    edge: [[0, 465], [315, 385], [613, 309], [881, 259], [1200, 276], [1530, 235], [1830, 291], [2180, 373], [2500, 457]],
  },
  mcmurdo: {
    name: 'McMurdo Dry Valleys, Antarctica', ground: 0x98979a, middle: 0xb7b0a7, shade: 0x687583,
    ridge: 0x586473, crest: 0xf0f6f7, grain: 0xddd5c5, basin: 0xa8a8a7,
    edge: [[0, 530], [290, 472], [555, 318], [870, 240], [1115, 325], [1426, 290], [1750, 330], [2110, 435], [2500, 568]],
  },
} satisfies Record<Region, {
  name: string; ground: number; middle: number; shade: number;
  ridge: number; crest: number; grain: number; basin: number; edge: Point[];
}>;

const basinShapes: Record<Region, Point[]> = {
  atacama: [[380, 500], [752, 394], [1321, 508], [1743, 577], [2022, 776], [1911, 1240], [1606, 1497], [957, 1560], [535, 1308], [326, 888]],
  haughton: [[257, 724], [502, 477], [978, 321], [1551, 292], [1984, 451], [2264, 707], [2234, 1036], [1873, 1303], [1487, 1430], [879, 1400], [482, 1241], [263, 1008]],
  'death-valley': [[1202, 400], [1449, 546], [1571, 800], [1513, 1098], [1424, 1420], [1456, 1700], [1354, 1812], [1028, 1734], [994, 1544], [1109, 1287], [1201, 1019], [1207, 799], [1042, 552]],
  mcmurdo: [[582, 566], [912, 438], [1419, 515], [1820, 677], [2115, 876], [2190, 1220], [1906, 1550], [1458, 1680], [924, 1530], [674, 1330], [443, 932]],
};

function blendResearchCenter(surface: CanvasRenderingContext2D, center: CanvasRenderingContext2D) {
  const { left, top, right, bottom } = FIELD_RESEARCH_CENTER;
  const feather = 86;
  const horizontal = center.createLinearGradient(left - feather, 0, right + feather, 0);
  const vertical = center.createLinearGradient(0, top - feather, 0, bottom + feather);
  for (const [gradient, span] of [[horizontal, right - left], [vertical, bottom - top]] as const) {
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(feather / (span + 2 * feather), 'black');
    gradient.addColorStop(1 - feather / (span + 2 * feather), 'black');
    gradient.addColorStop(1, 'transparent');
  }
  center.globalCompositeOperation = 'destination-in';
  for (const gradient of [horizontal, vertical]) {
    center.fillStyle = gradient;
    center.fillRect(0, 0, W, H);
  }
  surface.drawImage(center.canvas, 0, 0);
}

function buildFieldRegion(s: WorldScene, region: Region): MapBuild {
  const t = terrain[region];
  const vertices = (points: readonly Point[]) => points.map(([x, y]) => ({ x, y }));
  const north = vertices([[0, 0], [W, 0], ...t.edge.slice().reverse()]);
  const basin = vertices(basinShapes[region]);
  const outline: OutlineItem[] = [
    { x: 0, y: 0, w: W, h: H, kind: 'zone', shape: 'polygon', points: basin },
    { x: 0, y: 0, w: W, h: Math.max(...t.edge.map(([, y]) => y)), kind: 'building', shape: 'polygon', points: north },
  ];
  const texture = 'field-landscape-depth-' + region;

  if (!s.textures.exists(texture)) {
    const art = s.add.graphics();
    art.fillStyle(t.ground).fillRect(0, 0, W, H);
    art.fillStyle(t.shade, 0.25).fillEllipse(W / 2, 810, 2330, 1390);
    art.fillStyle(t.middle, 0.7).fillEllipse(W / 2 + 55, 1040, 2070, 1355);
    art.fillStyle(t.ground, 0.5).fillEllipse(W / 2 - 90, 1150, 1680, 940);
    const basinFloor = basin.map(({ x, y }) => ({
      x: W / 2 + (x - W / 2) * 0.91, y: 990 + (y - 990) * 0.92 + 20,
    }));
    art.fillStyle(t.shade, 0.34).fillPoints(basin, true);
    art.fillStyle(t.basin).fillPoints(basinFloor, true);
    for (let i = 0; i < basin.length; i++) {
      const next = (i + 1) % basin.length;
      const sunlit = basin[next].x < basin[i].x;
      art.fillStyle(sunlit ? t.crest : t.ridge, sunlit ? 0.32 : 0.36)
        .fillPoints([basin[i], basin[next], basinFloor[next], basinFloor[i]], true);
      art.lineStyle(3, sunlit ? t.crest : t.shade, 0.42)
        .lineBetween(basin[i].x, basin[i].y, basin[next].x, basin[next].y);
    }

    for (let i = 0; i < 390; i++) {
      const x = 28 + (i * 317) % (W - 56);
      const y = 245 + (i * 487) % (H - 268);
      art.fillStyle(i % 3 ? t.grain : t.shade, 0.21).fillRect(x, y, 3 + i % 9, 2 + i % 3);
    }

    art.fillStyle(t.ridge).fillPoints(north, true);
    if (region === 'mcmurdo') {
      for (let i = 0; i < 46; i++) {
        const x = 110 + (i * 147) % 2160;
        const y = 834 + (i * 211) % 900;
        if (x > 920 && x < 1590 || x > 1700 && y < 1460) continue;
        const size = 6 + i % 9;
        art.fillStyle(0x6f7075, 0.64).fillRect(x, y, size * 2, size);
        art.fillStyle(0xc3bdb2, 0.8).fillRect(x + 2, y - 2, size, Math.max(3, size - 4));
      }
      art.lineStyle(3, 0xd9d3c1, 0.67).strokeRect(EXIT_X - 80, H - 164, 160, 104);
      art.lineStyle(4, 0xd9d3c1, 0.8).lineBetween(EXIT_X - 16, H - 113, EXIT_X + 16, H - 113);
      for (const x of [EXIT_X - 16, EXIT_X + 16]) art.lineStyle(4, 0xd9d3c1, 0.8).lineBetween(x, H - 134, x, H - 92);
    }

    const surface = s.textures.createCanvas(texture, W, H)!;
    const canvas = surface.getCanvas();
    const context = surface.getContext();
    art.generateTexture(canvas, W, H);
    art.clear();

    // Restore the original center at full opacity, feathering only outside its boundary.
    const center = document.createElement('canvas');
    center.width = W;
    center.height = H;
    const centerContext = center.getContext('2d', { willReadFrequently: true })!;
    centerContext.drawImage(canvas, 0, 0);
    perimeterOutlines[region] = paintFieldPerimeter(art, region);
    art.generateTexture(canvas, W, H);
    art.clear();

    paintFieldCenter(art, region);
    art.generateTexture(center, W, H);
    blendResearchCenter(context, centerContext);
    center.width = center.height = 0;
    surface.refresh();
    art.destroy();
  }

  s.add.image(0, 0, texture).setOrigin(0).setDepth(-940);
  for (const [i, [x, y]] of t.edge.slice(1).entries()) {
    const [left, base] = t.edge[i];
    s.solid(left, 0, x - left, Math.min(y, base) - 12);
  }
  outline.push(...(perimeterOutlines[region] ?? []), ...placeFieldLandmarks(s, region));
  outline.push(...fieldEquipmentRing(s, region));
  outline.push(fieldExit(s, EXIT_X, H));
  return { w: W, h: H, name: t.name, zoom: 1.45, bg: t.ground, mood: 'wadi', spawn: { x: EXIT_X, y: 1805, dir: 'up' }, outline };
}

BUILDERS.atacama = (s) => buildFieldRegion(s, 'atacama');
BUILDERS.haughton = (s) => buildFieldRegion(s, 'haughton');
BUILDERS['death-valley'] = (s) => buildFieldRegion(s, 'death-valley');
BUILDERS.mcmurdo = (s) => buildFieldRegion(s, 'mcmurdo');
