import React from 'react';
import type { EventStatus } from '@/features/events/types';
import type { QuoteStatus } from '@/features/quotes/types';

type StatusBadgeTone = 'neutral' | 'cyan' | 'amber' | 'emerald' | 'red' | 'slate' | 'violet' | 'indigo' | 'orange';

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: 'bg-stone-200 text-stone-800 border-stone-400',
  cyan: 'bg-cyan-100 text-cyan-900 border-cyan-400',
  amber: 'bg-amber-100 text-amber-900 border-amber-400',
  emerald: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  red: 'bg-rose-100 text-rose-900 border-rose-400',
  slate: 'bg-slate-200 text-slate-700 border-slate-400',
  violet: 'bg-violet-100 text-violet-900 border-violet-400',
  indigo: 'bg-indigo-100 text-indigo-900 border-indigo-400',
  orange: 'bg-orange-100 text-orange-900 border-orange-400',
};

const eventStatusTone: Record<EventStatus, StatusBadgeTone> = {
  Pendiente: 'amber',
  'Esperando selección de menú': 'violet',
  'Cotización enviada': 'cyan',
  'Cotización aprobada': 'indigo',
  'Pendiente anticipo': 'orange',
  Confirmado: 'emerald',
  Cancelado: 'slate',
};

const quoteStatusTone: Record<QuoteStatus, StatusBadgeTone> = {
  Borrador: 'slate',
  Generada: 'neutral',
  Enviada: 'cyan',
  Aceptada: 'emerald',
  Rechazada: 'red',
  Desactualizada: 'orange',
};

interface StatusBadgeProps {
  status: EventStatus | QuoteStatus;
  type: 'event' | 'quote';
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  size = 'sm',
  className = '',
}) => {
  const tone =
    type === 'event'
      ? eventStatusTone[status as EventStatus]
      : quoteStatusTone[status as QuoteStatus];
  const safeTone = tone ?? 'neutral';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold leading-none ${sizeClasses[size]} ${toneClasses[safeTone]} ${className}`}
    >
      {status}
    </span>
  );
};

export const eventStatuses = Object.keys(eventStatusTone) as EventStatus[];
