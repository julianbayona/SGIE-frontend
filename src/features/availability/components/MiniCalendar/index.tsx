import React from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const MiniCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate } = useCalendarStore();

  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7;

  return (
    <div className="bg-stone-50/40 rounded-lg p-4 border border-outline-variant/20">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-serif-italic text-primary-gold uppercase tracking-widest capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: es })}
        </span>
        {/* Navigation can be added here */}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
          <div key={i} className="text-[8px] font-bold text-stone-400 text-center uppercase">{day}</div>
        ))}
        
        {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}

        {daysInMonth.map(day => {
          const isCurrent = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`
                text-[9px] py-1 text-center cursor-pointer rounded-full w-5 h-5 flex items-center justify-center mx-auto
                ${isSelected ? 'bg-primary-gold text-white font-bold shadow-sm' : ''}
                ${!isSelected && isCurrent ? 'text-primary-gold font-bold' : ''}
                ${!isSelected ? 'text-on-surface-variant hover:bg-stone-200' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
