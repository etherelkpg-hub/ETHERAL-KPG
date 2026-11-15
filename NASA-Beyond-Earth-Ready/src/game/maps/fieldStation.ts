import type { FieldMap } from '../store';
import { openPanel } from '../story';
import { buildDrillPads } from './drillPads';
import { FIELD_TOOLS, FIELD_TRIAL_SITES } from '../fieldTrials';
import { FIELD_RINGS } from '../fieldLayout';
import { EQUIPMENT_HEIGHT, EQUIPMENT_WIDTH, paintEquipment } from '../art/equipment';
import type { OutlineItem, WorldScene } from '../scenes/WorldScene';

export function fieldEquipmentRing(s: WorldScene, map: FieldMap): OutlineItem[] {
  const { x: centerX, y: centerY, radiusX, radiusY } = FIELD_RINGS[map];
  const markings = s.add.graphics().setDepth(-926);
  markings.fillStyle(0x252b37, 0.08).fillEllipse(centerX, centerY, radiusX * 2 + 92, radiusY * 2 + 76);
  markings.fillStyle(0xffedcd, 0.06).fillEllipse(centerX, centerY, radiusX * 2 + 70, radiusY * 2 + 54);
  markings.lineStyle(3, 0xffdeb0, 0.44);
  for (let i = 0; i < 64; i++) {
    const start = i * Math.PI / 32;
    const end = start + Math.PI / 65;
    markings.lineBetween(
      centerX + radiusX * Math.cos(start), centerY + radiusY * Math.sin(start),
      centerX + radiusX * Math.cos(end), centerY + radiusY * Math.sin(end),
    );
  }
  const stations = FIELD_TRIAL_SITES.filter((site) => site.map === map).map(({ id, x, y, label, tool }) => {
    const { art, name } = FIELD_TOOLS[tool];
    const base = s.add.graphics().setDepth(-790);
    base.fillStyle(0x272838, 0.27).fillEllipse(x, y + 2, 122, 42);
    base.lineStyle(2, 0xe9b957, 0.82).strokeEllipse(x, y + 2, 112, 36);
    const equipment = s.add.graphics().setDepth(y);
    const scale = 2;
    paintEquipment(art, (color, px, py, width, height) => equipment.fillStyle(color).fillRect(
      x - EQUIPMENT_WIDTH * scale / 2 + px * scale, y - EQUIPMENT_HEIGHT * scale + py * scale, width * scale, height * scale,
    ));
    s.label(label, x, y - 77, 17, '#fff0c7', y + 1);
    s.solid(x - 41, y - 21, 82, 23);
    s.interact(id, x, y + 23, 70, 'Operate · ' + name, () => openPanel('field-trial', { researchSite: id }));
    return { x: x - 55, y: y - 20, w: 110, h: 41, kind: 'site' as const, label };
  });
  return [...stations, ...buildDrillPads(s, map), comparisonTerminal(s, map)];
}

function comparisonTerminal(s: WorldScene, map: FieldMap): OutlineItem {
  const ring = FIELD_RINGS[map];
  const x = ring.x + Math.round(ring.radiusX * 0.72);
  const y = ring.y + ring.radiusY + 130;
  const pad = s.add.graphics().setDepth(-790);
  pad.fillStyle(0x222a33, 0.30).fillEllipse(x, y + 4, 142, 43);
  pad.lineStyle(2, 0x7dc5aa, 0.63).strokeEllipse(x, y + 3, 130, 36);

  const art = s.add.graphics().setDepth(y);
  const rect = (dx: number, dy: number, w: number, h: number, color: number) =>
    art.fillStyle(color).fillRect(x + dx, y + dy, w, h);
  rect(-51, -10, 102, 12, 0x253039);
  rect(-43, -70, 86, 63, 0x303e46);
  rect(-41, -72, 82, 38, 0x657879);
  rect(-35, -69, 70, 30, 0x192c34);
  rect(-30, -65, 60, 23, 0x407373);
  rect(-26, -61, 21, 15, 0x70b1a6);
  rect(7, -61, 19, 15, 0xb76c56);
  rect(-5, -54, 12, 2, 0xebcc95);
  rect(-40, -35, 80, 11, 0x99a5a0);
  rect(-28, -33, 27, 5, 0x435969);
  for (const dx of [14, 21, 28]) rect(dx, -31, 3, 3, 0xf0c66b);
  rect(-31, -19, 62, 3, 0x728782);

  s.label('Comparison Terminal', x, y - 89, 17, '#fff0c7', y + 1);
  s.solid(x - 47, y - 23, 94, 25);
  s.interact('site-comparison-' + map, x, y + 25, 72, 'Open Earth–Mars Comparison', () => openPanel('site-comparison'));
  return { x: x - 48, y: y - 24, w: 96, h: 50, kind: 'site', label: 'Comparison Terminal' };
}
