import React from 'react';
import { format } from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import { useCalendar } from '../../hooks/useCalendar';
import { EventStatus } from '../../types';
import { MINUTES_PER_DAY, positionEventsForDay } from '../../utils/eventLayout';

const HOUR_HEIGHT = 72;

const statusStyles: Record<EventStatus, { bg: string; border: string; text: string }> = {
  Confirmado: { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-900' },
  Pendiente: { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900' },
  'Cotización enviada': { bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-900' },
  'Cotización aprobada': { bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-900' },
  'Pendiente anticipo': { bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-900' },
  'Esperando selección de menú': { bg: 'bg-violet-100', border: 'border-violet-600', text: 'text-violet-900' },
  Cancelado: { bg: 'bg-slate-200', border: 'border-slate-500', text: 'text-slate-700' },
};

const DayView: React.FC = () => {
  const { selectedDate } = useCalendarStore();
  const { events, loading } = useCalendar();
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const gridHeight = (MINUTES_PER_DAY / 60) * HOUR_HEIGHT;
  const positionedEvents = positionEventsForDay(events, selectedDate, HOUR_HEIGHT);

  return (
    <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
      {loading ? (
        <div className="col-span-2 p-4 text-center">Cargando eventos...</div>
      ) : <>
        <div className="relative bg-stone-50 border-r border-outline-variant/35" style={{ height: gridHeight }}>
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

        <div className="relative bg-white border-outline-variant/30" style={{ height: gridHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-b border-outline-variant/30"
              style={{ top: (hour + 1) * HOUR_HEIGHT, height: 0 }}
            />
          ))}

          {positionedEvents.map(({ event, top, height, left, width, startsBeforeDay, endsAfterDay }) => {
            const style = statusStyles[event.status] || statusStyles.Pendiente;
            return (
              <div
                key={`${event.id}-${top}`}
                className={`absolute z-10 overflow-hidden rounded ${style.bg} ${style.border} ${style.text} border-l-4 p-3 shadow-sm group cursor-pointer transition-all min-w-0`}
                style={{
                  top,
                  height,
                  left: `calc(${left}% + 8px)`,
                  width: `calc(${width}% - 12px)`,
                }}
                title={`${event.title} · ${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface mb-1 truncate">{event.title}</p>
                    <p className={`text-[10px] ${style.text} font-medium flex items-center gap-1 truncate`}>
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      <span className="truncate">{event.salon}</span>
                    </p>
                    {height >= 64 && (
                      <p className="mt-1 text-[10px] font-semibold opacity-80">
                        {startsBeforeDay ? '...' : format(event.start, 'HH:mm')} - {endsAfterDay ? '...' : format(event.end, 'HH:mm')}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase whitespace-nowrap opacity-70">
                    {startsBeforeDay ? '...' : format(event.start, 'HH:mm')} - {endsAfterDay ? '...' : format(event.end, 'HH:mm')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
};

export default DayView;
