import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import roomService from '@/services/roomService';
import { Room } from '../types';

export const useAvailability = () => {
  const { selectedDate } = useCalendarStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedRooms = await roomService.getRoomAvailability(selectedDate);
        setRooms(fetchedRooms);
      } catch (err) {
        setError('Error al cargar la disponibilidad.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate]);

  return { rooms, loading, error, selectedDate };
};
