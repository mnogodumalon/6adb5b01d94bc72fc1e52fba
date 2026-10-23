import type { Ausleihen, Geraete, Mitarbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface AusleihenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Ausleihen;
  /** N:1-Ziel „Geraete": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  geraeteList: Geraete[];
  /** Klick auf die Geraete-Relation → overlay.push auf dessen Detail. */
  onOpenGeraete?: (record: Geraete) => void;
  /** N:1-Ziel „Mitarbeiter": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitarbeiterList: Mitarbeiter[];
  /** Klick auf die Mitarbeiter-Relation → overlay.push auf dessen Detail. */
  onOpenMitarbeiter?: (record: Mitarbeiter) => void;
}

export function AusleihenDetails({
  record,
  geraeteList,
  onOpenGeraete,
  mitarbeiterList,
  onOpenMitarbeiter,
}: AusleihenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const geraetTarget = geraeteList.find(r => r.record_id === extractRecordId(record.fields.geraet));
  const mitarbeiterTarget = mitarbeiterList.find(r => r.record_id === extractRecordId(record.fields.mitarbeiter));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('ausleihen', 'ausleihdatum')} value={record.fields.ausleihdatum} format="date" />
        <RecordField label={fieldLabel('ausleihen', 'rueckgabe_geplant')} value={record.fields.rueckgabe_geplant} format="date" />
        <RecordField label={fieldLabel('ausleihen', 'rueckgabe_tatsaechlich')} value={record.fields.rueckgabe_tatsaechlich} format="date" />
        <RecordField label={fieldLabel('ausleihen', 'verwendungszweck')} value={record.fields.verwendungszweck} format="text" />
        <RecordField label={fieldLabel('ausleihen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('ausleihen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('ausleihen', 'geraet')}
          name={geraetTarget?.fields.bezeichnung ?? '—'}
          meta={[geraetTarget?.fields.hersteller, geraetTarget?.fields.modell].filter(Boolean).join(' · ') || undefined}
          onClick={geraetTarget && onOpenGeraete ? () => onOpenGeraete!(geraetTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('ausleihen', 'mitarbeiter')}
          name={mitarbeiterTarget?.fields.mitarbeiter_vorname ?? '—'}
          meta={[mitarbeiterTarget?.fields.email, mitarbeiterTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={mitarbeiterTarget && onOpenMitarbeiter ? () => onOpenMitarbeiter!(mitarbeiterTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.AUSLEIHEN} recordId={record.record_id} readOnly={!perms.canWrite('ausleihen')} />
    </>
  );
}
