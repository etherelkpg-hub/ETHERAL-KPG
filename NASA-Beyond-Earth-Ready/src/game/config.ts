import { FIELD_MAPS, STAGES, type FieldMap, type SaveData, type Stage } from './store';

export const AIRPORT_SIZE = { w: 1700, h: 780 };
export const AIRPORT_ENTRY = { x: 150, y: 687 };

export interface Destination {
  id: FieldMap; place: string; country: string; airport: string; code: string;
  price: number; flight: string; gate: number; blurb: string;
  minutes: number; distance: number; route: { x: number; y: number };
  geography?: { region: string; continent: string; latitude: number; longitude: number };
}
export let missions: Record<Stage, { title: string; text: string }>;
export let destinations: Destination[] = [];

export function formatSiteCoordinates({ latitude, longitude }: NonNullable<Destination['geography']>) {
  return `${Math.abs(latitude).toFixed(2)}° ${latitude < 0 ? 'S' : 'N'}, ${Math.abs(longitude).toFixed(2)}° ${longitude < 0 ? 'W' : 'E'}`;
}

export function pendingTicketFlights(game: SaveData): readonly string[] {
  if (game.pendingFlights) return game.pendingFlights;
  const legacyFlight = game.flags.ticket && game.tickets.at(-1)?.flight;
  return legacyFlight ? [legacyFlight] : [];
}

export function pendingDestinations(game: SaveData) {
  const flights = pendingTicketFlights(game);
  return destinations.filter((destination) => flights.includes(destination.flight));
}

export function flightForBoarding(game: SaveData, destinationId?: FieldMap) {
  return pendingDestinations(game).find((destination) => destination.id === destinationId);
}

export async function loadGameConfig() {
  const read = async (name: string) => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
    if (!response.ok) throw new Error(`Could not load ${name} (${response.status}).`);
    return response.json();
  };
  const [m, d] = await Promise.all([read('missions'), read('destinations')]);
  if (!m || STAGES.some(stage => typeof m[stage]?.title !== 'string' || typeof m[stage]?.text !== 'string')) {
    throw new Error('Every mission needs a title and text in missions.json.');
  }
  if (!Array.isArray(d) || d.length !== FIELD_MAPS.length || d.some((item, index) =>
    !item || item.id !== FIELD_MAPS[index] || item.gate !== index + 1 ||
    ['place', 'country', 'airport', 'code', 'flight', 'blurb'].some(k => typeof item[k] !== 'string') ||
    !Number.isFinite(item.price) || item.price < 0 || !Number.isFinite(item.minutes) || !Number.isFinite(item.distance) ||
    !Number.isFinite(item.route?.x) || !Number.isFinite(item.route?.y) ||
    (item.geography !== undefined && (!item.geography ||
      typeof item.geography.region !== 'string' || typeof item.geography.continent !== 'string' ||
      !Number.isFinite(item.geography.latitude) || Math.abs(item.geography.latitude) > 90 ||
      !Number.isFinite(item.geography.longitude) || Math.abs(item.geography.longitude) > 180))
  )) throw new Error('Invalid destination data in destinations.json.');
  missions = m;
  destinations = d;
}
