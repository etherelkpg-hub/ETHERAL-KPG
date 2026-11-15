import { EQUIPMENT_HEIGHT, EQUIPMENT_WIDTH, paintEquipment, type EquipmentArt } from '@/game/art/equipment';

const imageCache = new Map<EquipmentArt, string>();

function equipmentImageUrl(equipment: EquipmentArt) {
  const cached = imageCache.get(equipment);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = EQUIPMENT_WIDTH;
  canvas.height = EQUIPMENT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  paintEquipment(equipment, (color, x, y, width, height) => {
    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
    context.fillRect(x, y, width, height);
  });
  const url = canvas.toDataURL('image/png');
  imageCache.set(equipment, url);
  return url;
}

export function EquipmentImage({ equipment, size = 80, className = '' }: { equipment: EquipmentArt; size?: number; className?: string }) {
  return <img src={equipmentImageUrl(equipment)} width={size} height={Math.round(size * EQUIPMENT_HEIGHT / EQUIPMENT_WIDTH)} alt=""
    className={className} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} data-equipment-art={equipment} />;
}
