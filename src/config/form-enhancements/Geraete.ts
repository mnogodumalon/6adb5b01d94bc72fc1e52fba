// Auto-generated. Per-entity form-enhancements config for "Geräte".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "geraetetyp", {"row": ["hersteller", "modell"], "cols": "1fr 1fr"}, "betriebssystem_version", {"row": ["bildschirmgroesse", "speicher_gb"], "cols": "1fr 1fr"}, {"row": ["seriennummer", "imei"], "cols": "1fr 1fr"}, "zustand", "standort", "notizen"],
  defaults: {
    'zustand': { kind: 'lookup', key: 'gut', label: 'Gut' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
