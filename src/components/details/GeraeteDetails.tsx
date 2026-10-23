import type { Geraete, Ausleihen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface GeraeteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Geraete;
  /** 1:N „Ausleihen" (geraet): VOLLE Liste — der Block filtert auf diesen Record. */
  ausleihenList: Ausleihen[];
  /** Zeilen-Klick → overlay.push auf das Ausleihen-Detail (nie der Edit-Dialog). */
  onOpenAusleihen: (record: Ausleihen) => void;
  /** Kontextuelles „+": öffnet den Ausleihen-Dialog mit diesem Record vorgesetzt. */
  onAddAusleihen?: () => void;
}

export function GeraeteDetails({
  record,
  ausleihenList,
  onOpenAusleihen,
  onAddAusleihen,
}: GeraeteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('geraete', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('geraete', 'geraetetyp')} value={record.fields.geraetetyp} format="pill" />
        <RecordField label={fieldLabel('geraete', 'hersteller')} value={record.fields.hersteller} format="text" />
        <RecordField label={fieldLabel('geraete', 'modell')} value={record.fields.modell} format="text" />
        <RecordField label={fieldLabel('geraete', 'betriebssystem_version')} value={record.fields.betriebssystem_version} format="text" />
        <RecordField label={fieldLabel('geraete', 'seriennummer')} value={record.fields.seriennummer} format="text" />
        <RecordField label={fieldLabel('geraete', 'imei')} value={record.fields.imei} format="text" />
        <RecordField label={fieldLabel('geraete', 'bildschirmgroesse')} value={record.fields.bildschirmgroesse} format="text" />
        <RecordField label={fieldLabel('geraete', 'speicher_gb')} value={record.fields.speicher_gb} format="text" />
        <RecordField label={fieldLabel('geraete', 'zustand')} value={record.fields.zustand} format="pill" />
        <RecordField label={fieldLabel('geraete', 'standort')} value={record.fields.standort} format="text" />
        <RecordField label={fieldLabel('geraete', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('ausleihen')}
        items={ausleihenList.filter(r => extractRecordId(r.fields.geraet) === record.record_id)}
        map={r => ({ name: r.fields.verwendungszweck ?? appLabel('ausleihen'), meta: r.fields.ausleihdatum })}
        onOpen={onOpenAusleihen}
        onAdd={onAddAusleihen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.GERAETE} recordId={record.record_id} readOnly={!perms.canWrite('geraete')} />
    </>
  );
}
