import React from 'react';
import { format } from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import { useCalendar } from '../../hooks/useCalendar';
import { Event } from '../../types';
import { MINUTES_PER_DAY, positionEventsForDay } from '../../utils/eventLayout';

const HOUR_HEIGHT = 72;

const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
  Confirmado: { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-900' },
  Pendiente: { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900' },
  'Cotizacion enviada': { bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-900' },
  'Cotizacion aprobada': { bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-900' },
  'Pendiente anticipo': { bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-900' },
  'Esperando seleccion de menu': { bg: 'bg-violet-100', border: 'border-violet-600', text: 'text-violet-900' },
  Cancelado: { bg: 'bg-slate-200', border: 'border-slate-500', text: 'text-slate-700' },
  Finalizado: { bg: 'bg-stone-200', border: 'border-stone-500', text: 'text-stone-800' },
  Vencido: { bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-900' },
};
const defaultStatusStyle = { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900' };

interface DayViewProps {
  onSelectEvent?: (event: Event) => void;
}

const DayView: React.FC<DayViewProps> = ({ onSelectEvent }) => {
  const { selectedDate } = useCalendarStore();
  const { events, loading } = useCalendar();
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const gridHeight = (MINUTES_PER_DAY / 60) * HOUR_HEIGHT;
  const positionedEvents = positionEventsForDay(events, selectedDate, HOUR_HEIGHT);

  return (
    <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
      {loading ? (
        <div className="col-span-2 p-4 text-center">Cargando eventos...</div>
      ) : (
        <>
          <div className="relative border-r border-outline-variant/35 bg-stone-50" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 pr-6 text-right text-[11px] font-bold text-stone-500"
                style={{ top: hour * HOUR_HEIGHT + 8 }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          <div className="relative border-outline-variant/30 bg-white" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-outline-variant/30"
                style={{ top: (hour + 1) * HOUR_HEIGHT, height: 0 }}
              />
            ))}

            {positionedEvents.map(({ event, top, height, left, width, startsBeforeDay, endsAfterDay }) => {
              const style = statusStyles[event.status] ?? defaultStatusStyle;

              return (
                <div
                  key={`${event.id}-${top}`}
                  className={`group absolute z-10 min-w-0 cursor-pointer overflow-hidden rounded border-l-4 p-3 text-left shadow-sm transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#A8841C]/40 ${style.bg} ${style.border} ${style.text}`}
                  style={{
                    top,
                    height,
                    left: `calc(${left}% + 8px)`,
                    width: `calc(${width}% - 12px)`,
                  }}
                  title={`${event.title} - ${format(event.start, 'HH:mm')} a ${format(event.end, 'HH:mm')}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectEvent?.(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                      keyboardEvent.preventDefault();
                      onSelectEvent?.(event);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="mb-1 truncate text-xs font-bold text-on-surface">{event.title}</p>
                      <p className={`flex items-center gap-1 truncate text-[10px] font-medium ${style.text}`}>
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        <span className="truncate">{event.salon}</span>
                      </p>
                      {height >= 64 && (
                        <p className="mt-1 text-[10px] font-semibold opacity-80">
                          {startsBeforeDay ? '...' : format(event.start, 'HH:mm')} -{' '}
                          {endsAfterDay ? '...' : format(event.end, 'HH:mm')}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-[9px] font-bold uppercase opacity-70">
                      {startsBeforeDay ? '...' : format(event.start, 'HH:mm')} -{' '}
                      {endsAfterDay ? '...' : format(event.end, 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DayView;
