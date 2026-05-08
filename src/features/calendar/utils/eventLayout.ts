import { addDays, differenceInMinutes, startOfDay } from 'date-fns';
import type { Event } from '@/features/calendar/types';

export interface PositionedEvent {
  event: Event;
  top: number;
  height: number;
  left: number;
  width: number;
  startsBeforeDay: boolean;
  endsAfterDay: boolean;
}

interface EventSegment {
  event: Event;
  startMinute: number;
  endMinute: number;
  startsBeforeDay: boolean;
  endsAfterDay: boolean;
}

export const MINUTES_PER_DAY = 24 * 60;

export const positionEventsForDay = (
  events: Event[],
  day: Date,
  hourHeight: number,
): PositionedEvent[] => {
  const segments = getSegmentsForDay(events, day);
  const positioned: PositionedEvent[] = [];

  for (const cluster of groupOverlappingSegments(segments)) {
    const lanes: number[] = [];
    const assigned = cluster.map((segment) => {
      const laneIndex = firstAvailableLane(lanes, segment.startMinute);
      lanes[laneIndex] = segment.endMinute;
      return { segment, laneIndex };
    });

    const columnCount = Math.max(lanes.length, 1);
    for (const item of assigned) {
      const { segment, laneIndex } = item;
      const gutter = 1.5;
      const width = 100 / columnCount;
      positioned.push({
        event: segment.event,
        top: (segment.startMinute / 60) * hourHeight,
        height: Math.max(((segment.endMinute - segment.startMinute) / 60) * hourHeight, 28),
        left: laneIndex * width,
        width: Math.max(width - gutter, 12),
        startsBeforeDay: segment.startsBeforeDay,
        endsAfterDay: segment.endsAfterDay,
      });
    }
  }

  return positioned;
};

const getSegmentsForDay = (events: Event[], day: Date): EventSegment[] => {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  return events
    .filter((event) => event.end > dayStart && event.start < dayEnd)
    .map((event) => {
      const visualStart = event.start < dayStart ? dayStart : event.start;
      const visualEnd = event.end > dayEnd ? dayEnd : event.end;
      return {
        event,
        startMinute: clamp(differenceInMinutes(visualStart, dayStart), 0, MINUTES_PER_DAY),
        endMinute: clamp(differenceInMinutes(visualEnd, dayStart), 0, MINUTES_PER_DAY),
        startsBeforeDay: event.start < dayStart,
        endsAfterDay: event.end > dayEnd,
      };
    })
    .filter((segment) => segment.endMinute > segment.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
};

const groupOverlappingSegments = (segments: EventSegment[]): EventSegment[][] => {
  const groups: EventSegment[][] = [];
  let current: EventSegment[] = [];
  let currentEnd = -1;

  for (const segment of segments) {
    if (current.length === 0 || segment.startMinute < currentEnd) {
      current.push(segment);
      currentEnd = Math.max(currentEnd, segment.endMinute);
      continue;
    }

    groups.push(current);
    current = [segment];
    currentEnd = segment.endMinute;
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
};

const firstAvailableLane = (lanes: number[], startMinute: number): number => {
  const laneIndex = lanes.findIndex((endMinute) => endMinute <= startMinute);
  return laneIndex >= 0 ? laneIndex : lanes.length;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
