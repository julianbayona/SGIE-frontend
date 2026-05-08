export type EventStatus =
  | 'Pendiente'
  | 'Esperando selección de menú'
  | 'Cotización enviada'
  | 'Cotización aprobada'
  | 'Pendiente anticipo'
  | 'Confirmado'
  | 'Cancelado';

export type EventKind = 'Boda' | 'Cumpleaños' | 'Bautizo' | 'Corporativo' | 'Social';
export type EventsTab = 'Todos' | 'Activos' | 'Pendientes' | 'Confirmados' | 'Cancelados';

export interface EventRecord {
  id: string;
  dateLabel: string;
  clientName: string;
  clientDocument: string;
  clientInitials: string;
  hall: string;
  eventKind: EventKind;
  status: EventStatus;
  isActive: boolean;
  nextAction: string;
}
