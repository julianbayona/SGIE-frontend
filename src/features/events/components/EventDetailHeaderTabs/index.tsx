import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import eventosApi from '@/api/eventos';
import type { EventoResponse } from '@/api/types';
import usuariosApi from '@/api/usuarios';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import CancelEventModal from '@/features/events/components/CancelEventModal';
import type { EventSummaryData } from '@/features/events/data/eventSummary';
import { formatShortId } from '@/utils/formatters';

export type EventDetailTab =
  | 'summary'
  | 'menu'
  | 'agenda'
  | 'montaje'
  | 'cotizacion'
  | 'pagos';

interface EventDetailHeaderTabsProps {
  event: EventSummaryData;
  activeTab: EventDetailTab;
  onEventCancelled?: (evento: EventoResponse) => void;
  onEventUpdated?: (evento: EventoResponse) => void;
}

const tabs: Array<{ key: EventDetailTab; label: string; getPath: (eventId: string) => string }> = [
  { key: 'summary', label: 'Resumen', getPath: (eventId) => `/events/${eventId}` },
  { key: 'menu', label: 'Menu', getPath: (eventId) => `/events/${eventId}/menu` },
  { key: 'montaje', label: 'Montaje', getPath: (eventId) => `/events/${eventId}/montaje` },
  { key: 'cotizacion', label: 'Cotizacion', getPath: (eventId) => `/events/${eventId}/cotizacion` },
  { key: 'pagos', label: 'Pagos', getPath: (eventId) => `/events/${eventId}/pagos` },
  { key: 'agenda', label: 'Notificaciones', getPath: (eventId) => `/events/${eventId}/agenda` },
];

const actionButtonClass =
  'rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-sm font-bold text-stone-700 shadow-sm transition-colors hover:border-[#A8841C] hover:bg-white';

const EventDetailHeaderTabs: React.FC<EventDetailHeaderTabsProps> = ({
  event,
  activeTab,
  onEventCancelled,
  onEventUpdated,
}) => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [creatorName, setCreatorName] = useState<string | null>(null);

  const isCancelled = event.status === 'Cancelado';
  const isConfirmed = event.status === 'Confirmado';
  const isReadOnly = isCancelled || event.status === 'Finalizado' || event.status === 'Vencido';
  const isAdmin = hasRole('ADMINISTRADOR');
  const canConfirmByRole = hasRole(['ADMINISTRADOR', 'GERENTE', 'TESORERO']);
  const canConfirmByState = event.status.toLowerCase().includes('aprobada') || event.status === 'Pendiente anticipo';
  const canCancel = isAdmin && !isReadOnly;
  const canConfirm = canConfirmByRole && canConfirmByState && !isConfirmed && !isReadOnly;
  const displayedCreator =
    creatorName ?? event.createdBy ?? (event.creatorId ? formatShortId(event.creatorId, 'USR-') : 'Sin usuario asociado');

  useEffect(() => {
    if (!event.creatorId) {
      setCreatorName(null);
      return;
    }

    let cancelled = false;

    usuariosApi.listar()
      .then((usuarios) => {
        if (cancelled) return;
        setCreatorName(usuarios.find((usuario) => usuario.id === event.creatorId)?.nombre ?? null);
      })
      .catch(() => {
        if (!cancelled) setCreatorName(null);
      });

    return () => {
      cancelled = true;
    };
  }, [event.creatorId]);

  const openCancelModal = () => {
    if (!canCancel) return;
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelling) return;
    setCancelModalOpen(false);
    setCancelError(null);
  };

  const handleCancel = async (motivo: string) => {
    try {
      setCancelling(true);
      setCancelError(null);
      const actualizado = await eventosApi.cancelar(event.id, { motivo });
      setCancelModalOpen(false);
      onEventCancelled?.(actualizado);
      toast.success('Evento cancelado', 'El evento quedo bloqueado para nuevas operaciones.');
      if (activeTab !== 'summary') {
        navigate(`/events/${event.id}`, { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cancelar el evento.';
      setCancelError(message);
      toast.error('No fue posible cancelar el evento', message);
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm || confirming) return;

    try {
      setConfirming(true);
      const actualizado = await eventosApi.confirmar(event.id);
      onEventUpdated?.(actualizado);
      toast.success('Evento confirmado', 'Se dispararon las operaciones de notificacion y Google Calendar.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible confirmar el evento.';
      toast.error('No fue posible confirmar el evento', message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-stone-300 bg-[linear-gradient(135deg,#fbf8f1_0%,#efe4cf_62%,#d9c17b_100%)] shadow-xl shadow-stone-900/5">
        <div className="p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-stone-300 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-stone-600">
                  {formatShortId(event.id, 'EV-')}
                </span>
                <StatusBadge type="event" status={event.status} size="md" />
              </div>

              <h2 className="font-serif text-3xl font-black text-stone-950">
                {event.title.replace(' - ', ' · ')}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm font-semibold text-stone-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#A8841C]">calendar_today</span>
                  {event.dateLabel}
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#A8841C]">schedule</span>
                  {event.timeLabel}
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#A8841C]">meeting_room</span>
                  {event.venue}
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#A8841C]">person</span>
                  Creado por: {displayedCreator}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={actionButtonClass}>
                <span className="material-symbols-outlined align-middle text-lg text-[#A8841C]">public</span>
                <span className="ml-2">Enlace publico</span>
              </button>
              <button type="button" className={actionButtonClass}>
                <span className="material-symbols-outlined align-middle text-lg text-[#A8841C]">edit</span>
                <span className="ml-2">Editar</span>
              </button>
              {canConfirmByRole && !isReadOnly && !isConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm || confirming}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title={canConfirm ? 'Confirmar evento' : 'El evento requiere una cotizacion aprobada para confirmarse'}
                >
                  <span className="material-symbols-outlined align-middle text-lg">
                    {confirming ? 'progress_activity' : 'check_circle'}
                  </span>
                  <span className="ml-2">{confirming ? 'Confirmando...' : 'Confirmar evento'}</span>
                </button>
              ) : null}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={openCancelModal}
                  disabled={!canCancel}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined align-middle text-lg">cancel</span>
                  <span className="ml-2">Cancelar</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <nav className="flex gap-7 overflow-x-auto border-b border-stone-300/80">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Link
              key={tab.key}
              to={tab.getPath(event.id)}
              className={`whitespace-nowrap px-1 pb-3 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-[#A8841C] font-black text-[#A8841C]'
                  : 'font-semibold text-stone-500 hover:text-[#A8841C]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <CancelEventModal
        open={cancelModalOpen}
        eventTitle={event.title.replace(' - ', ' / ')}
        submitting={cancelling}
        error={cancelError}
        onClose={closeCancelModal}
        onConfirm={handleCancel}
      />
    </>
  );
};

export default EventDetailHeaderTabs;
