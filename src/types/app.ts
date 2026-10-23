import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Mitarbeiter {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    mitarbeiter_vorname?: string;
    mitarbeiter_nachname?: string;
    email?: string;
    telefon?: string;
    abteilung?: string;
  };
}

export interface Geraete {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    geraetetyp?: LookupValue;
    hersteller?: string;
    modell?: string;
    betriebssystem_version?: string;
    seriennummer?: string;
    imei?: string;
    bildschirmgroesse?: number;
    speicher_gb?: number;
    zustand?: LookupValue;
    standort?: string;
    notizen?: string;
  };
}

export interface Ausleihen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    geraet?: RecordUrl; // applookup -> URL zu 'Geraete' Record
    mitarbeiter?: RecordUrl; // applookup -> URL zu 'Mitarbeiter' Record
    ausleihdatum?: string; // Format: YYYY-MM-DD oder ISO String
    rueckgabe_geplant?: string; // Format: YYYY-MM-DD oder ISO String
    rueckgabe_tatsaechlich?: string; // Format: YYYY-MM-DD oder ISO String
    verwendungszweck?: string;
    status?: LookupValue;
    bemerkung?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '6adb5ae63c53f3e006fef82b',
  GERAETE: '6adb5ae94d1c51b80332f839',
  AUSLEIHEN: '6adb5aea0fed217a8d9982fe',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'geraete': {
    geraetetyp: [{ key: "ipad", get label() { return lookupLabel('geraete', 'geraetetyp', "ipad") ?? "iPad"; } }, { key: "iphone", get label() { return lookupLabel('geraete', 'geraetetyp', "iphone") ?? "iPhone"; } }, { key: "android_handy", get label() { return lookupLabel('geraete', 'geraetetyp', "android_handy") ?? "Android-Handy"; } }, { key: "android_tablet", get label() { return lookupLabel('geraete', 'geraetetyp', "android_tablet") ?? "Android-Tablet"; } }, { key: "sonstiges", get label() { return lookupLabel('geraete', 'geraetetyp', "sonstiges") ?? "Sonstiges"; } }],
    zustand: [{ key: "neuwertig", get label() { return lookupLabel('geraete', 'zustand', "neuwertig") ?? "Neuwertig"; } }, { key: "gut", get label() { return lookupLabel('geraete', 'zustand', "gut") ?? "Gut"; } }, { key: "gebrauchsspuren", get label() { return lookupLabel('geraete', 'zustand', "gebrauchsspuren") ?? "Gebrauchsspuren"; } }, { key: "defekt", get label() { return lookupLabel('geraete', 'zustand', "defekt") ?? "Defekt"; } }],
  },
  'ausleihen': {
    status: [{ key: "angefragt", get label() { return lookupLabel('ausleihen', 'status', "angefragt") ?? "Angefragt"; } }, { key: "ausgeliehen", get label() { return lookupLabel('ausleihen', 'status', "ausgeliehen") ?? "Ausgeliehen"; } }, { key: "zurueckgegeben", get label() { return lookupLabel('ausleihen', 'status', "zurueckgegeben") ?? "Zurückgegeben"; } }, { key: "ueberfaellig", get label() { return lookupLabel('ausleihen', 'status', "ueberfaellig") ?? "Überfällig"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitarbeiter': {
    'mitarbeiter_vorname': 'string/text',
    'mitarbeiter_nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'abteilung': 'string/text',
  },
  'geraete': {
    'bezeichnung': 'string/text',
    'geraetetyp': 'lookup/radio',
    'hersteller': 'string/text',
    'modell': 'string/text',
    'betriebssystem_version': 'string/text',
    'seriennummer': 'string/text',
    'imei': 'string/text',
    'bildschirmgroesse': 'number',
    'speicher_gb': 'number',
    'zustand': 'lookup/select',
    'standort': 'string/text',
    'notizen': 'string/textarea',
  },
  'ausleihen': {
    'geraet': 'applookup/select',
    'mitarbeiter': 'applookup/select',
    'ausleihdatum': 'date/date',
    'rueckgabe_geplant': 'date/date',
    'rueckgabe_tatsaechlich': 'date/date',
    'verwendungszweck': 'string/text',
    'status': 'lookup/select',
    'bemerkung': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitarbeiter = StripLookup<Mitarbeiter['fields']>;
export type CreateGeraete = StripLookup<Geraete['fields']>;
export type CreateAusleihen = StripLookup<Ausleihen['fields']>;