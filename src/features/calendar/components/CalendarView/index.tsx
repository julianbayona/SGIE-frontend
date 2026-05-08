import React from 'react';
import { eventStatuses, StatusBadge } from '@/components/ui/StatusBadge';
import { useCalendarStore } from '@/store/calendarStore';
import CalendarHeader from '../CalendarHeader';
import MonthView from '../MonthView';
import WeekView from '../WeekView';
import DayView from '../DayView';

const CalendarView: React.FC = () => {
  const { view } = useCalendarStore();
  const visibleEventStatuses = eventStatuses.filter(
    (status) => status !== 'Esperando selección de menú'
  );

  const renderView = () => {
    switch (view) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <CalendarHeader />
      <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
        {renderView()}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 px-4 py-3 bg-surface-container-lowest">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text3 mr-1">Estados</span>
        {visibleEventStatuses.map((status) => (
          <StatusBadge key={status} type="event" status={status} />
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
