import React from 'react';
import MiniCalendar from '../MiniCalendar';
import RoomAvailabilityList from '../RoomAvailabilityList';

const AvailabilityPanel: React.FC = () => {
  return (
    <aside className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4">
      <section className="bg-surface-container-lowest ghost-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/10">
          <h3 className="text-[10px] font-bold text-primary-gold uppercase tracking-[0.2em] mb-4">
            Disponibilidad
          </h3>
          <MiniCalendar />
        </div>
        <RoomAvailabilityList />
      </section>
    </aside>
  );
};

export default AvailabilityPanel;
