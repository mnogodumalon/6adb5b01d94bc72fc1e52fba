import type { Mitarbeiter, Ausleihen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface MitarbeiterDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitarbeiter;
  /** 1:N „Ausleihen" (mitarbeiter): VOLLE Liste — der Block filtert auf diesen Record. */
  ausleihenList: Ausleihen[];
  /** Zeilen-Klick → overlay.push auf das Ausleihen-Detail (nie der Edit-Dialog). */
  onOpenAusleihen: (record: Ausleihen) => void;
  /** Kontextuelles „+": öffnet den Ausleihen-Dialog mit diesem Record vorgesetzt. */
  onAddAusleihen?: () => void;
}

export function MitarbeiterDetails({
  record,
  ausleihenList,
  onOpenAusleihen,
  onAddAusleihen,
}: MitarbeiterDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitarbeiter', 'mitarbeiter_vorname')} value={record.fields.mitarbeiter_vorname} format="text" />
        <RecordField label={fieldLabel('mitarbeiter', 'mitarbeiter_nachname')} value={record.fields.mitarbeiter_nachname} format="text" />
        <RecordField label={fieldLabel('mitarbeiter', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitarbeiter', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitarbeiter', 'abteilung')} value={record.fields.abteilung} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('ausleihen')}
        items={ausleihenList.filter(r => extractRecordId(r.fields.mitarbeiter) === record.record_id)}
        map={r => ({ name: r.fields.verwendungszweck ?? appLabel('ausleihen'), meta: r.fields.ausleihdatum })}
        onOpen={onOpenAusleihen}
        onAdd={onAddAusleihen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITARBEITER} recordId={record.record_id} readOnly={!perms.canWrite('mitarbeiter')} />
    </>
  );
}
