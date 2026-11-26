import type { EventoCompleto } from '../services/eventos';

/** Funções de mapa e distância. Coordenadas sempre como [latitude, longitude]. */

export type Coordenadas = [number, number];

/** Coordenadas do evento; sem elas, as do local. Null se nenhum dos dois tem (issue #25). */
export function coordenadasDoEvento({ evento, local }: EventoCompleto): Coordenadas | null {
  const latitude = evento.latitude ?? local?.latitude;
  const longitude = evento.longitude ?? local?.longitude;
  if (latitude == null || longitude == null) return null;
  return [Number(latitude), Number(longitude)];
}

/** Distância em linha reta, em km (fórmula de haversine). */
export function distanciaKm([lat1, lon1]: Coordenadas, [lat2, lon2]: Coordenadas): number {
  const rad = (graus: number) => (graus * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "350 m" ou "1,2 km" */
export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/**
 * Tempo a pé aproximado: 5 km/h, com 30% a mais porque as ruas não vão em linha reta.
 * "8 min" ou "1h20".
 */
export function tempoAPe(km: number): string {
  const minutos = Math.max(1, Math.round(((km * 1.3) / 5) * 60));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
}
