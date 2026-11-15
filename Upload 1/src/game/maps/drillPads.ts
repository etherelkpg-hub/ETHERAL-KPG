import { DRILL_PADS } from '../drill';
import { FIELD_EQUIPMENT } from '../inventory';
import { fieldEquipmentPosition } from '../fieldLayout';
import type { FieldMap } from '../store';
import type { OutlineItem, WorldScene } from '../scenes/WorldScene';
import { openPanel } from '../story';

export function buildDrillPads(s: WorldScene, region: FieldMap): OutlineItem[] {
  if (!FIELD_EQUIPMENT[region].includes('drill')) return [];
  return DRILL_PADS.filter((pad) => pad.region === region && !pad.archived).map(({ id, name }) => {
    const { x, y } = fieldEquipmentPosition(region, 'drill');
    const ground = s.add.graphics().setDepth(-790);
    const rig = s.add.graphics().setDepth(y);
    const stripe = 0xe9b957;
    ground.fillStyle(0x242739, 0.25).fillEllipse(x, y - 5, 145, 62);
    ground.lineStyle(2, stripe, 0.9).strokeEllipse(x, y - 5, 125, 52);
    rig.fillStyle(0x272b36).fillRect(x - 42, y - 15, 84, 15);
    rig.fillStyle(0x5c7280).fillRect(x - 39, y - 16, 78, 7);
    rig.fillStyle(0x3a4a57).fillRect(x - 33, y - 71, 8, 59).fillRect(x + 25, y - 71, 8, 59);
    rig.fillStyle(0x91a8ae).fillRect(x - 33, y - 76, 66, 8).fillRect(x - 30, y - 67, 3, 50);
    rig.fillStyle(0xc88a39).fillRect(x - 18, y - 62, 36, 23);
    rig.fillStyle(stripe).fillRect(x - 16, y - 62, 32, 6).fillRect(x - 36, y - 14, 7, 4).fillRect(x + 30, y - 14, 7, 4);
    rig.fillStyle(0xd5e4e4).fillRect(x - 4, y - 39, 8, 25);
    for (let i = 0; i < 4; i++) rig.fillStyle(0x4f6575).fillRect(x - 4, y - 36 + i * 5, 8, 2);
    rig.fillStyle(0x233740).fillRect(x + 49, y - 33, 22, 27);
    rig.fillStyle(0x78d8a6).fillRect(x + 52, y - 29, 16, 9);
    s.label(name, x, y - 94, 17, '#fff0c7', y + 1);
    s.solid(x - 42, y - 24, 85, 25);
    s.solid(x + 49, y - 20, 22, 16);
    s.interact(id, x, y + 22, 76, 'Operate Drill · ' + name, () => openPanel('drill', { researchSite: id }));
    return { x: x - 65, y: y - 32, w: 130, h: 57, shape: 'ellipse', kind: 'site', label: 'Drill · ' + name };
  });
}
