import React from 'react';

interface EventCancelledNoticeProps {
  title?: string;
  detail?: string;
}

const EventCancelledNotice: React.FC<EventCancelledNoticeProps> = ({ title, detail }) => {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-xl text-red-700">block</span>
        <div>
          <p className="font-black">{title ?? 'Evento cancelado: modo solo lectura'}</p>
          <p className="mt-1 font-medium leading-6 text-red-700">
            {detail ??
              'Este evento ya no permite cambios operativos. Puedes consultar la informacion historica, pero no crear nuevas versiones, pagos, cotizaciones o agendamientos.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventCancelledNotice;
