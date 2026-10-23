/**
 * useGeraetZurueckgebenFlow — the plumbing of the flow « Gerät zurückgeben », generated from the plan.
 *
 * Changes `ausleihen`: the record to change is picked (`flow.pick('ausleihen')`), the form is prefilled with its values; asks `bemerkung`; sets `rueckgabe_tatsaechlich`, `status` itself.
Changes `geraete` (only when the person fills it): the record to change is picked (`flow.pick('geraete')`), the form is prefilled with its values; asks `zustand`, `standort`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useGeraetZurueckgebenFlow({
 *     steps: { ausleihen: 1, geraete: 2, bemerkung: 3, zustand: 3, standort: 3 },
 *     items: { ausleihen: r => ({ id: r.id, title: fieldText(r, 'verwendungszweck') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.ausleihen.select} {...flow.pick('ausleihen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.geraete.select} {...flow.pick('geraete')} />
 *     <Bound form={flow.forms.ausleihen} name="bemerkung" />
 *     <Bound form={flow.forms.geraete} name="zustand" />
 *     <Bound form={flow.forms.geraete} name="standort" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type GeraetZurueckgebenFieldKey = 'ausleihen' | 'bemerkung' | 'geraete' | 'standort' | 'zustand';

export interface GeraetZurueckgebenForms {
  ausleihen: StepForm<'ausleihen'>;
  geraete: StepForm<'geraete'>;
}

// Alias so the option generics stay readable.
type Key = GeraetZurueckgebenFieldKey;

export interface GeraetZurueckgebenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    ausleihen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    geraete?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"ausleihen": 1, "bemerkung": 3, "geraete": 2, "standort": 3, "zustand": 3};
export const GERAETZURUECKGEBEN_REVIEW_STEP = 4;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useGeraetZurueckgebenFlow(options: GeraetZurueckgebenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [ausleihenTargetId, setAusleihenTargetId] = useState<string | null>(null);
  const [geraeteTargetId, setGeraeteTargetId] = useState<string | null>(null);
  const ausleihen = useStepForm('ausleihen', {
    fields: ["bemerkung"],
    steps: only(steps, ["bemerkung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["bemerkung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["bemerkung"]),
  });
  const geraete = useStepForm('geraete', {
    fields: ["zustand", "standort"],
    steps: only(steps, ["zustand", "standort"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["zustand", "standort"]),
    messages: only(options.messages as Record<string, string> | undefined, ["zustand", "standort"]),
  });
  const forms: GeraetZurueckgebenForms = { ausleihen, geraete };
  const formList: StepForm[] = [ausleihen, geraete];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    ausleihen: useRecordSearch(servicePort, 'ausleihen', withPickPolicy('ausleihen', {
      searchFields: ["verwendungszweck"] as never,
      filter: "r.v_status in ['ausgeliehen', 'ueberfaellig']",
      where: (r: JourneyRecord) => ["ausgeliehen", "ueberfaellig"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.ausleihen as never,
    })),
    geraete: useRecordSearch(servicePort, 'geraete', withPickPolicy('geraete', {
      searchFields: ["bezeichnung"] as never,
      toItem: options.items?.geraete as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:geraet-zurueckgeben:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:geraet-zurueckgeben:write:${entity}.${field}`,
  });
  const picks = {
    ausleihen: { ...searches.ausleihen, select: { ...searches.ausleihen.select, create: false as boolean, hint: hintFor('ausleihen', 'ausleihen', {"conditions": [{"field": "status", "op": "in", "value": ["ausgeliehen", "ueberfaellig"]}], "mode": "all"} as PickWhere | null) } },
    geraete: { ...searches.geraete, select: { ...searches.geraete.select, create: false as boolean, hint: hintFor('geraete', 'geraete', null as PickWhere | null) } },
  };

  const geraeteFilled = hasValues(geraete);
  const plan: PlanStep[] = [
    {
      key: 'ausleihen', entity: 'ausleihen', form: ausleihen,
      updates: () => ausleihenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => ausleihenTargetId
        ? { key: 'target:ausleihen', label: entityLabel('ausleihen'), value: picks.ausleihen.labelOf(ausleihenTargetId) ?? ausleihenTargetId, step: steps.ausleihen }
        : undefined,
      values: (): FormValues => ({
        rueckgabe_tatsaechlich: policyFixedValue('ausleihen', 'rueckgabe_tatsaechlich') ?? todayIso(),
        status: policyFixedValue('ausleihen', 'status') ?? "zurueckgegeben",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('ausleihen', 'status', policyFixedValue('ausleihen', 'status') ?? "zurueckgegeben")],
    },
    ...(geraeteFilled ? [{
      key: 'geraete', entity: 'geraete', form: geraete, primary: true,
      updates: () => geraeteTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => geraeteTargetId
        ? { key: 'target:geraete', label: entityLabel('geraete'), value: picks.geraete.labelOf(geraeteTargetId) ?? geraeteTargetId, step: steps.geraete }
        : undefined,
      // the planner's assumptions that first act here — shown once with „Passt“ / „ändern“
      notices: () => [{"assumed": "Optional", "id": "zustand-bei-rueckgabe", "question": "Soll der Ger\u00e4tezustand bei R\u00fcckgabe immer gepr\u00fcft werden?"}],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'geraet-zurueckgeben' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    ausleihen: {
      selectedId: ausleihenTargetId,
      onSelect: (id: string) => {
        setAusleihenTargetId(id);
        const rec = picks.ausleihen.recordOf(id);
        if (rec) ausleihen.reset({ bemerkung: fieldText(rec, "bemerkung"), });
      },
      get record(): JourneyRecord | undefined { return ausleihenTargetId ? picks.ausleihen.recordOf(ausleihenTargetId) : undefined; },
    },
    geraete: {
      selectedId: geraeteTargetId,
      onSelect: (id: string) => {
        setGeraeteTargetId(id);
        const rec = picks.geraete.recordOf(id);
        if (rec) geraete.reset({ zustand: fieldLookup(rec, "zustand")?.key, standort: fieldText(rec, "standort"), });
      },
      get record(): JourneyRecord | undefined { return geraeteTargetId ? picks.geraete.recordOf(geraeteTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: GeraetZurueckgebenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: GeraetZurueckgebenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setAusleihenTargetId(null); setGeraeteTargetId(null); };

  return {
    slug: 'geraet-zurueckgeben' as const,
    draftKey: 'geraet-zurueckgeben' as const,
    entity: 'geraete' as const,
    form: geraete,
    forms, formList, picks, submit, steps, targets,    reviewStep: GERAETZURUECKGEBEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type GeraetZurueckgebenFlow = ReturnType<typeof useGeraetZurueckgebenFlow>;
