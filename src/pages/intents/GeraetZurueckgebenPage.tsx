/**
 * Gerät zurückgeben — 4-Schritt-Wizard.
 * Steps: 1) Offene Ausleihe wählen → 2) Rückgabedatum bestätigen → 3) Zustand & Bemerkung → 4) Prüfen & speichern.
 * Reads: ausleihen (nur ausgeliehen/überfällig), geraete. Writes: ausleihen (Status + Rückgabedatum + Bemerkung), geraete (Zustand, Standort).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconCalendarCheck } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Checkbox } from '@/components/ui/checkbox';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldLookup, fieldRef, todayIso } from '@/lib/journey';
import { useGeraetZurueckgebenFlow } from '@/lib/journey/flows/GeraetZurueckgeben';
import { tx } from '@/i18n';

function niceDate(iso: string | null | undefined): string {
  return iso ? format(parseISO(iso), 'dd.MM.yyyy') : '—';
}

export default function GeraetZurueckgebenPage() {
  const [step, setStep] = useState(1);
  const [dateOk, setDateOk] = useState(false);
  const flow = useGeraetZurueckgebenFlow({
    steps: { ausleihen: 1, geraete: 1, bemerkung: 3, zustand: 3, standort: 3 },
    items: {
      ausleihen: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('geraet') ?? tx('Unbekanntes Gerät'),
        subtitle: tx`${ctx.ref('mitarbeiter') ?? '—'} · fällig ${niceDate(fieldDate(r, 'rueckgabe_geplant'))}`,
        status: fieldLookup(r, 'status') ?? undefined,
      }),
    },
  });

  const today = todayIso();
  const ausleiheId = flow.targets.ausleihen.selectedId;
  const geraetId = flow.targets.geraete.selectedId;
  const rec = flow.targets.ausleihen.record;

  const pickAusleihe = (id: string) => {
    flow.targets.ausleihen.onSelect(id);
    const r = flow.picks.ausleihen.recordOf(id);
    const gid = r ? fieldRef(r, 'geraet') : null;
    if (gid) flow.targets.geraete.onSelect(gid);
    setStep(2);
  };

  return (
    <IntentWizardShell
      title={tx('Gerät zurückgeben')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{ description: tx('Eine offene Ausleihe abschließen und den Gerätezustand festhalten.'), needs: [tx('Das zurückgegebene Gerät')] }}
    >
      <WizardStep label={tx('Ausleihe')} description={tx('Welches Gerät kommt zurück? Nur offene Ausleihen werden angezeigt.')}>
        <EntitySelectStep
          {...flow.picks.ausleihen.select}
          selectedId={ausleiheId}
          onSelect={pickAusleihe}
          avatar="none"
          searchPlaceholder={tx('Verwendungszweck suchen …')}
          emptyText={tx('Es gibt keine offene Ausleihe.')}
        />
      </WizardStep>

      <WizardStep label={tx('Rückgabedatum')} description={tx('Die Rückgabe wird mit dem heutigen Datum eingetragen.')}>
        {ausleiheId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 overflow-hidden">
              <IconCalendarCheck size={28} className="shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-medium truncate">{flow.picks.ausleihen.labelOf(ausleiheId) ?? tx('Gewählte Ausleihe')}</p>
                <p className="text-sm text-muted-foreground">
                  {tx`Rückgabe heute, am ${niceDate(today)}`}
                  {rec ? tx` (geplant: ${niceDate(fieldDate(rec, 'rueckgabe_geplant'))})` : ''}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border p-4 cursor-pointer">
              <Checkbox checked={dateOk} onCheckedChange={c => setDateOk(c === true)} />
              <span className="text-sm">{tx`Das Gerät wurde heute (${niceDate(today)}) zurückgegeben`}</span>
            </label>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => dateOk || tx('Bitte bestätige das Rückgabedatum.')}
              nextStepLabel={tx('Zustand')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      <WizardStep label={tx('Zustand')} description={tx('Wie ist das Gerät zurückgekommen? Ergänze, was wichtig ist.')}>
        {ausleiheId ? (
          <div className="space-y-4">
            {!geraetId && (
              <EntitySelectStep
                {...flow.picks.geraete.select}
                {...flow.pick('geraete')}
                searchPlaceholder={tx('Gerät suchen …')}
              />
            )}
            <Bound form={flow.forms.geraete} name="zustand" />
            <Bound form={flow.forms.geraete} name="standort" />
            <Bound form={flow.forms.ausleihen} name="bemerkung" rows={3} />
            <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Prüfen')} />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'rueckgabe-heute', label: tx('Rückgabedatum'), value: niceDate(today) }]}
            whatHappensNext={tx('Die Ausleihe gilt als zurückgegeben, das Gerät ist wieder frei.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          facts={[
            { label: tx('Status'), value: tx('Zurückgegeben') },
            { label: tx('Rückgabedatum'), value: niceDate(today) },
          ]}
          next={[
            { label: tx('Gerät ausleihen'), href: '#/intents/geraet-ausleihen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
