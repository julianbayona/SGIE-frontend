import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import { useCalendar } from '../../hooks/useCalendar';
import EventItem from '../EventItem';

const MonthView: React.FC = () => {
  const { selectedDate } = useCalendarStore();
  const { events, loading } = useCalendar();

  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7;

  return (
    <div className="grid grid-cols-7">
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
        <div key={day} className="bg-stone-100 p-2 text-center border-b border-r border-outline-variant/40">
          <p className="text-[8px] font-bold text-stone-500 uppercase">{day}</p>
        </div>
      ))}

      {Array.from({ length: startingDayIndex }).map((_, index) => (
        <div key={`empty-${index}`} className="calendar-cell-month bg-stone-50/70 border-r border-b border-outline-variant/30 min-h-[120px]"></div>
      ))}

      {daysInMonth.map((day) => {
        const isCurrentDay = isToday(day);
        const dayEvents = events.filter((event) => format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));

        return (
          <div key={day.toString()} className="min-h-[120px] border-r border-b border-outline-variant/30 bg-white p-2">
            <p
              className={`grid size-6 place-items-center rounded-full text-[10px] font-black ${
                isCurrentDay ? 'bg-stone-950 text-white shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {format(day, 'd')}
            </p>
            <div className="mt-1 flex flex-col gap-1">
              {loading ? <p className="text-xs">Cargando...</p> : dayEvents.map((event) => <EventItem key={event.id} event={event} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthView;
