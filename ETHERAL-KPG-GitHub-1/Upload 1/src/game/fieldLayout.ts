import type { FieldMap } from './store';
import { FIELD_EQUIPMENT, type InventoryTool } from './inventory';

export const FIELD_RINGS = {
  atacama: { x: 1250, y: 955, radiusX: 275, radiusY: 285 },
  haughton: { x: 1250, y: 955, radiusX: 345, radiusY: 350 },
  'death-valley': { x: 1250, y: 955, radiusX: 265, radiusY: 285 },
  wadi: { x: 1515, y: 1170, radiusX: 315, radiusY: 332 },
  mcmurdo: { x: 1250, y: 955, radiusX: 310, radiusY: 325 },
} satisfies Record<FieldMap, { x: number; y: number; radiusX: number; radiusY: number }>;

export function fieldEquipmentPosition(map: FieldMap, tool: InventoryTool) {
  const { x, y, radiusX, radiusY } = FIELD_RINGS[map];
  const tools = FIELD_EQUIPMENT[map];
  const angle = Math.PI / 2 + tools.indexOf(tool) * 2 * Math.PI / tools.length;
  return {
    x: Math.round(x + radiusX * Math.cos(angle)),
    y: Math.round(y + radiusY * Math.sin(angle)),
  };
}
