import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EventDetailHeaderTabs, { type EventDetailTab } from '@/features/events/components/EventDetailHeaderTabs';
import { getEventSummaryById } from '@/features/events/data/eventSummary';

const sectionLabelByTab: Record<EventDetailTab, string> = {
  summary: 'Resumen',
  menu: 'Menu',
  agenda: 'Agenda',
  montaje: 'Montaje',
  cotizacion: 'Cotizacion',
  pagos: 'Pagos',
};

const placeholderTextByTab: Record<EventDetailTab, string> = {
  summary: 'Resumen general del evento.',
  menu: 'Configuracion de menu del evento.',
  agenda: 'Programacion de degustaciones y recordatorios de anticipos.',
  montaje: 'Definicion de montaje y distribucion del salon.',
  cotizacion: 'Ajustes de costos y consolidado de cotizacion.',
  pagos: 'Control de anticipos y pagos pendientes.',
};

const EventSectionPlaceholderPage: React.FC = () => {
  const { eventId, section } = useParams();

  const event = useMemo(() => getEventSummaryById(eventId), [eventId]);

  const activeTab: EventDetailTab =
    section === 'menu' ||
    section === 'agenda' ||
    section === 'montaje' ||
    section === 'cotizacion' ||
    section === 'pagos'
      ? section
      : 'summary';

  return (
    <section className="space-y-10 pb-24">
      <EventDetailHeaderTabs event={event} activeTab={activeTab} />

      <div className="bg-surface-container-lowest border border-border rounded-xl p-10 shadow-sm">
        <p className="text-xs tracking-widest uppercase text-stone-500 font-bold mb-3">Seccion</p>
        <h3 className="text-3xl font-display text-on-surface mb-3">{sectionLabelByTab[activeTab]}</h3>
        <p className="text-on-surface-variant">{placeholderTextByTab[activeTab]}</p>
      </div>
    </section>
  );
};

export default EventSectionPlaceholderPage;
