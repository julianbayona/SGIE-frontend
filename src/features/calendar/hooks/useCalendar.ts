import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import eventService from '@/services/eventService';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export const useCalendar = () => {
  const { events, setEvents, selectedDate, view } = useCalendarStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let startDate: Date;
        let endDate: Date;

        switch(view) {
          case 'day':
            startDate = startOfDay(selectedDate);
            endDate = endOfDay(selectedDate);
            break;
          case 'week':
            startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
            endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
            break;
          case 'month':
          default:
            startDate = startOfMonth(selectedDate);
            endDate = endOfMonth(selectedDate);
            break;
        }

        const fetchedEvents = await eventService.getEvents(startDate, endDate);
        setEvents(fetchedEvents);
      } catch (err) {
        setError('Error al cargar los eventos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedDate, view, setEvents]);

  return { events, loading, error, selectedDate, view };
};
