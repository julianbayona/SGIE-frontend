import React from 'react';
import { Event, EventStatus } from '../../types';

const statusStyles: Record<EventStatus, { bg: string; border: string; dot: string; text: string }> = {
  Confirmado: { bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-600', text: 'text-emerald-900' },
  Pendiente: { bg: 'bg-amber-100', border: 'border-amber-300', dot: 'bg-amber-600', text: 'text-amber-900' },
  'Cotización enviada': { bg: 'bg-cyan-100', border: 'border-cyan-300', dot: 'bg-cyan-600', text: 'text-cyan-900' },
  'Cotización aprobada': { bg: 'bg-indigo-100', border: 'border-indigo-300', dot: 'bg-indigo-600', text: 'text-indigo-900' },
  'Pendiente anticipo': { bg: 'bg-orange-100', border: 'border-orange-300', dot: 'bg-orange-600', text: 'text-orange-900' },
  'Esperando selección de menú': { bg: 'bg-violet-100', border: 'border-violet-300', dot: 'bg-violet-600', text: 'text-violet-900' },
  Cancelado: { bg: 'bg-slate-200', border: 'border-slate-300', dot: 'bg-slate-500', text: 'text-slate-700' },
};

interface EventItemProps {
  event: Event;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const style = statusStyles[event.status] || statusStyles.Pendiente;

  return (
    <div className={`flex items-center gap-1.5 ${style.bg} ${style.border} border px-2 py-1 rounded text-[10px] font-semibold ${style.text} truncate`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      <span className="truncate">{event.title}</span>
    </div>
  );
};

export default EventItem;
