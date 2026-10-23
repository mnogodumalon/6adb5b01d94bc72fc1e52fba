/**
 * Gerät ausleihen — 4-Schritt-Wizard.
 * Steps: 1) Freies Gerät wählen → 2) Mitarbeiter wählen → 3) Zeitraum & Zweck → 4) Prüfen & speichern.
 * Reads: geraete, mitarbeiter. Writes: ausleihen (via useGeraetAusleihenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useGeraetAusleihenFlow } from '@/lib/journey/flows/GeraetAusleihen';
import { tx } from '@/i18n';

export default function GeraetAusleihenPage() {
  const [step, setStep] = useState(1);
  const flow = useGeraetAusleihenFlow({
    steps: { geraet: 1, mitarbeiter: 2, rueckgabe_geplant: 3, verwendungszweck: 3, bemerkung: 3 },
    items: {
      geraet: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: [fieldText(r, 'hersteller'), fieldText(r, 'modell')].filter(Boolean).join(' ') || undefined,
        status: fieldLookup(r, 'geraetetyp') ?? undefined,
        stats: [
          { label: tx('Zustand'), value: fieldLookup(r, 'zustand')?.label ?? '—' },
          { label: tx('Standort'), value: fieldText(r, 'standort') || '—' },
        ],
      }),
      mitarbeiter: r => ({
        id: r.id,
        title: `${fieldText(r, 'mitarbeiter_vorname')} ${fieldText(r, 'mitarbeiter_nachname')}`.trim(),
        subtitle: fieldText(r, 'abteilung') || undefined,
      }),
    },
  });
  const form = flow.forms.ausleihen;

  return (
    <IntentWizardShell
      title={tx('Gerät ausleihen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Ein freies Gerät an einen Mitarbeiter ausleihen.'),
        needs: [tx('Gerät'), tx('Mitarbeiter'), tx('Geplantes Rückgabedatum')],
      }}
    >
      <WizardStep label={tx('Gerät')} description={tx('Wähle ein Gerät, das gerade frei ist.')}>
        <EntitySelectStep
          {...flow.picks.geraet.select}
          {...flow.pick('geraet')}
          searchPlaceholder={tx('Bezeichnung, Hersteller oder Modell …')}
          emptyText={tx('Zurzeit ist kein Gerät frei.')}
        />
      </WizardStep>
      <WizardStep label={tx('Mitarbeiter')} description={tx('Wer bekommt das Gerät?')}>
        <EntitySelectStep
          {...flow.picks.mitarbeiter.select}
          {...flow.pick('mitarbeiter')}
          avatar="initials"
          searchPlaceholder={tx('Name oder E-Mail …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Zeitraum')}
        description={tx('Bis wann soll das Gerät zurückkommen und wofür wird es gebraucht?')}
        needs={['geraet', 'mitarbeiter']}
      >
        <div className="space-y-4">
          <Bound form={form} name="rueckgabe_geplant" />
          <Bound form={form} name="verwendungszweck" />
          <Bound form={form} name="bemerkung" rows={3} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'ausleihdatum', label: tx('Ausleihdatum'), value: format(new Date(), 'dd.MM.yyyy') },
              { key: 'status', label: tx('Status'), value: tx('Ausgeliehen') },
            ]}
            whatHappensNext={tx('Das Gerät gilt ab sofort als ausgeliehen und ist für andere nicht mehr wählbar.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          restartLabel={tx('Weiteres Gerät ausleihen')}
          next={[
            { label: tx('Gerät zurückgeben'), href: '#/intents/geraet-zurueckgeben' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Bei der Rückgabe nutzt du den Ablauf „Gerät zurückgeben“.')}
        />
      )}
    </IntentWizardShell>
  );
}
