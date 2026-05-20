import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Event } from '../../types';

interface EventPreviewModalProps {
  event: Event | null;
  onClose: () => void;
}

const EventPreviewModal: React.FC<EventPreviewModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (!event) return undefined;

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, onClose]);

  if (!event) return null;

  const startLabel = format(event.start, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
  const endLabel = format(event.end, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#A8841C]/25 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#A8841C]/20 bg-gradient-to-r from-[#fffaf0] to-white px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A8841C]">Vista previa</p>
            <h3 className="mt-2 truncate font-display text-2xl font-black text-on-surface">{event.title}</h3>
            <div className="mt-3">
              <StatusBadge type="event" status={event.status} size="md" />
            </div>
          </div>
          <button
            aria-label="Cerrar vista previa"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-[#A8841C] hover:text-[#A8841C]"
            type="button"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Inicio</p>
            <p className="mt-1 text-sm font-bold text-on-surface">{startLabel}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Fin</p>
            <p className="mt-1 text-sm font-bold text-on-surface">{endLabel}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 sm:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Salon reservado</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="material-symbols-outlined text-base text-[#A8841C]">meeting_room</span>
              {event.salon}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 bg-[#faf8f2] px-6 py-4">
          <p className="text-xs font-semibold text-on-surface-variant">
            Abre el evento para gestionar menu, montaje, cotizacion, pagos o notificaciones.
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:border-[#A8841C] hover:text-[#A8841C]"
              type="button"
              onClick={onClose}
            >
              Cerrar
            </button>
            <Link
              className="rounded-md bg-[#A8841C] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#8d6f15]"
              to={`/events/${event.id}`}
            >
              Abrir evento
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;
