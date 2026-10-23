/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'mitarbeiter' | 'geraete' | 'ausleihen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "mitarbeiter": "mitarbeiter_vorname" | "mitarbeiter_nachname" | "email" | "telefon" | "abteilung";
  "geraete": "bezeichnung" | "hersteller" | "modell" | "betriebssystem_version" | "seriennummer" | "imei" | "standort" | "notizen";
  "ausleihen": "verwendungszweck" | "bemerkung";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "mitarbeiter": never;
  "geraete": never;
  "ausleihen": "geraet" | "mitarbeiter";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "mitarbeiter": {
    "key": "mitarbeiter",
    "appId": "6adb5ae63c53f3e006fef82b",
    "label": "Mitarbeiter",
    "pascal": "Mitarbeiter",
    "single": "MitarbeiterEntry"
  },
  "geraete": {
    "key": "geraete",
    "appId": "6adb5ae94d1c51b80332f839",
    "label": "Geräte",
    "pascal": "Geraete",
    "single": "GeraeteEntry"
  },
  "ausleihen": {
    "key": "ausleihen",
    "appId": "6adb5aea0fed217a8d9982fe",
    "label": "Ausleihen",
    "pascal": "Ausleihen",
    "single": "AusleihenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "mitarbeiter": {
    "mitarbeiter_vorname": {
      "key": "mitarbeiter_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "mitarbeiter_nachname": {
      "key": "mitarbeiter_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "abteilung": {
      "key": "abteilung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Abteilung",
      "writable": true,
      "maxLength": 4000
    }
  },
  "geraete": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "geraetetyp": {
      "key": "geraetetyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Gerätetyp",
      "writable": true,
      "options": [
        "ipad",
        "iphone",
        "android_handy",
        "android_tablet",
        "sonstiges"
      ]
    },
    "hersteller": {
      "key": "hersteller",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hersteller",
      "writable": true,
      "maxLength": 4000
    },
    "modell": {
      "key": "modell",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Modell",
      "writable": true,
      "maxLength": 4000
    },
    "betriebssystem_version": {
      "key": "betriebssystem_version",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Betriebssystem und Version",
      "writable": true,
      "maxLength": 4000
    },
    "seriennummer": {
      "key": "seriennummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Seriennummer",
      "writable": true,
      "maxLength": 4000
    },
    "imei": {
      "key": "imei",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "IMEI",
      "writable": true,
      "maxLength": 4000
    },
    "bildschirmgroesse": {
      "key": "bildschirmgroesse",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Bildschirmgröße (Zoll)",
      "writable": true
    },
    "speicher_gb": {
      "key": "speicher_gb",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Speicherkapazität (GB)",
      "writable": true
    },
    "zustand": {
      "key": "zustand",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Zustand",
      "writable": true,
      "options": [
        "neuwertig",
        "gut",
        "gebrauchsspuren",
        "defekt"
      ]
    },
    "standort": {
      "key": "standort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Standort",
      "writable": true,
      "maxLength": 4000
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen",
      "writable": true
    }
  },
  "ausleihen": {
    "geraet": {
      "key": "geraet",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Gerät",
      "writable": true,
      "targetAppId": "6adb5ae94d1c51b80332f839",
      "targetEntity": "geraete"
    },
    "mitarbeiter": {
      "key": "mitarbeiter",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Mitarbeiter",
      "writable": true,
      "targetAppId": "6adb5ae63c53f3e006fef82b",
      "targetEntity": "mitarbeiter"
    },
    "ausleihdatum": {
      "key": "ausleihdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Ausleihdatum",
      "writable": true
    },
    "rueckgabe_geplant": {
      "key": "rueckgabe_geplant",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Geplantes Rückgabedatum",
      "writable": true
    },
    "rueckgabe_tatsaechlich": {
      "key": "rueckgabe_tatsaechlich",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Tatsächliches Rückgabedatum",
      "writable": true
    },
    "verwendungszweck": {
      "key": "verwendungszweck",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Verwendungszweck",
      "writable": true,
      "maxLength": 4000
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "angefragt",
        "ausgeliehen",
        "zurueckgegeben",
        "ueberfaellig"
      ]
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "mitarbeiter": [],
  "geraete": [
    {
      "kind": "choice",
      "field": "geraetetyp",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "zustand",
      "count": 4
    }
  ],
  "ausleihen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 4
    },
    {
      "kind": "record",
      "field": "geraet",
      "targetEntity": "geraete"
    },
    {
      "kind": "record",
      "field": "mitarbeiter",
      "targetEntity": "mitarbeiter"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "mitarbeiter": [
    "mitarbeiter_vorname"
  ],
  "geraete": [
    "bezeichnung"
  ],
  "ausleihen": [
    "verwendungszweck"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
