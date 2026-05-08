import { create } from 'zustand';
import { Event } from '@/features/calendar/types';

interface CalendarState {
  events: Event[];
  setEvents: (events: Event[]) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: 'day' | 'week' | 'month';
  setView: (view: 'day' | 'week' | 'month') => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  view: 'month',
  setView: (view) => set({ view }),
}));
