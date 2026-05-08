import React from 'react';
import { useAvailability } from '../../hooks/useAvailability';
import { AvailabilityStatus } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusStyles: Record<AvailabilityStatus, { bg: string; text: string; }> = {
    'Libre': { bg: 'bg-agenda-green', text: 'text-stone-400' },
    'Parcial': { bg: 'bg-primary-gold', text: 'text-stone-400' },
    'Ocupado': { bg: 'bg-agenda-red', text: 'text-stone-400' },
};

const RoomAvailabilityList: React.FC = () => {
  const { rooms, loading, error, selectedDate } = useAvailability();

  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex justify-between items-baseline mb-4">
        <h4 className="text-sm font-serif-italic text-primary-gold">Disponibilidad de Salones</h4>
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest capitalize">
          {format(selectedDate, 'eee dd MMM', { locale: es })}
        </span>
      </div>
      {loading && <p className="text-xs text-center text-stone-500">Cargando...</p>}
      {error && <p className="text-xs text-center text-error">{error}</p>}
      {!loading && !error && (
        <div className="space-y-0.5">
          {rooms.map(room => {
            const style = statusStyles[room.status];
            return (
              <div key={room.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.bg}`}></span>
                  <span className="text-[11px] font-medium text-on-surface">{room.name}</span>
                </div>
                <span className={`text-[10px] font-serif-italic ${style.text}`}>{room.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomAvailabilityList;
