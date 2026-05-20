import React, { useState } from 'react';
import { eventStatuses, StatusBadge } from '@/components/ui/StatusBadge';
import { useCalendarStore } from '@/store/calendarStore';
import type { Event } from '../../types';
import CalendarHeader from '../CalendarHeader';
import DayView from '../DayView';
import EventPreviewModal from '../EventPreviewModal';
import MonthView from '../MonthView';
import WeekView from '../WeekView';

const CalendarView: React.FC = () => {
  const { view } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const visibleEventStatuses = eventStatuses.filter((status) => !status.startsWith('Esperando'));

  const renderView = () => {
    switch (view) {
      case 'month':
        return <MonthView onSelectEvent={setSelectedEvent} />;
      case 'week':
        return <WeekView onSelectEvent={setSelectedEvent} />;
      case 'day':
        return <DayView onSelectEvent={setSelectedEvent} />;
      default:
        return <MonthView onSelectEvent={setSelectedEvent} />;
    }
  };

  return (
    <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm lg:col-span-7 xl:col-span-8">
      <CalendarHeader />
      <div className="custom-scrollbar max-h-[600px] overflow-y-auto">{renderView()}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-text3">Estados</span>
        {visibleEventStatuses.map((status) => (
          <StatusBadge key={status} type="event" status={status} />
        ))}
      </div>
      <EventPreviewModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default CalendarView;
