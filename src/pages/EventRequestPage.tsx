import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';
import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import eventosApi from '@/api/eventos';
import salonesApi from '@/api/salones';
import type { CatalogoBasicoResponse, ClienteResponse, SalonResponse } from '@/api/types';
import ClientFormModal, { type ClientFormValues } from '@/features/clients/components/ClientFormModal';

const labelClass = 'text-[0.68rem] font-black uppercase tracking-[0.22em] text-stone-500';
const inputClass =
  'w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-[#A8841C] focus:ring-4 focus:ring-[#A8841C]/15';
const selectClass = `${inputClass} appearance-none`;

function toLocalDateTime(value: string) {
  return value ? `${value}:00` : '';
}

function formatDateTime(value: string) {
  if (!value) return 'Sin definir';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getDurationLabel(start: string, end: string) {
  if (!start || !end) return 'Define inicio y fin';

  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (minutes <= 0) return 'Horario invalido';

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function EventRequestPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [tiposEvento, setTiposEvento] = useState<CatalogoBasicoResponse[]>([]);
  const [tiposComida, setTiposComida] = useState<CatalogoBasicoResponse[]>([]);
  const [clienteEncontrado, setClienteEncontrado] = useState<ClienteResponse | null>(null);
  const [clienteResultados, setClienteResultados] = useState<ClienteResponse[]>([]);
  const [searchingCliente, setSearchingCliente] = useState(false);
  const [isClienteFormOpen, setIsClienteFormOpen] = useState(false);
  const [fechaHoraInicio, setFechaHoraInicio] = useState('');
  const [fechaHoraFin, setFechaHoraFin] = useState('');
  const [numPersonas, setNumPersonas] = useState('80');
  const [tipoEventoId, setTipoEventoId] = useState('');
  const [tipoComidaId, setTipoComidaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      salonesApi.listar(),
      catalogosApi.tiposEvento.listar(),
      catalogosApi.tiposComida.listar(),
    ])
      .then(([salonesPage, tiposEventoData, tiposComidaData]) => {
        const salonesActivos = salonesPage.filter((salon) => salon.activo);
        const eventosActivos = tiposEventoData.filter((tipo) => tipo.activo);
        const comidasActivas = tiposComidaData.filter((tipo) => tipo.activo);
        setSalones(salonesActivos);
        setTiposEvento(eventosActivos);
        setTiposComida(comidasActivas);
        setTipoEventoId(eventosActivos[0]?.id ?? '');
        setTipoComidaId(comidasActivas[0]?.id ?? '');
        setSelectedVenueId(salonesActivos[0]?.id ?? '');
      })
      .catch(() => setError('No fue posible cargar los catalogos iniciales.'));
  }, []);

  useEffect(() => {
    const query = customerQuery.trim();
    if (query.length < 3) {
      setClienteResultados([]);
      return;
    }

    let active = true;
    setSearchingCliente(true);
    const timeout = window.setTimeout(() => {
      clientesApi
        .listar(query)
        .then((clientes: ClienteResponse[]) => {
          if (!active) return;
          setClienteResultados(clientes);
        })
        .catch(() => {
          if (!active) return;
          setClienteResultados([]);
        })
        .finally(() => {
          if (active) setSearchingCliente(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [customerQuery]);

  const selectedVenue = useMemo(
    () => salones.find((salon) => salon.id === selectedVenueId),
    [salones, selectedVenueId],
  );

  const selectedTipoEvento = useMemo(
    () => tiposEvento.find((tipo) => tipo.id === tipoEventoId),
    [tiposEvento, tipoEventoId],
  );

  const selectedTipoComida = useMemo(
    () => tiposComida.find((tipo) => tipo.id === tipoComidaId),
    [tiposComida, tipoComidaId],
  );

  const hasValidDates = Boolean(
    fechaHoraInicio && fechaHoraFin && new Date(fechaHoraFin) > new Date(fechaHoraInicio),
  );
  const canCreate = Boolean(
    clienteEncontrado && selectedVenueId && tipoEventoId && tipoComidaId && hasValidDates,
  );
  const durationLabel = getDurationLabel(fechaHoraInicio, fechaHoraFin);

  const consultarDisponibilidad = async () => {
    if (!fechaHoraInicio || !fechaHoraFin) {
      setError('Define fecha y hora de inicio y fin para consultar disponibilidad.');
      return;
    }

    try {
      setError(null);
      const disponibles = await salonesApi.consultarDisponibilidad({
        fechaHoraInicio: toLocalDateTime(fechaHoraInicio),
        fechaHoraFin: toLocalDateTime(fechaHoraFin),
        capacidadMinima: Number(numPersonas) || undefined,
      });
      setSalones(disponibles.filter((salon) => salon.activo));
      if (selectedVenueId && !disponibles.some((salon) => salon.id === selectedVenueId)) {
        setSelectedVenueId('');
      }
    } catch {
      setError('No fue posible consultar disponibilidad de salones.');
    }
  };

  const handleCrearEvento = async () => {
    if (!clienteEncontrado || !selectedVenueId || !tipoEventoId || !tipoComidaId) return;
    if (!hasValidDates) {
      setError('La fecha final debe ser posterior a la fecha inicial.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const inicio = toLocalDateTime(fechaHoraInicio);
      const fin = toLocalDateTime(fechaHoraFin);
      const evento = await eventosApi.crear({
        clienteId: clienteEncontrado.id,
        tipoEventoId,
        tipoComidaId,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
      });
      await eventosApi.crearReserva(evento.id, {
        salonId: selectedVenueId,
        numInvitados: Number(numPersonas) || 1,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
      });
      toast.success('Evento creado', 'La solicitud quedo creada con su reserva de salon.');
      navigate(`/events/${evento.id}/menu`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible crear la solicitud de evento.';
      setError(message);
      toast.error('No fue posible crear el evento', message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrarCliente = async (values: ClientFormValues) => {
    try {
      setError(null);
      const nuevoCliente = await clientesApi.registrar({
        cedula: values.idNumber,
        nombreCompleto: values.fullName,
        telefono: values.phone,
        correo: values.email,
        tipoCliente: values.category === 'Socio' ? 'SOCIO' : 'NO_SOCIO',
      });
      setClienteEncontrado(nuevoCliente);
      setCustomerQuery(nuevoCliente.nombreCompleto);
      setClienteResultados([]);
      setIsClienteFormOpen(false);
      toast.success('Cliente registrado', `${nuevoCliente.nombreCompleto} quedo seleccionado para la solicitud.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible registrar el cliente.';
      setError(message);
      toast.error('No fue posible registrar el cliente', message);
    }
  };

  return (
    <div className="min-h-screen text-stone-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-stone-300/80 bg-[linear-gradient(135deg,#fbf8f1_0%,#e4d6c2_52%,#A8841C_100%)] text-stone-950 shadow-2xl shadow-stone-900/10">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-stone-900/15 bg-white/65 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-stone-700 shadow-sm">
                Nueva solicitud de evento
              </span>
              <div className="max-w-3xl space-y-3">
                <h1 className="font-serif text-4xl font-black leading-tight md:text-5xl">
                  Construye la reserva paso a paso.
                </h1>
                <p className="max-w-2xl text-base font-semibold leading-7 text-stone-700">
                  Selecciona el cliente, define el horario real del evento y reserva el salon
                  disponible. El sistema prepara el evento para continuar con menu, montaje y
                  cotizacion.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-stone-900/15 bg-white/60 p-4 shadow-xl shadow-stone-900/10 backdrop-blur">
              {[
                ['01', 'Cliente', clienteEncontrado ? 'Seleccionado' : 'Pendiente'],
                ['02', 'Evento', hasValidDates && tipoEventoId && tipoComidaId ? 'Completo' : 'Pendiente'],
                ['03', 'Salon', selectedVenue ? 'Reservado' : 'Pendiente'],
              ].map(([number, title, state]) => (
                <div key={number} className="flex items-center gap-3 rounded-2xl border border-stone-900/10 bg-white/75 p-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#A8841C] text-sm font-black text-white shadow-sm">
                    {number}
                  </span>
                  <div>
                    <p className="text-sm font-black text-stone-950">{title}</p>
                    <p className="text-xs font-semibold text-stone-600">{state}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <Card className="overflow-hidden border-stone-200 bg-white shadow-xl shadow-stone-900/5">
              <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-5">
                <p className={labelClass}>Paso 1</p>
                <h2 className="mt-1 font-serif text-2xl font-black text-stone-950">Cliente principal</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Busca por cedula, nombre o telefono. Si no existe, registralo sin salir del flujo.
                </p>
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-3">
                  <label className={labelClass}>Busqueda de cliente</label>
                  <input
                    className={inputClass}
                    placeholder="Ejemplo: 3053984938, Paola Castro..."
                    value={customerQuery}
                    onChange={(event) => {
                      setCustomerQuery(event.target.value);
                      setClienteEncontrado(null);
                    }}
                  />

                  <div className="min-h-28 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3">
                    {searchingCliente && (
                      <p className="px-2 py-3 text-sm font-semibold text-stone-500">Buscando coincidencias...</p>
                    )}

                    {!searchingCliente && clienteResultados.length === 0 && !clienteEncontrado && (
                      <p className="px-2 py-3 text-sm text-stone-500">
                        Escribe al menos 3 caracteres para ver resultados.
                      </p>
                    )}

                    <div className="space-y-2">
                      {clienteResultados.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => {
                            setClienteEncontrado(cliente);
                            setCustomerQuery(cliente.nombreCompleto);
                            setClienteResultados([]);
                          }}
                          className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#A8841C] hover:bg-[#f6efd5]"
                        >
                          <span>
                            <span className="block text-sm font-black text-stone-900">
                              {cliente.nombreCompleto}
                            </span>
                            <span className="text-xs text-stone-500">
                              {cliente.cedula} · {cliente.telefono}
                            </span>
                          </span>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                            Elegir
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-3xl border border-stone-300 bg-gradient-to-br from-[#faf6ee] to-white p-5 text-stone-950 shadow-inner">
                  {clienteEncontrado ? (
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A8841C]">
                        Cliente seleccionado
                      </p>
                      <div>
                        <p className="font-serif text-2xl font-black">{clienteEncontrado.nombreCompleto}</p>
                        <p className="mt-2 text-sm font-semibold text-stone-600">{clienteEncontrado.telefono}</p>
                        <p className="text-sm font-semibold text-stone-600">{clienteEncontrado.correo || 'Sin correo'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A8841C]">
                        Sin cliente
                      </p>
                      <p className="text-sm font-medium leading-6 text-stone-600">
                        La solicitud necesita un cliente para guardar trazabilidad del evento.
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-6 border-[#A8841C]/25 bg-[#A8841C] text-white hover:bg-[#8f7118]"
                    onClick={() => setIsClienteFormOpen(true)}
                  >
                    Registrar nuevo cliente
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-stone-200 bg-white shadow-xl shadow-stone-900/5">
              <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-5">
                <p className={labelClass}>Paso 2</p>
                <h2 className="mt-1 font-serif text-2xl font-black text-stone-950">Datos del evento</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Usa fecha y hora de inicio y fin. Esto permite eventos que cruzan medianoche.
                </p>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClass}>Inicio</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={fechaHoraInicio}
                    onChange={(event) => setFechaHoraInicio(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Fin</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={fechaHoraFin}
                    onChange={(event) => setFechaHoraFin(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Numero de invitados</label>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={numPersonas}
                    onChange={(event) => setNumPersonas(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Tipo de evento</label>
                  <select
                    className={selectClass}
                    value={tipoEventoId}
                    onChange={(event) => setTipoEventoId(event.target.value)}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposEvento.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Tipo de comida</label>
                  <select
                    className={selectClass}
                    value={tipoComidaId}
                    onChange={(event) => setTipoComidaId(event.target.value)}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposComida.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-stone-200 bg-white shadow-xl shadow-stone-900/5">
              <div className="flex flex-col gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className={labelClass}>Paso 3</p>
                  <h2 className="mt-1 font-serif text-2xl font-black text-stone-950">Salon disponible</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Consulta disponibilidad y elige el espacio principal del evento.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={consultarDisponibilidad}>
                  Consultar disponibilidad
                </Button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                {salones.map((salon) => {
                  const selected = selectedVenueId === salon.id;
                  return (
                    <button
                      key={salon.id}
                      type="button"
                      onClick={() => setSelectedVenueId(salon.id)}
                      className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                        selected
                          ? 'border-[#A8841C] bg-[#f6efd5] ring-4 ring-[#A8841C]/15'
                          : 'border-stone-200 bg-white hover:border-[#A8841C] hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-xl font-black text-stone-950">{salon.nombre}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                            {salon.descripcion || 'Sin descripcion registrada.'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            selected ? 'bg-[#A8841C] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {selected ? 'Elegido' : 'Elegir'}
                        </span>
                      </div>
                      <div className="mt-5 rounded-2xl border border-stone-300 bg-[#f4ead8] px-4 py-3 text-sm font-black text-stone-800">
                        Capacidad maxima: {salon.capacidad} personas
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </main>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden border-stone-300 bg-[#fbf8f2] text-stone-950 shadow-2xl shadow-stone-900/10">
              <div className="border-b border-stone-200 bg-gradient-to-br from-white to-[#f4ead8] p-6">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">
                  Resumen vivo
                </p>
                <h2 className="mt-2 font-serif text-3xl font-black">Solicitud</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-600">
                  Revisa los datos clave antes de crear el evento.
                </p>
              </div>

              <div className="space-y-4 p-6">
                <SummaryItem
                  label="Cliente"
                  value={clienteEncontrado?.nombreCompleto || 'Pendiente'}
                  muted={!clienteEncontrado}
                />
                <SummaryItem label="Inicio" value={formatDateTime(fechaHoraInicio)} muted={!fechaHoraInicio} />
                <SummaryItem label="Fin" value={formatDateTime(fechaHoraFin)} muted={!fechaHoraFin} />
                <SummaryItem label="Duracion" value={durationLabel} muted={!hasValidDates} />
                <SummaryItem label="Tipo de evento" value={selectedTipoEvento?.nombre || 'Pendiente'} muted={!selectedTipoEvento} />
                <SummaryItem label="Tipo de comida" value={selectedTipoComida?.nombre || 'Pendiente'} muted={!selectedTipoComida} />
                <SummaryItem label="Salon" value={selectedVenue?.nombre || 'Pendiente'} muted={!selectedVenue} />

                <div className="rounded-3xl border border-stone-300 bg-[#f4ead8] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A8841C]">
                    Siguiente despues de crear
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-stone-800">
                    El evento queda en Pendiente y podras continuar con menu, montaje y cotizacion.
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/90 px-6 py-4 shadow-2xl shadow-stone-900/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-stone-500">
            {canCreate
              ? 'Todo listo para crear la solicitud.'
              : 'Completa cliente, horario, tipo de evento, tipo de comida y salon.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/events')}>
              Salir
            </Button>
            <Button type="button" onClick={handleCrearEvento} disabled={saving || !canCreate}>
              {saving ? 'Creando...' : 'Crear evento y continuar'}
            </Button>
          </div>
        </div>
      </div>

      <ClientFormModal
        isOpen={isClienteFormOpen}
        mode="create"
        initialClient={null}
        idNumbersInUse={clienteResultados.map((cliente) => cliente.cedula)}
        onCancel={() => setIsClienteFormOpen(false)}
        onSubmit={handleRegistrarCliente}
      />
    </div>
  );
}

export default EventRequestPage;

type SummaryItemProps = {
  label: string;
  value: string;
  muted?: boolean;
};

function SummaryItem({ label, value, muted }: SummaryItemProps) {
  return (
    <div className="rounded-2xl border border-[#A8841C]/15 bg-white p-4 shadow-sm">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className={`mt-2 text-sm font-black ${muted ? 'text-stone-400' : 'text-stone-950'}`}>{value}</p>
    </div>
  );
}
