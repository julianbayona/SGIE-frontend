import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import reportesApi from '@/api/reportes';
import type {
  DemandaSalonResponse,
  EventosMensualesResponse,
  ReporteAnticiposResponse,
  ReporteFinancieroEventoResponse,
  ResumenEventosResponse,
} from '@/api/types';
import { formatShortId } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import PageTitle from '@/components/ui/PageTitle';

const GOLD = '#A8841C';
const GREEN = '#2E7D32';
const RED = '#C62828';
const BLUE = '#1E64B7';
const STONE = '#64748B';

const estadoColors: Record<string, string> = {
  CONFIRMADO: GREEN,
  CANCELADO: RED,
  PENDIENTE_ANTICIPO: GOLD,
  COTIZACION_APROBADA: BLUE,
  COTIZACION_ENVIADA: '#D97706',
  PENDIENTE: STONE,
};

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const chartTheme = {
  text: {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fill: '#44403c',
    fontSize: 12,
  },
  axis: {
    domain: { line: { stroke: '#d6d3d1', strokeWidth: 1 } },
    ticks: {
      line: { stroke: '#d6d3d1', strokeWidth: 1 },
      text: { fill: '#57534e', fontSize: 11, fontWeight: 700 },
    },
    legend: { text: { fill: '#44403c', fontSize: 12, fontWeight: 800 } },
  },
  grid: { line: { stroke: '#e7e5e4', strokeWidth: 1, strokeDasharray: '4 4' } },
  legends: { text: { fill: '#44403c', fontSize: 12, fontWeight: 800 } },
  tooltip: {
    container: {
      background: '#1c1917',
      color: '#fff',
      fontSize: 12,
      borderRadius: 10,
      boxShadow: '0 12px 30px rgba(28, 25, 23, 0.18)',
    },
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

const inputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = new Date();
const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

const ReportsPage: React.FC = () => {
  const [desde, setDesde] = useState(inputDate(firstDayOfYear));
  const [hasta, setHasta] = useState(inputDate(today));
  const [resumen, setResumen] = useState<ResumenEventosResponse | null>(null);
  const [eventosMensuales, setEventosMensuales] = useState<EventosMensualesResponse[]>([]);
  const [financiero, setFinanciero] = useState<ReporteFinancieroEventoResponse[]>([]);
  const [anticipos, setAnticipos] = useState<ReporteAnticiposResponse | null>(null);
  const [demandaSalones, setDemandaSalones] = useState<DemandaSalonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      const rango = { desde, hasta };
      const [resumenData, mensualData, financieroData, anticiposData, demandaData] = await Promise.all([
        reportesApi.resumenEventos(rango),
        reportesApi.eventosMensuales(rango),
        reportesApi.financieroEventos(rango),
        reportesApi.anticipos(rango),
        reportesApi.demandaSalones(rango),
      ]);
      setResumen(resumenData);
      setEventosMensuales(mensualData);
      setFinanciero(financieroData);
      setAnticipos(anticiposData);
      setDemandaSalones(demandaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarReportes();
    // El primer render usa el rango inicial; las recargas posteriores son manuales.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyChartData = useMemo(
    () =>
      eventosMensuales.map((item) => ({
        mes: `${monthNames[item.mes - 1] ?? item.mes} ${item.anio}`,
        Confirmados: item.confirmados,
        Cancelados: item.cancelados,
        Total: item.total,
      })),
    [eventosMensuales]
  );

  const statePieData = useMemo(
    () =>
      (resumen?.estados ?? [])
        .filter((item) => item.total > 0)
        .map((item) => ({
          id: item.estado,
          label: item.estado.split('_').join(' '),
          value: item.total,
          color: estadoColors[item.estado] ?? STONE,
        })),
    [resumen]
  );

  const salonBarData = useMemo(
    () =>
      demandaSalones.slice(0, 7).map((salon) => ({
        salon: salon.salon,
        Reservas: salon.totalReservas,
        Invitados: salon.totalInvitados,
      })),
    [demandaSalones]
  );

  const anticiposPieData = useMemo(
    () =>
      (anticipos?.porMetodo ?? []).map((metodo) => ({
        id: metodo.metodoPago,
        label: metodo.metodoPago,
        value: Number(metodo.total),
      })),
    [anticipos]
  );

  const saldoPendienteTotal = useMemo(
    () => financiero.reduce((total, item) => total + Number(item.saldoPendiente), 0),
    [financiero]
  );

  const totalCotizado = useMemo(
    () => financiero.reduce((total, item) => total + Number(item.valorTotal), 0),
    [financiero]
  );

  const totalPagado = useMemo(
    () => financiero.reduce((total, item) => total + Number(item.totalPagado), 0),
    [financiero]
  );

  const eventosConSaldo = useMemo(
    () => financiero.filter((item) => Number(item.saldoPendiente) > 0 && item.cotizacionId).slice(0, 6),
    [financiero]
  );

  return (
    <section className="space-y-7 pb-16">
      <PageTitle
        eyebrow="Gerencia"
        title="Reportes ejecutivos"
        description="Lectura rapida de eventos, recaudo, saldos pendientes y uso de salones."
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
              <DateField label="Desde" value={desde} onChange={setDesde} />
              <DateField label="Hasta" value={hasta} onChange={setHasta} />
            </div>
          <Button className="h-10 rounded-xl bg-[#A8841C] px-4 text-xs font-black text-white hover:bg-[#8f7118]" onClick={cargarReportes} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar reportes'}
            </Button>
          </div>
      </PageTitle>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos del periodo" value={String(resumen?.totalEventos ?? 0)} helper="Solicitudes y eventos creados" icon="event" />
        <MetricCard label="Confirmación" value={`${resumen?.porcentajeConfirmados ?? 0}%`} helper={`${resumen?.confirmados ?? 0} confirmados`} icon="check_circle" tone="green" />
        <MetricCard label="Recaudo" value={formatCurrency(Number(anticipos?.totalRecaudado ?? 0))} helper={`${anticipos?.cantidad ?? 0} anticipos recibidos`} icon="payments" />
        <MetricCard label="Saldo pendiente" value={formatCurrency(saldoPendienteTotal)} helper="Cotizaciones aceptadas vigentes" icon="account_balance_wallet" tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartCard
          kicker="Eventos por mes"
          title="Confirmados vs cancelados"
          description="Comparativo mensual para identificar crecimiento, temporadas fuertes y caídas de conversión."
        >
          {monthlyChartData.length === 0 ? (
            <EmptyState message="No hay eventos mensuales para graficar en este periodo." />
          ) : (
            <ResponsiveBar
              data={monthlyChartData}
              keys={['Confirmados', 'Cancelados']}
              indexBy="mes"
              margin={{ top: 24, right: 24, bottom: 52, left: 54 }}
              padding={0.34}
              groupMode="grouped"
              colors={[GREEN, RED]}
              borderRadius={3}
              axisBottom={{ tickRotation: -20, tickSize: 0, tickPadding: 12 }}
              axisLeft={{ tickSize: 0, tickPadding: 10, legend: 'N° de eventos', legendPosition: 'middle', legendOffset: -44 }}
              enableGridX={false}
              enableLabel
              labelSkipHeight={14}
              labelTextColor="#ffffff"
              theme={chartTheme}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'top-left',
                  direction: 'row',
                  translateY: -24,
                  itemWidth: 120,
                  itemHeight: 16,
                  symbolSize: 10,
                },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard
          kicker="Distribución"
          title="Estados del periodo"
          description="Proporción del embudo operativo por estado actual del evento."
        >
          {statePieData.length === 0 ? (
            <EmptyState message="No hay estados disponibles para este rango." />
          ) : (
            <ResponsivePie
              data={statePieData}
              margin={{ top: 20, right: 20, bottom: 30, left: 20 }}
              innerRadius={0.62}
              padAngle={1.2}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={{ datum: 'data.color' }}
              borderWidth={2}
              borderColor="#ffffff"
              enableArcLinkLabels={false}
              arcLabelsSkipAngle={12}
              arcLabel={(datum) => `${datum.value}`}
              arcLabelsTextColor="#ffffff"
              theme={chartTheme}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  translateY: 28,
                  itemWidth: 96,
                  itemHeight: 14,
                  symbolSize: 9,
                },
              ]}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard
          kicker="Salones"
          title="Demanda por salón"
          description="Ranking de reservas vigentes por salón para evaluar ocupación y preferencia."
        >
          {salonBarData.length === 0 ? (
            <EmptyState message="No hay reservas de salones en este periodo." />
          ) : (
            <ResponsiveBar
              data={salonBarData}
              keys={['Reservas']}
              indexBy="salon"
              layout="horizontal"
              margin={{ top: 12, right: 36, bottom: 42, left: 118 }}
              padding={0.34}
              colors={[GOLD]}
              borderRadius={4}
              axisBottom={{ tickSize: 0, tickPadding: 10, legend: 'Reservas', legendPosition: 'middle', legendOffset: 34 }}
              axisLeft={{ tickSize: 0, tickPadding: 10 }}
              enableGridY={false}
              enableLabel
              labelTextColor="#3f3108"
              theme={chartTheme}
            />
          )}
        </ChartCard>

        <section className="rounded-[1.75rem] border border-stone-300 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8841C]">Tesorería</p>
              <h2 className="font-serif text-2xl font-black text-stone-950">Seguimiento financiero</h2>
              <p className="mt-1 text-sm font-medium text-stone-600">
                Eventos con saldo pendiente y total recaudado frente al total cotizado.
              </p>
            </div>
            <div className="rounded-2xl bg-[#fbf8f2] px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Cotizado</p>
              <p className="font-serif text-xl font-black text-stone-950">{formatCurrency(totalCotizado)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <MiniStat label="Pagado" value={formatCurrency(totalPagado)} tone="green" />
            <MiniStat label="Pendiente" value={formatCurrency(saldoPendienteTotal)} tone="gold" />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#f4ead8] text-[11px] uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {eventosConSaldo.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center font-semibold text-stone-500" colSpan={4}>
                      No hay eventos con saldo pendiente en este rango.
                    </td>
                  </tr>
                ) : (
                  eventosConSaldo.map((item) => (
                    <tr key={item.eventoId}>
                      <td className="px-4 py-3 font-black text-stone-950">{formatShortId(item.eventoId, 'EV-')}</td>
                      <td className="px-4 py-3 font-semibold text-stone-700">{item.cliente}</td>
                      <td className="px-4 py-3 text-stone-500">{formatDate(item.fechaHoraInicio)}</td>
                      <td className="px-4 py-3 font-black text-[#A8841C]">{formatCurrency(Number(item.saldoPendiente))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <ChartCard
          kicker="Anticipos"
          title="Recaudo por método"
          description="Distribución del dinero recibido por forma de pago."
          compact
        >
          {anticiposPieData.length === 0 ? (
            <EmptyState message="No hay anticipos registrados en el periodo." />
          ) : (
            <ResponsivePie
              data={anticiposPieData}
              margin={{ top: 16, right: 16, bottom: 30, left: 16 }}
              innerRadius={0.58}
              padAngle={1}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={[GOLD, GREEN, BLUE, RED, STONE]}
              borderWidth={2}
              borderColor="#ffffff"
              enableArcLinkLabels={false}
              arcLabel={(datum) => formatCurrency(Number(datum.value))}
              arcLabelsSkipAngle={18}
              arcLabelsTextColor="#ffffff"
              theme={chartTheme}
            />
          )}
        </ChartCard>

        <section className="rounded-[1.75rem] border border-stone-300 bg-[#fbf8f2] p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8841C]">Detalle</p>
            <h2 className="font-serif text-2xl font-black text-stone-950">Últimos anticipos del periodo</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f4ead8] text-[11px] uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(anticipos?.anticipos ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center font-semibold text-stone-500" colSpan={5}>
                      No hay anticipos registrados en este rango.
                    </td>
                  </tr>
                ) : (
                  anticipos?.anticipos.slice(0, 7).map((anticipo) => (
                    <tr key={anticipo.anticipoId}>
                      <td className="px-4 py-3 text-stone-500">{formatDate(anticipo.fechaPago)}</td>
                      <td className="px-4 py-3 font-semibold text-stone-700">{anticipo.cliente}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                          {anticipo.metodoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-green-700">{formatCurrency(Number(anticipo.valor))}</td>
                      <td className="px-4 py-3 font-black text-stone-950">{formatShortId(anticipo.eventoId, 'EV-')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
};

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
      {label}
      <input
        className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-stone-900"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = 'gold',
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone?: 'gold' | 'green' | 'red';
}) {
  const toneClass = {
    gold: 'bg-[#A8841C]/10 text-[#A8841C]',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-stone-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
          <p className="mt-3 font-serif text-2xl font-black text-stone-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-stone-500">{helper}</p>
        </div>
        <div className={`grid size-11 place-items-center rounded-2xl ${toneClass}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'green' | 'gold' }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fbf8f2] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl font-black ${tone === 'green' ? 'text-green-700' : 'text-[#A8841C]'}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  kicker,
  title,
  description,
  children,
  compact = false,
}: {
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-300 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8841C]">{kicker}</p>
        <h2 className="font-serif text-2xl font-black text-stone-950">{title}</h2>
        <p className="mt-1 text-sm font-medium text-stone-600">{description}</p>
      </div>
      <div className={compact ? 'h-[310px]' : 'h-[390px]'}>{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-2xl border border-dashed border-stone-300 bg-[#fbf8f2] px-5 py-8 text-center text-sm font-semibold text-stone-500">
      {message}
    </div>
  );
}

export default ReportsPage;
