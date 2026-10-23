import { useMemo } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconDeviceTablet, IconCheck } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { Ausleihen, Geraete } from '@/types/app';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { tx, appLabel } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { geraete, ausleihen, setAusleihen, setGeraete, fetchAll } = data;
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');

  const enriched = (data as unknown as { ausleihen: Ausleihen[] }).ausleihen;
  void enriched;

  // ---- shared write path: status advance (hero, work list, overlay footer, drag) ----
  const setLoan = (id: string, key: string, returned: string | null, start?: string) => {
    setAusleihen(prev => prev.map(r => r.record_id !== id ? r : {
      ...r,
      fields: {
        ...r.fields,
        status: lookupOption('ausleihen', 'status', key),
        rueckgabe_tatsaechlich: returned ?? undefined,
        ...(start ? { ausleihdatum: start } : {}),
      },
    }));
    return LivingAppsService.updateAusleihenEntry(id, {
      status: key,
      rueckgabe_tatsaechlich: returned as unknown as string,
      ...(start ? { ausleihdatum: start } : {}),
    }).catch(() => { void fetchAll(); });
  };

  const nextKey = (a: Ausleihen): string | undefined => {
    const k = lookupKey(a.fields.status);
    if (k === 'angefragt') return 'ausgeliehen';
    if (k === 'ausgeliehen' || k === 'ueberfaellig') return 'zurueckgegeben';
    return undefined;
  };

  const changeStatus = (a: Ausleihen, key: string, msg: string) => {
    const prevKey = lookupKey(a.fields.status) ?? 'angefragt';
    const prevReturned = a.fields.rueckgabe_tatsaechlich ?? null;
    const prevStart = a.fields.ausleihdatum;
    void setLoan(a.record_id, key, key === 'zurueckgegeben' ? today : null, key === 'ausgeliehen' ? today : undefined);
    undoToast(msg, () => { void setLoan(a.record_id, prevKey, prevReturned, prevStart); });
  };

  const advance = (a: Ausleihen) => {
    const key = nextKey(a);
    if (!key) return;
    const name = geraetName(a);
    changeStatus(a, key, key === 'zurueckgegeben' ? tx`${name} — zurückgegeben` : tx`${name} — ausgegeben`);
  };

  const advanceLabel = (a: Ausleihen) =>
    nextKey(a) === 'ausgeliehen' ? tx('Ausgeben') : tx('Zurück');

  const geraetById = useMemo(() => new Map(geraete.map(g => [g.record_id, g])), [geraete]);
  const geraetName = (a: Ausleihen): string => {
    const id = a.fields.geraet?.match(/([a-f0-9]{24})$/i)?.[1];
    return (id && geraetById.get(id)?.fields.bezeichnung) || tx('Gerät');
  };

  const crud = useEntityCrud(data, {
    footer: top => {
      if (top.type !== 'ausleihen') return undefined;
      const rec = ausleihen.find(r => r.record_id === top.record.record_id);
      if (!rec || !nextKey(rec)) return undefined;
      return { label: advanceLabel(rec), onClick: () => advance(rec) };
    },
  });
  const enrichedAusleihen = crud.enriched.ausleihen;
  const nameOf = (id: string) => enrichedAusleihen.find(e => e.record_id === id);

  // ---- derived ----
  const effKey = (a: Ausleihen): string => {
    const k = lookupKey(a.fields.status) ?? '';
    const due = a.fields.rueckgabe_geplant?.slice(0, 10);
    return k === 'ausgeliehen' && due && due < today ? 'ueberfaellig' : k;
  };
  const isOut = (a: Ausleihen) => { const k = effKey(a); return k === 'ausgeliehen' || k === 'ueberfaellig'; };

  const overdue = ausleihen
    .filter(a => effKey(a) === 'ueberfaellig')
    .sort((a, b) => (a.fields.rueckgabe_geplant ?? '').localeCompare(b.fields.rueckgabe_geplant ?? ''));
  const dueSoon = ausleihen
    .filter(a => effKey(a) === 'ausgeliehen')
    .sort((a, b) => (a.fields.rueckgabe_geplant ?? '9999').localeCompare(b.fields.rueckgabe_geplant ?? '9999'));
  const outCount = ausleihen.filter(isOut).length;
  const defekte = geraete.filter(g => lookupKey(g.fields.zustand) === 'defekt');
  const outDeviceIds = new Set(ausleihen.filter(isOut).map(a => a.fields.geraet?.match(/([a-f0-9]{24})$/i)?.[1]));
  const available = geraete.filter(g => !outDeviceIds.has(g.record_id) && lookupKey(g.fields.zustand) !== 'defekt').length;

  const mName = (a: Ausleihen) => nameOf(a.record_id)?.mitarbeiterName || tx('Unbekannt');

  const columns = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['ausleihen']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );

  const toneFor = (k: string): KanbanTone =>
    k === 'ueberfaellig' ? 'warning' : k === 'ausgeliehen' ? 'primary' : k === 'zurueckgegeben' ? 'success' : 'default';

  const cards: KanbanCard[] = ausleihen.map(a => {
    const k = effKey(a);
    const due = a.fields.rueckgabe_geplant;
    return {
      id: `ausleihe:${a.record_id}`,
      column: k || (columns[0]?.key ?? ''),
      title: geraetName(a),
      subtitle: `${mName(a)}${due && k !== 'zurueckgegeben' ? ` · ${tx('bis')} ${formatDate(due)}` : ''}`,
      tone: toneFor(k),
    };
  });

  const moveCard = (cardId: string, newColumn: string) => {
    const rec = ausleihen.find(r => r.record_id === cardId.split(':')[1]);
    if (!rec) return;
    changeStatus(rec, newColumn, tx`${geraetName(rec)} — Status geändert`);
  };

  const chartRows: ChartRow<Geraete>[] = geraete.map(g => ({ id: `geraet:${g.record_id}`, data: g }));

  // ---- header context ----
  let context: string;
  if (overdue.length > 0) {
    const n = namen(overdue.map(a => mName(a)));
    context = overdue.length === 1 ? tx`${n} muss noch ein Gerät zurückgeben.` : tx`${n} müssen noch Geräte zurückgeben.`;
  } else if (dueSoon.length > 0) {
    const a = dueSoon[0];
    const g = geraetName(a);
    const m = mName(a);
    context = tx`Als Nächstes zurück: ${g} von ${m}.`;
  } else if (geraete.length > 0) {
    const n = geraete.length;
    context = tx`Alle ${n} Geräte sind im Lager.`;
  } else {
    context = tx('Richte dein Testgeräte-Lager ein.');
  }

  const empty = geraete.length === 0;

  const hero = empty
    ? (crud.geraete.canWrite && (
      <HeroBanner
        icon={<IconDeviceTablet size={48} />}
        action={{ label: tx('Erstes Gerät aufnehmen'), onClick: () => crud.geraete.openCreate({}) }}
      >
        {tx('Noch keine Geräte erfasst — nimm das erste iPad, iPhone oder Android-Handy auf.')}
      </HeroBanner>
    ))
    : overdue.length > 0 && (
      <HeroBanner
        icon={<IconAlertTriangle size={18} />}
        action={{ label: tx('Als zurückgegeben melden'), onClick: () => advance(overdue[0]) }}
      >
        <b>{geraetName(overdue[0])}</b> {tx('bei')} <b>{mName(overdue[0])}</b>{' '}
        {tx`überfällig seit ${formatDate(overdue[0].fields.rueckgabe_geplant)}`}
        {overdue.length > 1 ? ` (+${overdue.length - 1})` : ''}
      </HeroBanner>
    );

  const kpis = empty ? undefined : (
    <StatStrip>
      <StatStripItem title={tx('Verfügbar')} value={`${available} / ${geraete.length}`} tone="success" />
      <StatStripItem title={tx('Ausgeliehen')} value={outCount} tone="primary" />
      <StatStripItem title={tx('Defekt')} value={defekte.length} tone={defekte.length > 0 ? 'warning' : 'default'} />
    </StatStrip>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.ausleihen.canWrite && !empty && (
          <Button onClick={() => crud.ausleihen.openCreate({ status: 'ausgeliehen', ausleihdatum: today })}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Gerät ausleihen')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={hero || undefined}
        kpis={kpis}
        primary={
          empty ? null : (
            <KanbanWidget
              cards={cards}
              columns={columns}
              defaultCollapsed={['zurueckgegeben']}
              onCardClick={card => {
                const rec = ausleihen.find(r => r.record_id === card.id.split(':')[1]);
                if (rec) crud.ausleihen.openDetail(rec);
              }}
              onCardMove={moveCard}
              onAddCard={crud.ausleihen.canWrite ? (column => crud.ausleihen.openCreate({ status: column })) : undefined}
            />
          )
        }
        aside={empty ? undefined : (
          <>
            <WorkList
              title={tx('Bald fällig')}
              items={dueSoon.slice(0, 6).map(a => ({
                id: a.record_id,
                title: geraetName(a),
                secondLine: (
                  <>
                    <span className="font-medium">{mName(a)}</span>
                    <span className="text-muted-foreground"> · {tx('bis')} {formatDate(a.fields.rueckgabe_geplant)}</span>
                  </>
                ),
                action: { label: advanceLabel(a), onClick: () => advance(a) },
              }))}
              onItemClick={id => { const r = ausleihen.find(x => x.record_id === id); if (r) crud.ausleihen.openDetail(r); }}
              empty={{ text: tx('Keine offenen Ausleihen mit Rückgabetermin.') }}
            />
            <WorkList
              title={tx('Defekte Geräte')}
              items={defekte.map(g => ({
                id: g.record_id,
                title: g.fields.bezeichnung ?? tx('Gerät'),
                secondLine: (
                  <>
                    <span className="font-medium text-destructive">{g.fields.zustand?.label}</span>
                    <span className="text-muted-foreground"> · {g.fields.geraetetyp?.label}</span>
                  </>
                ),
                action: {
                  label: <span className="inline-flex items-center gap-1"><IconCheck size={14} />{tx('Repariert')}</span> as unknown as string,
                  onClick: () => {
                    const prev = lookupKey(g.fields.zustand) ?? 'defekt';
                    const setZ = (key: string) => {
                      setGeraete(list => list.map(x => x.record_id === g.record_id ? { ...x, fields: { ...x.fields, zustand: lookupOption('geraete', 'zustand', key) } } : x));
                      return LivingAppsService.updateGeraeteEntry(g.record_id, { zustand: key }).catch(() => { void fetchAll(); });
                    };
                    void setZ('gut');
                    undoToast(tx`${g.fields.bezeichnung ?? ''} — als repariert markiert`, () => { void setZ(prev); });
                  },
                },
              }))}
              onItemClick={id => { const g = geraete.find(x => x.record_id === id); if (g) crud.geraete.openDetail(g); }}
              empty={{ text: tx('Keine defekten Geräte — alles einsatzbereit.') }}
            />
            <ChartWidget<Geraete>
              title={tx('Geräte nach Typ')}
              rows={chartRows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.geraetetyp, label: appLabel('geraete') }}
            />
          </>
        )}
      />
      {crud.surfaces}
    </div>
  );
}
