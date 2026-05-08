import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { EventRecord } from '@/features/events/types';
import { formatShortId } from '@/utils/formatters';

interface EventTableRowProps {
  event: EventRecord;
  onViewEvent: (eventId: string) => void;
}

const EventTableRow: React.FC<EventTableRowProps> = ({ event, onViewEvent }) => {
  return (
    <tr className="hover:bg-stone-50/70 transition-colors">
      <td className="px-6 py-4">
        <p className="font-bold text-text1 text-sm">{formatShortId(event.id, 'EV-')}</p>
        <p className="text-xs text-text3">{event.dateLabel}</p>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-panel flex items-center justify-center text-gold font-bold text-xs uppercase">
            {event.clientInitials}
          </div>
          <div>
            <p className="font-bold text-text1 text-sm">{event.clientName}</p>
            <p className="text-xs text-text3">{event.clientDocument}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-sm font-medium text-text1">{event.hall}</td>

      <td className="px-6 py-4">
        <span className="px-2 py-0.5 bg-panel text-text2 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {event.eventKind}
        </span>
      </td>

      <td className="px-6 py-4">
        <StatusBadge type="event" status={event.status} />
      </td>

      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-text1">{event.nextAction}</p>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onViewEvent(event.id)}
            className="px-3 py-1.5 rounded border border-border text-xs font-semibold text-text2 hover:bg-panel hover:text-gold transition-colors"
          >
            Ver evento
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-panel rounded text-text3 hover:text-gold transition-colors"
            title="Más acciones"
          >
            <span className="material-symbols-outlined text-lg">more_horiz</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EventTableRow;
