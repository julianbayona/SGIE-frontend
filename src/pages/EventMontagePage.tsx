import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import eventosApi from '@/api/eventos';
import montajesApi from '@/api/montajes';
import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import { useToast } from '@/components/ui/ToastProvider';
import { estadoEventoToEventStatus } from '@/features/events/utils/eventStatus';
import cotizacionesApi from '@/api/cotizaciones';
import type {
  EventoResponse,
  CatalogoBasicoResponse,
  ColorResponse,
  MantelResponse,
  SobremantelResponse,
  EstadoCotizacion,
  ClienteResponse,
  SalonResponse,
} from '@/api/types';

interface InfrastructureItem {
  id: string;
  name: string;
  selected: boolean;
}

interface AdditionalItem {
  id: string;
  tipoAdicionalId: string;
  name: string;
  billingType: 'SERVICIO' | 'UNIDAD';
  selected: boolean;
  quantity: number;
  basePrice: number;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const getTextilColorId = (textil: MantelResponse | SobremantelResponse | undefined): string | null => {
  if (!textil) return null;
  return textil.colorId ?? textil.idColor ?? textil.color?.id ?? null;
};

const EventMontagePage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [tiposMesa, setTiposMesa] = useState<CatalogoBasicoResponse[]>([]);
  const [tiposSilla, setTiposSilla] = useState<CatalogoBasicoResponse[]>([]);
  const [manteles, setManteles] = useState<MantelResponse[]>([]);
  const [sobremanteles, setSobremanteles] = useState<SobremantelResponse[]>([]);
  const [colores, setColores] = useState<ColorResponse[]>([]);
  const [quoteState, setQuoteState] = useState<EstadoCotizacion | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableType, setTableType] = useState('');
  const [chairType, setChairType] = useState('');
  const [peoplePerTable, setPeoplePerTable] = useState(10);
  const [tableCount, setTableCount] = useState(12);
  const [clothType, setClothType] = useState('');
  const [topClothType, setTopClothType] = useState('');
  const [dinnerware, setDinnerware] = useState(false);
  const [fajonEnabled, setFajonEnabled] = useState(true);

  const [infrastructure, setInfrastructure] = useState<InfrastructureItem[]>([
    { id: 'mesa_ponque', name: 'Mesa ponque', selected: false },
    { id: 'mesa_regalos', name: 'Mesa regalos', selected: false },
    { id: 'espacio_musicos', name: 'Espacio músicos', selected: false },
    { id: 'espacio_bombas', name: 'Espacio bombas', selected: false },
  ]);

  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const isCancelled = evento?.estado === 'CANCELADO';

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [eventoData, mesasData, sillasData, mantelesData, sobremantelesData, coloresData, adicionalesData] =
          await Promise.all([
            eventosApi.obtenerPorId(eventId),
            catalogosApi.tiposMesa.listar(),
            catalogosApi.tiposSilla.listar(),
            catalogosApi.manteles.listar(),
            catalogosApi.sobremanteles.listar(),
            catalogosApi.colores.listar(),
            catalogosApi.tiposAdicional.listar(),
          ]);

        if (cancelled) return;

        const reservaActual = eventoData.reservas.find((reserva) => reserva.vigente);
        if (!reservaActual) {
          setError('No hay reserva activa para este evento');
          setLoading(false);
          return;
        }

        const mesasActivas = mesasData.filter((item) => item.activo);
        const sillasActivas = sillasData.filter((item) => item.activo);
        const mantelesActivos = mantelesData.filter((item) => item.activo);
        const sobremantelesActivos = sobremantelesData.filter((item) => item.activo);
        const coloresActivos = coloresData.filter((item) => item.activo);
        const adicionalesActivos = adicionalesData.filter((item) => item.activo);

        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.obtenerPorId(reservaActual.salonId),
        ]);

        if (cancelled) return;

        setEvento(eventoData);
        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);
        setTiposMesa(mesasActivas);
        setTiposSilla(sillasActivas);
        setManteles(mantelesActivos);
        setSobremanteles(sobremantelesActivos);
        setColores(coloresActivos);

        if (mesasActivas.length > 0) setTableType(mesasActivas[0]!.id);
        if (sillasActivas.length > 0) setChairType(sillasActivas[0]!.id);
        if (mantelesActivos.length > 0) setClothType(mantelesActivos[0]!.id);
        if (sobremantelesActivos.length > 0) setTopClothType(sobremantelesActivos[0]!.id);

        setAdditionalItems(
          adicionalesActivos.map((item) => ({
            id: `adicional-${item.id}`,
            tipoAdicionalId: item.id,
            name: item.nombre,
            billingType: item.modoCobro,
            selected: false,
            quantity: 1,
            basePrice: Number(item.precioBase),
          }))
        );

        const reservaId = reservaActual.reservaRaizId || reservaActual.id;

        try {
          const montaje = await montajesApi.obtener(reservaId);
          if (!cancelled && montaje.mesas.length > 0) {
            const mesa = montaje.mesas[0]!;
            setTableType(mesa.tipoMesaId);
            setChairType(mesa.tipoSillaId);
            setPeoplePerTable(mesa.sillaPorMesa);
            setTableCount(mesa.cantidadMesas);
            if (mesa.mantelId) setClothType(mesa.mantelId);
            if (mesa.sobremantelId) setTopClothType(mesa.sobremantelId);
            setDinnerware(mesa.vajilla);
            setFajonEnabled(mesa.fajon);

            setInfrastructure([
              { id: 'mesa_ponque', name: 'Mesa ponque', selected: montaje.infraestructura.mesaPonque },
              { id: 'mesa_regalos', name: 'Mesa regalos', selected: montaje.infraestructura.mesaRegalos },
              { id: 'espacio_musicos', name: 'Espacio músicos', selected: montaje.infraestructura.espacioMusicos },
              { id: 'espacio_bombas', name: 'Espacio bombas', selected: montaje.infraestructura.estanteBombas },
            ]);

            setAdditionalItems((prev) =>
              prev.map((item) => {
                const adicionalExistente = montaje.adicionales.find(
                  (adicional) => adicional.tipoAdicionalId === item.tipoAdicionalId
                );

                if (!adicionalExistente) return item;

                return {
                  ...item,
                  selected: true,
                  quantity: adicionalExistente.cantidad,
                };
              })
            );
          }
        } catch {
          // Sin montaje guardado todavía
        }

        try {
          const cotizacionVigente = await cotizacionesApi.obtenerVigente(reservaId);
          if (!cancelled) {
            setQuoteState(cotizacionVigente.estado);
          }
        } catch {
          if (!cancelled) {
            setQuoteState(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const updateInfrastructureSelection = (itemId: string, checked: boolean) => {
    if (isCancelled) return;
    setInfrastructure((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selected: checked } : item))
    );
  };

  const updateAdditionalSelection = (itemId: string, checked: boolean) => {
    if (isCancelled) return;
    setAdditionalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selected: checked } : item))
    );
  };

  const updateAdditionalQuantity = (itemId: string, quantity: number) => {
    if (isCancelled) return;
    setAdditionalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || item.billingType !== 'UNIDAD') {
          return item;
        }

        return { ...item, quantity: Math.max(1, quantity || 1) };
      })
    );
  };

  const handleGuardarMontaje = async () => {
    if (!evento) {
      setError('No hay evento cargado');
      return;
    }

    if (isCancelled) {
      setError('No se puede modificar el montaje de un evento cancelado.');
      return;
    }

    const reserva = evento.reservas.find((item) => item.vigente);
    if (!reserva) {
      setError('No hay reserva activa para este evento');
      return;
    }

    if (!clothType) {
      setError('Debes seleccionar un mantel');
      return;
    }

    if (!tableType) {
      setError('Debes seleccionar un tipo de mesa');
      return;
    }

    if (!chairType) {
      setError('Debes seleccionar un tipo de silla');
      return;
    }

    if (quoteState && quoteState !== 'BORRADOR') {
      const continuar = window.confirm(
        `Este evento ya tiene una cotización en estado ${quoteState}. Si guardas cambios en Montaje, esa cotización dejará de estar vigente y tendrás que generar una nueva.`
      );

      if (!continuar) {
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      await montajesApi.configurar(reserva.reservaRaizId || reserva.id, {
        observaciones: undefined,
        mesas: [
          {
            tipoMesaId: tableType,
            tipoSillaId: chairType,
            sillaPorMesa: peoplePerTable,
            cantidadMesas: tableCount,
            mantelId: clothType,
            sobremantelId: topClothType || undefined,
            vajilla: dinnerware,
            fajon: fajonEnabled,
          },
        ],
        infraestructura: {
          mesaPonque: infrastructure.find((item) => item.id === 'mesa_ponque')?.selected || false,
          mesaRegalos: infrastructure.find((item) => item.id === 'mesa_regalos')?.selected || false,
          espacioMusicos: infrastructure.find((item) => item.id === 'espacio_musicos')?.selected || false,
          estanteBombas: infrastructure.find((item) => item.id === 'espacio_bombas')?.selected || false,
        },
        adicionales: selectedAdditionalItems.map((item) => ({
          tipoAdicionalId: item.tipoAdicionalId,
          cantidad: item.quantity,
        })),
      });

      setQuoteState(null);
      toast.success('Montaje guardado', 'La configuracion de mesas, textiles y adicionales quedo actualizada.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar montaje';
      setError(message);
      toast.error('No fue posible guardar el montaje', message);
    } finally {
      setSaving(false);
    }
  };

  const event = useMemo(() => {
    if (!evento) {
      return {
        id: eventId || '',
        title: 'Cargando...',
        dateLabel: '',
        timeLabel: '',
        status: 'Pendiente' as const,
        customerName: '',
        customerPhone: '',
        eventType: '',
        guests: 0,
        venue: '',
        venueCapacity: '',
        totalQuote: '$0',
      };
    }

    const reserva = evento.reservas.find((item) => item.vigente);
    const inicio = new Date(evento.fechaHoraInicio);

    return {
      id: evento.id,
      title: `${tipoEvento?.nombre || 'Evento'} - ${cliente?.nombreCompleto || 'Cliente'}`,
      dateLabel: inicio.toLocaleDateString('es-CO'),
      timeLabel: inicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      status: estadoEventoToEventStatus(evento.estado),
      customerName: cliente?.nombreCompleto || 'Cargando...',
      customerPhone: cliente?.telefono || '',
      eventType: tipoEvento?.nombre || 'Cargando...',
      guests: reserva?.numInvitados || 0,
      venue: salon?.nombre || 'Sin salón',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: '$0',
    };
  }, [cliente, eventId, evento, salon, tipoEvento]);

  const selectedMantel = useMemo(
    () => manteles.find((item) => item.id === clothType),
    [clothType, manteles]
  );

  const selectedSobremantel = useMemo(
    () => sobremanteles.find((item) => item.id === topClothType),
    [sobremanteles, topClothType]
  );

  const selectedClothColor = useMemo(() => {
    const colorId = getTextilColorId(selectedMantel);
    return colorId ? colores.find((color) => color.id === colorId) ?? selectedMantel?.color ?? null : selectedMantel?.color ?? null;
  }, [colores, selectedMantel]);

  const selectedTopClothColor = useMemo(() => {
    const colorId = getTextilColorId(selectedSobremantel);
    return colorId
      ? colores.find((color) => color.id === colorId) ?? selectedSobremantel?.color ?? null
      : selectedSobremantel?.color ?? null;
  }, [colores, selectedSobremantel]);

  const selectedInfrastructureItems = useMemo(
    () => infrastructure.filter((item) => item.selected),
    [infrastructure]
  );

  const selectedAdditionalItems = useMemo(
    () => additionalItems.filter((item) => item.selected),
    [additionalItems]
  );

  const additionalTotal = useMemo(
    () =>
      selectedAdditionalItems.reduce((sum, item) => {
        const lineTotal = item.billingType === 'UNIDAD' ? item.quantity * item.basePrice : item.basePrice;
        return sum + lineTotal;
      }, 0),
    [selectedAdditionalItems]
  );

  if (loading) {
    return (
      <section className="space-y-10 pb-32">
        <div className="rounded-2xl border border-stone-300 bg-[#fbf8f2] px-6 py-14 text-center text-sm font-semibold text-stone-600 shadow-sm">
          Cargando configuración de montaje...
        </div>
      </section>
    );
  }

  if (error && !evento) {
    return (
      <section className="space-y-10 pb-32">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </section>
    );
  }

  return (
    <section className="space-y-7 pb-32">
      <EventDetailHeaderTabs event={event} activeTab="montaje" onEventCancelled={setEvento} />

      {isCancelled && (
        <EventCancelledNotice detail="El montaje queda disponible solo para consulta historica. No se pueden cambiar mesas, textiles, infraestructura o adicionales." />
      )}

      <div className="gap-6 lg:flex lg:items-start">
        <div className={`mb-24 flex-1 space-y-6 ${isCancelled ? 'opacity-75' : ''}`}>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-[#fbf8f2] shadow-xl shadow-stone-900/5">
            <div className="border-b border-stone-200 bg-gradient-to-br from-white to-[#f4ead8] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">Ficha operativa</p>
                <h3 className="mt-1 font-serif text-2xl font-black text-stone-950">Montaje del evento</h3>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-600">
                  Aquí defines lo solicitado para la reserva: mesas, sillas, textiles, infraestructura y adicionales.
                  La cotización toma estos valores como fuente de verdad.
                </p>
              </div>
              <span className="rounded-full border border-[#A8841C]/20 bg-white px-3 py-1 text-xs font-black text-[#A8841C]">
                {quoteState && quoteState !== 'BORRADOR' ? `Cotización ${quoteState.toLowerCase()}` : 'En edición'}
              </span>
            </div>
            </div>
          </div>

          {quoteState && quoteState !== 'BORRADOR' && (
            <div className="rounded-2xl border border-[#A8841C]/25 bg-[#f6efd5] px-5 py-4 text-sm font-medium text-stone-800">
              Este montaje ya respalda una cotización en estado <strong>{quoteState}</strong>. Si cambias mesas,
              textiles, infraestructura o adicionales y guardas, esa versión se invalidará y tendrás que generar una
              nueva desde Cotización.
            </div>
          )}

          <div className="space-y-8 rounded-2xl border border-stone-300 bg-[#fbf8f2] p-8 shadow-xl shadow-stone-900/5">
            <section className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">Distribución principal</p>
              <h3 className="font-serif text-xl font-black text-stone-950">Configuración de mesas</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Tipo de mesa</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    value={tableType}
                    onChange={(eventTarget) => setTableType(eventTarget.target.value)}
                    disabled={isCancelled || tiposMesa.length === 0}
                  >
                    {tiposMesa.length === 0 && <option value="">Cargando...</option>}
                    {tiposMesa.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Tipo de silla</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    value={chairType}
                    onChange={(eventTarget) => setChairType(eventTarget.target.value)}
                    disabled={isCancelled || tiposSilla.length === 0}
                  >
                    {tiposSilla.length === 0 && <option value="">Cargando...</option>}
                    {tiposSilla.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Personas por mesa</label>
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    type="number"
                    min={1}
                    value={peoplePerTable}
                    onChange={(eventTarget) => setPeoplePerTable(Number(eventTarget.target.value) || 0)}
                    disabled={isCancelled}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Cantidad de mesas</label>
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    type="number"
                    min={1}
                    value={tableCount}
                    onChange={(eventTarget) => setTableCount(Number(eventTarget.target.value) || 0)}
                    disabled={isCancelled}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Vajilla</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    value={dinnerware ? 'true' : 'false'}
                    onChange={(eventTarget) => setDinnerware(eventTarget.target.value === 'true')}
                    disabled={isCancelled}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Fajón</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                    value={fajonEnabled ? 'true' : 'false'}
                    onChange={(eventTarget) => setFajonEnabled(eventTarget.target.value === 'true')}
                    disabled={isCancelled}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-stone-300 bg-white p-4 md:col-span-3">
                  <p className="mb-3 text-sm font-semibold text-on-surface">Textiles de mesa</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-stone-300 bg-[#fbf8f2] p-3">
                      <label className="block text-xs font-bold text-neutral-700">Mantel</label>
                      <select
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                        value={clothType}
                        onChange={(eventTarget) => setClothType(eventTarget.target.value)}
                        disabled={isCancelled || manteles.length === 0}
                      >
                        {manteles.length === 0 && <option value="">Cargando...</option>}
                        {manteles.map((mantel) => (
                          <option key={mantel.id} value={mantel.id}>
                            {mantel.nombre}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm text-on-surface-variant">
                        Color asociado: {selectedClothColor?.nombre || 'Sin seleccionar'}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-stone-300 bg-[#fbf8f2] p-3">
                      <label className="block text-xs font-bold text-neutral-700">Sobremantel</label>
                      <select
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                        value={topClothType}
                        onChange={(eventTarget) => setTopClothType(eventTarget.target.value)}
                        disabled={isCancelled || sobremanteles.length === 0}
                      >
                        {sobremanteles.length === 0 && <option value="">Cargando...</option>}
                        {sobremanteles.map((sobremantel) => (
                          <option key={sobremantel.id} value={sobremantel.id}>
                            {sobremantel.nombre}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm text-on-surface-variant">
                        Color asociado: {selectedTopClothColor?.nombre || 'Sin seleccionar'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-outline-variant/30 pt-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">Apoyo operativo</p>
              <h3 className="font-serif text-xl font-black text-stone-950">Infraestructura</h3>
              <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-[#f4ead8] text-xs uppercase tracking-wider text-stone-600">
                    <tr>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3 text-right">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {infrastructure.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-semibold text-on-surface">{item.name}</td>
                        <td className="px-5 py-3 text-right">
                          <input
                            className="h-4 w-4 rounded border-stone-300 text-[#A8841C]"
                            type="checkbox"
                            checked={item.selected}
                            onChange={(eventTarget) => updateInfrastructureSelection(item.id, eventTarget.target.checked)}
                            disabled={isCancelled}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4 border-t border-outline-variant/30 pt-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">Cotizable</p>
              <h3 className="font-serif text-xl font-black text-stone-950">Adicionales</h3>
              <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-[#f4ead8] text-xs uppercase tracking-wider text-stone-600">
                    <tr>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Cobro</th>
                      <th className="px-5 py-3 text-right">Cantidad</th>
                      <th className="px-5 py-3 text-right">Precio base</th>
                      <th className="px-5 py-3 text-right">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {additionalItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-3 font-semibold text-on-surface">{item.name}</td>
                        <td className="px-5 py-3 text-sm text-on-surface-variant">
                          {item.billingType === 'SERVICIO' ? 'Por servicio' : 'Por unidad'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {item.billingType === 'UNIDAD' ? (
                            <input
                              className="w-20 rounded-xl border border-stone-300 bg-[#fbf8f2] px-2 py-1.5 text-right text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(eventTarget) =>
                                updateAdditionalQuantity(item.id, Number(eventTarget.target.value))
                              }
                              disabled={isCancelled}
                            />
                          ) : (
                            <span className="text-sm text-on-surface-variant">1 servicio</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-on-surface-variant">
                          {currencyFormatter.format(item.basePrice)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <input
                            className="h-4 w-4 rounded border-stone-300 text-[#A8841C]"
                            type="checkbox"
                            checked={item.selected}
                            onChange={(eventTarget) => updateAdditionalSelection(item.id, eventTarget.target.checked)}
                            disabled={isCancelled}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <aside className="mt-2 hidden w-[320px] space-y-6 lg:sticky lg:top-[92px] lg:block">
          <div className="space-y-4 rounded-2xl border border-stone-300 bg-[#fbf8f2] p-5 shadow-xl shadow-stone-900/5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8841C]">Resumen</p>
            <h4 className="font-serif text-xl font-black text-stone-950">Montaje operativo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Mesas</span>
                <span className="font-semibold text-on-surface">{tableCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Personas por mesa</span>
                <span className="font-semibold text-on-surface">{peoplePerTable}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Tipo mesa / silla</span>
                <span className="text-right font-semibold text-on-surface">
                  {tiposMesa.find((item) => item.id === tableType)?.nombre || 'Sin definir'} ·{' '}
                  {tiposSilla.find((item) => item.id === chairType)?.nombre || 'Sin definir'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Mantel</span>
                <span className="text-right font-semibold text-on-surface">
                  {selectedMantel?.nombre || 'Sin definir'} · {selectedClothColor?.nombre || 'Sin color'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Sobremantel</span>
                <span className="text-right font-semibold text-on-surface">
                  {selectedSobremantel?.nombre || 'Sin definir'} · {selectedTopClothColor?.nombre || 'Sin color'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Vajilla</span>
                <span className="font-semibold text-on-surface">{dinnerware ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Fajón</span>
                <span className="font-semibold text-on-surface">{fajonEnabled ? 'Sí' : 'No'}</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Infraestructura</p>
              {selectedInfrastructureItems.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-on-surface">
                  {selectedInfrastructureItems.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-on-surface-variant">Sin elementos seleccionados</p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-stone-300 bg-[#fbf8f2] p-5 shadow-xl shadow-stone-900/5">
            <h4 className="font-serif text-xl font-black text-stone-950">Adicionales seleccionados</h4>
            {selectedAdditionalItems.length > 0 ? (
              <div className="space-y-3">
                {selectedAdditionalItems.map((item) => {
                  const lineTotal = item.billingType === 'UNIDAD' ? item.quantity * item.basePrice : item.basePrice;

                  return (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-on-surface">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.billingType === 'UNIDAD' ? `${item.quantity} unidades` : '1 servicio'}
                        </p>
                      </div>
                      <p className="font-semibold text-on-surface">{currencyFormatter.format(lineTotal)}</p>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total adicionales</span>
                  <span className="font-serif text-lg font-black text-[#A8841C]">
                    {currencyFormatter.format(additionalTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No hay adicionales seleccionados.</p>
            )}
          </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 right-0 z-[60] flex w-full items-center justify-between border-t border-stone-300 bg-white/90 px-6 py-4 shadow-2xl shadow-stone-900/10 backdrop-blur-md md:w-[calc(100%-16rem)]">
        <div className="hidden items-center gap-2 text-on-secondary-container sm:flex">
          <span className="material-symbols-outlined text-lg">info</span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Montaje y adicionales se editan aquí, no dentro de la cotización
          </p>
        </div>
        <div className="flex w-full gap-4 sm:w-auto">
          <button
            className="flex-1 rounded-xl bg-[#A8841C] px-8 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#8f7118] disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleGuardarMontaje}
            disabled={isCancelled || saving || !evento}
          >
            {isCancelled ? 'Evento cancelado' : saving ? 'Guardando...' : 'Guardar montaje'}
          </button>
        </div>
      </footer>
    </section>
  );
};

export default EventMontagePage;
