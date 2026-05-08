import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import { useCalendar } from '../../hooks/useCalendar';
import { MINUTES_PER_DAY, positionEventsForDay } from '../../utils/eventLayout';

const HOUR_HEIGHT = 56;

const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
  Confirmado: { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-900' },
  Pendiente: { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900' },
  'CotizaciÃ³n enviada': { bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-900' },
  'CotizaciÃ³n aprobada': { bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-900' },
  'Pendiente anticipo': { bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-900' },
  'Esperando selecciÃ³n de menÃº': { bg: 'bg-violet-100', border: 'border-violet-600', text: 'text-violet-900' },
  Cancelado: { bg: 'bg-slate-200', border: 'border-slate-500', text: 'text-slate-700' },
};
const defaultStatusStyle = statusStyles.Pendiente ?? { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900' };

const WeekView: React.FC = () => {
  const { selectedDate } = useCalendarStore();
  const { events, loading } = useCalendar();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const gridHeight = (MINUTES_PER_DAY / 60) * HOUR_HEIGHT;

  return (
    <div>
      {/* Header */}
      <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
        <div className="calendar-header bg-stone-100 border-r border-b border-outline-variant/40"></div>
        {days.map(day => {
          const isCurrentDay = isToday(day);

          return (
          <div
            key={day.toISOString()}
            className="calendar-header border-b border-l border-outline-variant/40 bg-stone-100 p-2 text-center"
          >
            <p className={`text-[8px] font-bold uppercase ${isCurrentDay ? 'text-stone-950' : 'text-stone-400'}`}>
              {format(day, 'eee')}
            </p>
            <p
              className={`mx-auto mt-0.5 grid size-7 place-items-center rounded-full text-sm font-black ${
                isCurrentDay ? 'bg-stone-950 text-white shadow-sm' : 'font-serif-italic text-on-surface'
              }`}
            >
              {format(day, 'd')}
            </p>
          </div>
          );
        })}
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-4 text-center">Cargando eventos...</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="relative bg-stone-50 border-r border-outline-variant/35" style={{ height: gridHeight }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute left-0 right-0 pr-3 text-right text-[10px] font-bold text-stone-500"
                style={{ top: hour * HOUR_HEIGHT + 4 }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {days.map(day => {
            const positionedEvents = positionEventsForDay(events, day, HOUR_HEIGHT);

            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-outline-variant/30 bg-white"
                style={{ height: gridHeight }}
              >
                {hours.map(hour => (
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
                      className={`absolute z-10 overflow-hidden rounded border-l-4 px-2 py-1 shadow-sm ${style.bg} ${style.border} ${style.text}`}
                      style={{
                        top,
                        height,
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      title={`${event.title} · ${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
                    >
                      <p className="truncate text-[10px] font-bold">{event.title}</p>
                      <p className="truncate text-[9px] font-semibold opacity-90">
                        {startsBeforeDay ? '...' : format(event.start, 'HH:mm')} - {endsAfterDay ? '...' : format(event.end, 'HH:mm')}
                      </p>
                      {height >= 44 && <p className="truncate text-[9px] opacity-90">{event.salon}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeekView;
