// Auto-generated. Per-entity form-enhancements config for "Ausleihen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["geraet", "mitarbeiter"], "cols": "1fr 1fr"}, "status", {"row": ["ausleihdatum", "rueckgabe_geplant"], "cols": "1fr 1fr"}, "rueckgabe_tatsaechlich", "verwendungszweck", "bemerkung"],
  defaults: {
    'ausleihdatum': { kind: 'today' },
    'rueckgabe_geplant': { kind: 'todayOffset', days: 14 },
    'status': { kind: 'lookup', key: 'angefragt', label: 'Angefragt' },
  },
  computed: {
    '_ausleihe_dauer_tage': { kind: 'dateDiff', from: 'ausleihdatum', to: 'rueckgabe_geplant', unit: 'days' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
