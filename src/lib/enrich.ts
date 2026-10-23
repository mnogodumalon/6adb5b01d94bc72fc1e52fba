import type { EnrichedAusleihen } from '@/types/enriched';
import type { Ausleihen, Geraete, Mitarbeiter } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AusleihenMaps {
  geraeteMap: Map<string, Geraete>;
  mitarbeiterMap: Map<string, Mitarbeiter>;
}

export function enrichAusleihen(
  ausleihen: Ausleihen[],
  maps: AusleihenMaps
): EnrichedAusleihen[] {
  return ausleihen.map(r => ({
    ...r,
    geraetName: resolveDisplay(r.fields.geraet, maps.geraeteMap, 'bezeichnung'),
    mitarbeiterName: resolveDisplay(r.fields.mitarbeiter, maps.mitarbeiterMap, 'mitarbeiter_vorname'),
  }));
}
