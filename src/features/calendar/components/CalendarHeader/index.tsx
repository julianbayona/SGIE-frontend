import React from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';

const CalendarHeader: React.FC = () => {
  const { selectedDate, setSelectedDate, view, setView } = useCalendarStore();

  const handlePrev = () => {
    if (view === 'month') setSelectedDate(subMonths(selectedDate, 1));
    if (view === 'week') setSelectedDate(subWeeks(selectedDate, 1));
    if (view === 'day') setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setSelectedDate(addMonths(selectedDate, 1));
    if (view === 'week') setSelectedDate(addWeeks(selectedDate, 1));
    if (view === 'day') setSelectedDate(addDays(selectedDate, 1));
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(selectedDate, 'MMMM yyyy', { locale: es });
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM, yyyy', { locale: es })}`;
      }
      case 'day':
        return format(selectedDate, 'eeee, d MMMM, yyyy', { locale: es });
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-display font-bold text-on-surface capitalize">{getTitle()}</h2>
        <div className="flex bg-surface-container-low p-0.5 rounded">
          <Button variant="ghost" size="sm" onClick={handlePrev} aria-label="Periodo anterior">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="px-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
          >
            Hoy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNext} aria-label="Periodo siguiente">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Button>
        </div>
      </div>

      <div className="flex bg-surface-container-low p-0.5 rounded shadow-inner">
        <Button variant={view === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('day')} className="px-3 text-[9px] font-bold uppercase tracking-widest">Día</Button>
        <Button variant={view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('week')} className="px-3 text-[9px] font-bold uppercase tracking-widest">Semana</Button>
        <Button variant={view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('month')} className="px-3 text-[9px] font-bold uppercase tracking-widest">Mes</Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
