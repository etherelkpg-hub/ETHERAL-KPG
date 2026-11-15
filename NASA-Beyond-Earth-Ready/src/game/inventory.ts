import type { EquipmentArt } from './art/equipment';
import type { FieldMap } from './store';

export const INVENTORY_TOOLS = [
  {
    id: 'rover', name: 'Rover with Mobility Systems', summary: 'Traverses rough terrain to survey and sample the surface.',
    detail: 'The rover carries instruments across rocks, slopes and loose sediment. In the traverse trial, compare the direct route and the surveyed detour. Slope, wheel slip and energy use show how the terrain affects mobility.',
  },
  {
    id: '3d-mapping', name: '3D Mapping Instruments', summary: 'Map terrain relief and surface features in three dimensions.',
    detail: 'Overlapping views or distance measurements are combined into a model of the ground. The model helps researchers estimate slopes, locate obstacles and pick a route before the rover approaches.',
  },
  {
    id: 'water-ice-detector', name: 'Ice Detection Instruments', summary: 'Look for indicators of ice at or below the surface.',
    detail: 'An ice survey compares signals from the surface and the layers underneath it. At Haughton and McMurdo, use the radar boundary as a clue. A core or another independent measurement is needed to identify the material.',
  },
  {
    id: 'navigation-cameras', name: 'Navigation Cameras', summary: 'Capture views of the rover’s surroundings for route planning.',
    detail: 'Images of the path ahead reveal rocks, edges and clear routes. Views from more than one position help estimate the distance to obstacles. Low light and deep shadows can make the terrain harder to interpret.',
  },
  {
    id: 'sample-collector', name: 'Sample Collection System', summary: 'Collects and stores rock and soil for analysis.',
    detail: 'A collector gathers surface sediment, rock fragments or cores for later analysis. Keep samples separate and record their location and depth so each reading can be traced to the material it came from.',
  },
  {
    id: 'drill', name: 'Drilling System', summary: 'Reaches buried material and retrieves a core.',
    detail: 'Survey the ground layers, then choose Steady or Boost to attempt a 30 cm core within the 10 Wh game budget. Track the depth reached, power used and recovered material across soils with different drilling loads.',
  },
  {
    id: 'gpr', name: 'Ground-Penetrating Radar (GPR)', summary: 'Scans below ground for layer boundaries and buried features.',
    detail: 'Radar pulses reflect where subsurface materials change. Run a second line from another direction to check a return before picking a follow-up survey point. Reflections can show a boundary without telling you what it is made of.',
  },
  {
    id: 'environment-station', name: 'Environmental Monitoring Station', summary: 'Logs weather and other conditions at the site.',
    detail: 'A field station records conditions over time. The game compares temperature, wind, humidity, dust and light under an exposed daytime setup and a sheltered dusk setup. Keep the setup consistent when comparing two locations.',
  },
  {
    id: 'autonomous-navigation', name: 'Autonomous Navigation Systems', summary: 'Guide the rover around obstacles with limited operator input.',
    detail: 'Navigation combines sensor readings with a terrain map to choose where the rover can drive. If the slope or wheel slip is too high, the rover can stop and a surveyed detour can be tried in the traverse trial.',
  },
  {
    id: 'spectrometer', name: 'Spectrometer', summary: 'Finds clues to material composition by measuring light.',
    detail: 'A spectrum records how a sample interacts with different wavelengths. Compare loose material and an exposed outcrop, then repeat the scan on a fresh surface to check whether weathering or dust affected the mineral clues.',
  },
  {
    id: 'robotic-arm', name: 'Robotic Arm', summary: 'Positions instruments and picks up surface samples.',
    detail: 'The arm places a tool at a target or transfers a rock or soil sample into storage. It needs a clear approach and a stable rover position, especially near steep slopes or loose material.',
  },
] as const satisfies readonly { id: EquipmentArt; name: string; summary: string; detail: string }[];

export type InventoryTool = (typeof INVENTORY_TOOLS)[number]['id'];

const dryDesertTools = ['rover', 'sample-collector', 'drill', 'gpr', 'environment-station', 'autonomous-navigation', 'spectrometer'] as const;

export const FIELD_EQUIPMENT: Record<FieldMap, readonly InventoryTool[]> = {
  atacama: dryDesertTools,
  haughton: [...dryDesertTools, '3d-mapping', 'water-ice-detector', 'navigation-cameras', 'robotic-arm'],
  'death-valley': dryDesertTools,
  wadi: ['rover', '3d-mapping', 'navigation-cameras', 'sample-collector', 'autonomous-navigation', 'spectrometer'],
  mcmurdo: ['rover', '3d-mapping', 'water-ice-detector', 'navigation-cameras', 'sample-collector', 'gpr', 'environment-station', 'autonomous-navigation', 'spectrometer'],
};
