import React from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '@/features/calendar/components/CalendarView';
import AvailabilityPanel from '@/features/availability/components/AvailabilityPanel';
import { Button } from '@/components/ui/Button';
import PageTitle from '@/components/ui/PageTitle';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <PageTitle
        eyebrow="Agenda operativa"
        title="Calendario de eventos"
        description={new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <Button onClick={() => navigate('/events/request')} className="rounded-xl px-4 py-2 text-xs font-black">
          <span className="material-symbols-outlined text-base mr-2">add_circle</span>
            Crear solicitud
        </Button>
        }
      />
      
      <div className="grid grid-cols-12 gap-6">
        <CalendarView />
        <AvailabilityPanel />
      </div>
    </section>
  );
};

export default CalendarPage;
