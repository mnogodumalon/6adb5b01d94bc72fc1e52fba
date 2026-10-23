/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'mitarbeiter'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.mitarbeiter.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.mitarbeiter.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.mitarbeiter.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.mitarbeiter              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   mitarbeiter: mitarbeiter_vorname, mitarbeiter_nachname, email, telefon, abteilung  ·  ← ausleihen (list + contextual +)
 *   geraete: bezeichnung, geraetetyp, hersteller, modell, betriebssystem_version, seriennummer, imei, bildschirmgroesse, …  ·  ← ausleihen (list + contextual +)
 *   ausleihen: geraet, mitarbeiter, ausleihdatum, rueckgabe_geplant, rueckgabe_tatsaechlich, verwendungszweck, status, bemerkung  ·  → geraete · → mitarbeiter
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Mitarbeiter, Geraete, Ausleihen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichAusleihen } from '@/lib/enrich';
import type { EnrichedAusleihen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { MitarbeiterDialog, type MitarbeiterDialogDefaults } from '@/components/dialogs/MitarbeiterDialog';
import { MitarbeiterDetails } from '@/components/details/MitarbeiterDetails';
import { GeraeteDialog, type GeraeteDialogDefaults } from '@/components/dialogs/GeraeteDialog';
import { GeraeteDetails } from '@/components/details/GeraeteDetails';
import { AusleihenDialog, type AusleihenDialogDefaults } from '@/components/dialogs/AusleihenDialog';
import { AusleihenDetails } from '@/components/details/AusleihenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'mitarbeiter'; record: Mitarbeiter }
  | { type: 'geraete'; record: Geraete }
  | { type: 'ausleihen'; record: EnrichedAusleihen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  mitarbeiter: EntityCrudApi<Mitarbeiter, MitarbeiterDialogDefaults>;
  geraete: EntityCrudApi<Geraete, GeraeteDialogDefaults>;
  ausleihen: EntityCrudApi<Ausleihen, AusleihenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { mitarbeiter: Mitarbeiter[]; geraete: Geraete[]; ausleihen: EnrichedAusleihen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [mitarbeiterDialog, setMitarbeiterDialog] = useState<{ defaults?: MitarbeiterDialogDefaults; editing?: Mitarbeiter } | null>(null);
  const [geraeteDialog, setGeraeteDialog] = useState<{ defaults?: GeraeteDialogDefaults; editing?: Geraete } | null>(null);
  const [ausleihenDialog, setAusleihenDialog] = useState<{ defaults?: AusleihenDialogDefaults; editing?: Ausleihen } | null>(null);
  const enrichedAusleihen = useMemo(() => enrichAusleihen(data.ausleihen, { geraeteMap: data.geraeteMap, mitarbeiterMap: data.mitarbeiterMap }), [data.ausleihen, data.geraeteMap, data.mitarbeiterMap]);

  function detailMitarbeiter(record: Mitarbeiter, push = false) {
    const item: OverlayItem = { type: 'mitarbeiter', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitarbeiter(fields: Mitarbeiter['fields']) {
    const editing = mitarbeiterDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitarbeiter(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitarbeiterEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitarbeiter')} — ${t('crud_updated')}`, async () => {
        data.setMitarbeiter(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitarbeiterEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitarbeiterEntry(fields);
      undoToast(`${appLabel('mitarbeiter')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailGeraete(record: Geraete, push = false) {
    const item: OverlayItem = { type: 'geraete', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitGeraete(fields: Geraete['fields']) {
    const editing = geraeteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setGeraete(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateGeraeteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('geraete')} — ${t('crud_updated')}`, async () => {
        data.setGeraete(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateGeraeteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createGeraeteEntry(fields);
      undoToast(`${appLabel('geraete')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAusleihen(record: Ausleihen, push = false) {
    const rec = enrichedAusleihen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'ausleihen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAusleihen(fields: Ausleihen['fields']) {
    const editing = ausleihenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAusleihen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAusleihenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('ausleihen')} — ${t('crud_updated')}`, async () => {
        data.setAusleihen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAusleihenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAusleihenEntry(fields);
      undoToast(`${appLabel('ausleihen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <MitarbeiterDialog
        open={mitarbeiterDialog !== null}
        onClose={() => setMitarbeiterDialog(null)}
        onSubmit={submitMitarbeiter}
        defaultValues={mitarbeiterDialog?.defaults}
        recordId={mitarbeiterDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeiter']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeiter']}
      />
      <GeraeteDialog
        open={geraeteDialog !== null}
        onClose={() => setGeraeteDialog(null)}
        onSubmit={submitGeraete}
        defaultValues={geraeteDialog?.defaults}
        recordId={geraeteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Geraete']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Geraete']}
      />
      <AusleihenDialog
        open={ausleihenDialog !== null}
        onClose={() => setAusleihenDialog(null)}
        onSubmit={submitAusleihen}
        defaultValues={ausleihenDialog?.defaults}
        recordId={ausleihenDialog?.editing?.record_id}
        geraeteList={data.geraete}
        mitarbeiterList={data.mitarbeiter}
        enablePhotoScan={AI_PHOTO_SCAN['Ausleihen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Ausleihen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'mitarbeiter') {
            return (
              <>
                <RecordHeader title={top.record.fields.mitarbeiter_vorname ?? appLabel('mitarbeiter')} subtitle={undefined} />
                <MitarbeiterDetails
                  record={top.record}
                  ausleihenList={data.ausleihen}
                  onOpenAusleihen={(r) => detailAusleihen(r, true)}
                  onAddAusleihen={perms.canWrite('ausleihen') ? () => setAusleihenDialog({ defaults: { mitarbeiter: createRecordUrl(APP_IDS.MITARBEITER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'geraete') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('geraete')} subtitle={undefined} />
                <GeraeteDetails
                  record={top.record}
                  ausleihenList={data.ausleihen}
                  onOpenAusleihen={(r) => detailAusleihen(r, true)}
                  onAddAusleihen={perms.canWrite('ausleihen') ? () => setAusleihenDialog({ defaults: { geraet: createRecordUrl(APP_IDS.GERAETE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'ausleihen') {
            return (
              <>
                <RecordHeader title={top.record.fields.verwendungszweck ?? appLabel('ausleihen')} subtitle={top.record.fields.ausleihdatum ? formatDate(top.record.fields.ausleihdatum) : undefined} />
                <AusleihenDetails
                  record={top.record}
                  geraeteList={data.geraete}
                  onOpenGeraete={(r) => detailGeraete(r, true)}
                  mitarbeiterList={data.mitarbeiter}
                  onOpenMitarbeiter={(r) => detailMitarbeiter(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'mitarbeiter') return perms.canWrite('mitarbeiter');
          if (top.type === 'geraete') return perms.canWrite('geraete');
          if (top.type === 'ausleihen') return perms.canWrite('ausleihen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'mitarbeiter') setMitarbeiterDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'geraete') setGeraeteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'ausleihen') setAusleihenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    mitarbeiter: {
      openCreate: (defaults?: MitarbeiterDialogDefaults) => (perms.canWrite('mitarbeiter') ? setMitarbeiterDialog({ defaults }) : refuse()),
      openEdit: (record: Mitarbeiter) => (perms.canWrite('mitarbeiter') ? setMitarbeiterDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Mitarbeiter) => detailMitarbeiter(record, false),
      canWrite: perms.canWrite('mitarbeiter'),
    },
    geraete: {
      openCreate: (defaults?: GeraeteDialogDefaults) => (perms.canWrite('geraete') ? setGeraeteDialog({ defaults }) : refuse()),
      openEdit: (record: Geraete) => (perms.canWrite('geraete') ? setGeraeteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Geraete) => detailGeraete(record, false),
      canWrite: perms.canWrite('geraete'),
    },
    ausleihen: {
      openCreate: (defaults?: AusleihenDialogDefaults) => (perms.canWrite('ausleihen') ? setAusleihenDialog({ defaults }) : refuse()),
      openEdit: (record: Ausleihen) => (perms.canWrite('ausleihen') ? setAusleihenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Ausleihen) => detailAusleihen(record, false),
      canWrite: perms.canWrite('ausleihen'),
    },
    enriched: { mitarbeiter: data.mitarbeiter, geraete: data.geraete, ausleihen: enrichedAusleihen },
  };
}
