import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import cotizacionesApi from '@/api/cotizaciones';
import eventosApi from '@/api/eventos';
import menusApi from '@/api/menus';
import salonesApi from '@/api/salones';
import { useToast } from '@/components/ui/ToastProvider';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import { estadoEventoToEventStatus } from '@/features/events/utils/eventStatus';
import type {
  CatalogoBasicoResponse,
  ClienteResponse,
  EstadoCotizacion,
  EventoResponse,
  PlatoMomentoResponse,
  PlatoResponse,
  SalonResponse,
  TipoMomentoMenuResponse,
} from '@/api/types';
import { formatShortId } from '@/utils/formatters';

interface ItemLocal {
  localId: string;
  platoId: string;
  platoNombre: string;
  precioBase: number;
  cantidad: number;
  excepciones: string;
}

interface SeleccionLocal {
  tipoMomentoId: string;
  items: ItemLocal[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const fieldClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15';

const EventMenuPage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [platos, setPlatos] = useState<PlatoResponse[]>([]);
  const [momentos, setMomentos] = useState<TipoMomentoMenuResponse[]>([]);
  const [platoMomentos, setPlatoMomentos] = useState<PlatoMomentoResponse[]>([]);
  const [selecciones, setSelecciones] = useState<SeleccionLocal[]>([]);
  const [notasGenerales, setNotasGenerales] = useState('');
  const [quoteState, setQuoteState] = useState<EstadoCotizacion | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addMomentoId, setAddMomentoId] = useState('');
  const [addPlatoId, setAddPlatoId] = useState('');
  const [addCantidad, setAddCantidad] = useState(1);
  const [addExcepciones, setAddExcepciones] = useState('');

  const guests = evento?.reservas.find((reserva) => reserva.vigente)?.numInvitados ?? 0;
  const isCancelled = evento?.estado === 'CANCELADO';

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const eventoData = await eventosApi.obtenerPorId(eventId);
        if (cancelled) return;

        setEvento(eventoData);

        const [platosApiData, momentosApiData, platoMomentosApiData] = await Promise.all([
          catalogosApi.platos.listar(),
          catalogosApi.tiposMomentoMenu.listar(),
          catalogosApi.platoMomentos.obtener(),
        ]);

        const platosActivos = platosApiData.filter((plato) => plato.activo);
        const momentosActivos = momentosApiData.filter((momento) => momento.activo);

        if (cancelled) return;

        setPlatos(platosActivos);
        setMomentos(momentosActivos);
        setPlatoMomentos(platoMomentosApiData);

        if (momentosActivos.length > 0) {
          const primerMomentoId = momentosActivos[0]!.id;
          const primerPlatoAsociado = platoMomentosApiData.find(
            (relacion) => relacion.tipoMomentoId === primerMomentoId,
          );
          setAddMomentoId(primerMomentoId);
          setAddPlatoId(primerPlatoAsociado?.platoId ?? '');
        }

        const reserva = eventoData.reservas.find((item) => item.vigente);
        if (!reserva) {
          setError('No hay reserva activa para este evento');
          setLoading(false);
          return;
        }

        const reservaId = reserva.reservaRaizId || reserva.id;

        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.obtenerPorId(reserva.salonId),
        ]);

        if (cancelled) return;

        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);

        try {
          const menuExistente = await menusApi.obtener(reservaId);
          if (!cancelled) {
            setNotasGenerales(menuExistente.notasGenerales ?? '');
            setSelecciones(
              menuExistente.selecciones.map((seleccion) => ({
                tipoMomentoId: seleccion.tipoMomentoId,
                items: seleccion.items.map((item) => {
                  const plato = platosActivos.find((candidate) => candidate.id === item.platoId);
                  return {
                    localId: uid(),
                    platoId: item.platoId,
                    platoNombre: plato?.nombre ?? formatShortId(item.platoId, 'PLA-'),
                    precioBase: plato?.precioBase ?? 0,
                    cantidad: item.cantidad,
                    excepciones: item.excepciones ?? '',
                  };
                }),
              })),
            );
          }
        } catch {
          if (!cancelled) setSelecciones([]);
        }

        try {
          const cotizacionVigente = await cotizacionesApi.obtenerVigente(reservaId);
          if (!cancelled) setQuoteState(cotizacionVigente.estado);
        } catch {
          if (!cancelled) setQuoteState(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const totalMenu = useMemo(
    () =>
      selecciones
        .flatMap((seleccion) => seleccion.items)
        .reduce((acc, item) => acc + item.precioBase * item.cantidad, 0),
    [selecciones],
  );

  const totalItems = useMemo(
    () => selecciones.flatMap((seleccion) => seleccion.items).length,
    [selecciones],
  );

  const costoPorInvitado = guests > 0 ? Math.round(totalMenu / guests) : 0;

  const platosDisponiblesParaMomento = useMemo(() => {
    if (!addMomentoId) return [];

    const platoIdsPermitidos = new Set(
      platoMomentos
        .filter((relacion) => relacion.tipoMomentoId === addMomentoId)
        .map((relacion) => relacion.platoId),
    );

    return platos.filter((plato) => platoIdsPermitidos.has(plato.id));
  }, [addMomentoId, platoMomentos, platos]);

  const selectedPlato = useMemo(
    () => platosDisponiblesParaMomento.find((plato) => plato.id === addPlatoId) ?? null,
    [addPlatoId, platosDisponiblesParaMomento],
  );

  useEffect(() => {
    if (!addMomentoId) {
      setAddPlatoId('');
      return;
    }

    if (!platosDisponiblesParaMomento.some((plato) => plato.id === addPlatoId)) {
      setAddPlatoId(platosDisponiblesParaMomento[0]?.id ?? '');
    }
  }, [addMomentoId, addPlatoId, platosDisponiblesParaMomento]);

  const agregarItem = () => {
    if (isCancelled) return;
    if (!addMomentoId || !addPlatoId) return;

    const plato = platosDisponiblesParaMomento.find((candidate) => candidate.id === addPlatoId);
    if (!plato) return;

    const nuevoItem: ItemLocal = {
      localId: uid(),
      platoId: plato.id,
      platoNombre: plato.nombre,
      precioBase: Number(plato.precioBase),
      cantidad: Math.max(1, addCantidad),
      excepciones: addExcepciones.trim(),
    };

    setSelecciones((prev) => {
      const current = prev.find((seleccion) => seleccion.tipoMomentoId === addMomentoId);
      if (!current) {
        return [...prev, { tipoMomentoId: addMomentoId, items: [nuevoItem] }];
      }

      return prev.map((seleccion) =>
        seleccion.tipoMomentoId === addMomentoId
          ? { ...seleccion, items: [...seleccion.items, nuevoItem] }
          : seleccion,
      );
    });

    setAddCantidad(guests || 1);
    setAddExcepciones('');
    setError(null);
  };

  const quitarItem = (momentoId: string, localId: string) => {
    if (isCancelled) return;
    setSelecciones((prev) =>
      prev
        .map((seleccion) =>
          seleccion.tipoMomentoId === momentoId
            ? { ...seleccion, items: seleccion.items.filter((item) => item.localId !== localId) }
            : seleccion,
        )
        .filter((seleccion) => seleccion.items.length > 0),
    );
  };

  const actualizarCantidad = (momentoId: string, localId: string, cantidad: number) => {
    if (isCancelled) return;
    setSelecciones((prev) =>
      prev.map((seleccion) =>
        seleccion.tipoMomentoId === momentoId
          ? {
              ...seleccion,
              items: seleccion.items.map((item) =>
                item.localId === localId ? { ...item, cantidad: Math.max(1, cantidad) } : item,
              ),
            }
          : seleccion,
      ),
    );
  };

  const actualizarExcepciones = (momentoId: string, localId: string, excepciones: string) => {
    if (isCancelled) return;
    setSelecciones((prev) =>
      prev.map((seleccion) =>
        seleccion.tipoMomentoId === momentoId
          ? {
              ...seleccion,
              items: seleccion.items.map((item) =>
                item.localId === localId ? { ...item, excepciones } : item,
              ),
            }
          : seleccion,
      ),
    );
  };

  const handleGuardarMenu = async () => {
    if (!evento) return;
    if (isCancelled) {
      setError('No se puede modificar el menu de un evento cancelado.');
      return;
    }

    const reserva = evento.reservas.find((item) => item.vigente);
    if (!reserva) {
      setError('No hay reserva activa');
      return;
    }

    if (selecciones.length === 0) {
      setError('Agrega al menos un plato antes de guardar');
      return;
    }

    if (quoteState && quoteState !== 'BORRADOR') {
      const continuar = window.confirm(
        `Este evento ya tiene una cotizacion en estado ${quoteState}. Si guardas cambios en Menu, esa cotizacion dejara de estar vigente y tendras que generar una nueva.`,
      );

      if (!continuar) return;
    }

    try {
      setSaving(true);
      setError(null);

      await menusApi.configurar(reserva.reservaRaizId || reserva.id, {
        notasGenerales: notasGenerales.trim() || undefined,
        selecciones: selecciones.map((seleccion) => ({
          tipoMomentoId: seleccion.tipoMomentoId,
          items: seleccion.items.map((item) => ({
            platoId: item.platoId,
            cantidad: item.cantidad,
            excepciones: item.excepciones || undefined,
          })),
        })),
      });

      setQuoteState(null);
      toast.success('Menu guardado', 'La seleccion gastronomica quedo asociada a la reserva vigente.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar menu';
      setError(message);
      toast.error('No fue posible guardar el menu', message);
    } finally {
      setSaving(false);
    }
  };

  const event = useMemo(() => {
    if (!evento) {
      return {
        id: eventId ?? '',
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
      title: `${tipoEvento?.nombre ?? 'Evento'} - ${cliente?.nombreCompleto ?? 'Cliente'}`,
      dateLabel: inicio.toLocaleDateString('es-CO'),
      timeLabel: inicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      status: estadoEventoToEventStatus(evento.estado),
      customerName: cliente?.nombreCompleto ?? 'Cargando...',
      customerPhone: cliente?.telefono ?? '',
      eventType: tipoEvento?.nombre ?? 'Cargando...',
      guests: reserva?.numInvitados ?? 0,
      venue: salon?.nombre ?? 'Sin salon',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: '$0',
    };
  }, [cliente, eventId, evento, salon, tipoEvento]);

  const momentoNombre = (id: string) =>
    momentos.find((momento) => momento.id === id)?.nombre ?? formatShortId(id, 'MOM-');

  if (loading) {
    return (
      <section className="space-y-8 pb-32">
        <div className="rounded-2xl border border-stone-300 bg-[#fbf8f2] px-6 py-14 text-center text-sm font-semibold text-stone-600 shadow-sm">
          Cargando menu del evento...
        </div>
      </section>
    );
  }

  if (error && !evento) {
    return (
      <section className="space-y-8 pb-32">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-7 pb-32">
      <EventDetailHeaderTabs event={event} activeTab="menu" onEventCancelled={setEvento} />

      {isCancelled && (
        <EventCancelledNotice detail="El menu queda disponible solo para consulta historica. No se pueden agregar, quitar o guardar platos en un evento cancelado." />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className={`space-y-6 ${isCancelled ? 'opacity-75' : ''}`}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-stone-300 bg-[#fbf8f2] shadow-xl shadow-stone-900/5">
            <div className="border-b border-stone-200 bg-[#fbf8f2] px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">
                    Ficha gastronomica
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-black text-stone-950">Menu del evento</h3>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-600">
                    Arma el menu por momentos. Primero elige el momento, despues el plato, y finalmente ajusta cantidad
                    y excepciones.
                  </p>
                </div>
                <span className="rounded-full border border-[#A8841C]/20 bg-white px-3 py-1 text-xs font-black text-[#A8841C]">
                  {quoteState && quoteState !== 'BORRADOR' ? `Cotizacion ${quoteState.toLowerCase()}` : 'En edicion'}
                </span>
              </div>
            </div>
          </section>

          {quoteState && quoteState !== 'BORRADOR' && (
            <div className="rounded-2xl border border-[#A8841C]/25 bg-[#f6efd5] px-5 py-4 text-sm font-medium text-stone-800">
              Este menu ya respalda una cotizacion en estado <strong>{quoteState}</strong>. Si guardas cambios, esa
              cotizacion dejara de estar vigente y tendras que generar una nueva.
            </div>
          )}

          <section className="rounded-2xl border border-stone-300 bg-[#fbf8f2] p-6 shadow-xl shadow-stone-900/5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">Constructor</p>
                <h4 className="mt-1 font-serif text-xl font-black text-stone-950">Agregar plato</h4>
                <p className="mt-1 text-sm font-medium text-stone-600">
                  Usa este bloque como si fuera un carrito: selecciona y agrega al menu.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                <span className="font-black text-[#A8841C]">{guests}</span>
                <span className="ml-1 font-semibold text-stone-600">invitados</span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">1. Momento</p>
                <div className="grid gap-2">
                  {momentos.map((momento) => {
                    const selected = addMomentoId === momento.id;
                    const itemCount =
                      selecciones.find((seleccion) => seleccion.tipoMomentoId === momento.id)?.items.length ?? 0;

                    return (
                      <button
                        key={momento.id}
                        type="button"
                        onClick={() => setAddMomentoId(momento.id)}
                        disabled={isCancelled}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-[#A8841C] bg-[#f6efd5] ring-4 ring-[#A8841C]/10'
                            : 'border-stone-300 bg-white hover:border-[#A8841C]'
                        }`}
                      >
                        <span className="block text-sm font-black text-stone-950">{momento.nombre}</span>
                        <span className="mt-1 block text-xs font-semibold text-stone-500">
                          {itemCount} plato(s) agregado(s)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">2. Plato</p>
                  {platosDisponiblesParaMomento.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-[#A8841C]/25 bg-[#f6efd5] px-5 py-4 text-sm font-medium text-stone-700">
                      No hay platos asociados a este momento. Revisa el catalogo de plato-momento.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {platosDisponiblesParaMomento.map((plato) => {
                        const selected = addPlatoId === plato.id;
                        return (
                          <button
                            key={plato.id}
                            type="button"
                            onClick={() => setAddPlatoId(plato.id)}
                            disabled={isCancelled}
                            className={`rounded-2xl border p-4 text-left transition ${
                              selected
                                ? 'border-[#A8841C] bg-white ring-4 ring-[#A8841C]/10'
                                : 'border-stone-300 bg-white hover:border-[#A8841C]'
                            }`}
                          >
                            <span className="block font-serif text-lg font-black text-stone-950">{plato.nombre}</span>
                            <span className="mt-2 block text-sm font-semibold text-[#A8841C]">
                              {formatCurrency(Number(plato.precioBase))}
                            </span>
                            {plato.descripcion ? (
                              <span className="mt-2 line-clamp-2 block text-xs font-medium text-stone-500">
                                {plato.descripcion}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-300 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">3. Cantidad y notas</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)_160px]">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-stone-600">Cantidad</label>
                      <input
                        className={fieldClass}
                        type="number"
                        min={1}
                        value={addCantidad}
                        onChange={(eventTarget) => setAddCantidad(Number(eventTarget.target.value) || 1)}
                        disabled={isCancelled}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-stone-600">Excepciones</label>
                      <input
                        className={fieldClass}
                        type="text"
                        value={addExcepciones}
                        placeholder="Ej: sin cebolla, vegetariano, sin gluten"
                        onChange={(eventTarget) => setAddExcepciones(eventTarget.target.value)}
                        disabled={isCancelled}
                      />
                    </div>
                    <button
                      className="self-end rounded-xl bg-[#A8841C] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#8f7118] disabled:opacity-50"
                      type="button"
                      onClick={agregarItem}
                      disabled={isCancelled || !addMomentoId || !addPlatoId || platosDisponiblesParaMomento.length === 0}
                    >
                      Agregar
                    </button>
                  </div>
                  {selectedPlato ? (
                    <p className="mt-3 text-xs font-semibold text-stone-500">
                      Subtotal del item: {formatCurrency(Number(selectedPlato.precioBase) * Math.max(1, addCantidad))}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-stone-300 bg-[#fbf8f2] shadow-xl shadow-stone-900/5">
            <div className="border-b border-stone-200 px-6 py-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">Seleccion actual</p>
              <h4 className="mt-1 font-serif text-xl font-black text-stone-950">Menu armado</h4>
              <p className="mt-1 text-sm font-medium text-stone-600">
                {totalItems === 0
                  ? 'Aun no hay platos agregados.'
                  : `${totalItems} plato(s) distribuidos en ${selecciones.length} momento(s).`}
              </p>
            </div>

            {totalItems === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#A8841C]/10 text-[#A8841C]">
                  <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
                </div>
                <p className="mt-4 font-serif text-xl font-black text-stone-950">Sin platos todavia</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-stone-500">
                  Selecciona un momento y un plato para empezar a construir el menu del evento.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                {selecciones.map((seleccion) => (
                  <div key={seleccion.tipoMomentoId} className="rounded-2xl border border-stone-300 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h5 className="font-serif text-lg font-black text-stone-950">
                        {momentoNombre(seleccion.tipoMomentoId)}
                      </h5>
                      <span className="rounded-full bg-[#f6efd5] px-3 py-1 text-xs font-black text-[#A8841C]">
                        {seleccion.items.length} item(s)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {seleccion.items.map((item) => (
                        <div key={item.localId} className="rounded-xl border border-stone-200 bg-[#fbf8f2] p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="font-black text-stone-950">{item.platoNombre}</p>
                              <p className="mt-1 text-sm font-semibold text-[#A8841C]">
                                {formatCurrency(item.precioBase)} base
                              </p>
                            </div>
                            <button
                              className="self-start text-sm font-black text-red-700 hover:text-red-800"
                              type="button"
                              onClick={() => quitarItem(seleccion.tipoMomentoId, item.localId)}
                              disabled={isCancelled}
                            >
                              Quitar
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_160px]">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-stone-600">Cantidad</label>
                              <input
                                className={fieldClass}
                                type="number"
                                min={1}
                                value={item.cantidad}
                                onChange={(eventTarget) =>
                                  actualizarCantidad(
                                    seleccion.tipoMomentoId,
                                    item.localId,
                                    Number(eventTarget.target.value),
                                  )
                                }
                                disabled={isCancelled}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-stone-600">Excepciones</label>
                              <input
                                className={fieldClass}
                                type="text"
                                value={item.excepciones}
                                placeholder="Sin observaciones"
                                onChange={(eventTarget) =>
                                  actualizarExcepciones(
                                    seleccion.tipoMomentoId,
                                    item.localId,
                                    eventTarget.target.value,
                                  )
                                }
                                disabled={isCancelled}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-stone-600">Subtotal</label>
                              <div className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-right text-sm font-black text-stone-900">
                                {formatCurrency(item.precioBase * item.cantidad)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-300 bg-[#fbf8f2] p-6 shadow-xl shadow-stone-900/5">
            <h4 className="font-serif text-xl font-black text-stone-950">Notas generales</h4>
            <p className="mt-1 text-sm font-medium text-stone-600">
              Usa este espacio para alergias generales, restricciones del cliente o indicaciones de cocina.
            </p>
            <textarea
              className="mt-4 min-h-[130px] w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#A8841C] focus:ring-2 focus:ring-[#A8841C]/15"
              value={notasGenerales}
              placeholder="Ej: menu infantil, personas vegetarianas, alergias"
              onChange={(eventTarget) => setNotasGenerales(eventTarget.target.value)}
              disabled={isCancelled}
            />
          </section>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-[92px] xl:self-start">
          <div className="space-y-4 rounded-2xl border border-stone-300 bg-[#fbf8f2] p-5 shadow-xl shadow-stone-900/5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8841C]">Resumen</p>
            <h4 className="font-serif text-xl font-black text-stone-950">Menu cotizable</h4>
            <div className="space-y-2 text-sm">
              <SummaryLine label="Invitados" value={`${guests} pax`} />
              <SummaryLine label="Platos definidos" value={`${totalItems}`} />
              <SummaryLine label="Momentos usados" value={`${selecciones.length}`} />
              <SummaryLine label="Estimado por invitado" value={formatCurrency(costoPorInvitado)} />
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-3">
                <span className="text-xs font-black uppercase tracking-wider text-stone-500">Total menu</span>
                <span className="font-serif text-lg font-black text-[#A8841C]">{formatCurrency(totalMenu)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 right-0 z-[60] flex w-full items-center justify-between border-t border-stone-300 bg-white/90 px-6 py-4 shadow-2xl shadow-stone-900/10 backdrop-blur-md md:w-[calc(100%-16rem)]">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="material-symbols-outlined text-lg text-stone-400">info</span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Menu y cantidades se editan aqui, no dentro de la cotizacion
          </p>
        </div>
        <button
          className="w-full rounded-xl bg-[#A8841C] px-8 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#8f7118] disabled:opacity-50 sm:w-auto"
          type="button"
          onClick={handleGuardarMenu}
          disabled={isCancelled || saving || totalItems === 0}
        >
          {isCancelled ? 'Evento cancelado' : saving ? 'Guardando...' : 'Guardar menu'}
        </button>
      </footer>
    </section>
  );
};

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-medium text-stone-600">{label}</span>
      <span className="font-black text-stone-900">{value}</span>
    </div>
  );
}

export default EventMenuPage;
