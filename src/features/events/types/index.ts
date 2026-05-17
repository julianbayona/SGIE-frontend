export type EventStatus =
  | 'Pendiente'
  | 'Esperando selección de menú'
  | 'Cotización enviada'
  | 'Cotización aprobada'
  | 'Pendiente anticipo'
  | 'Confirmado'
  | 'Cancelado'
  | 'Finalizado'
  | 'Vencido';

export type EventKind = 'Boda' | 'Cumpleaños' | 'Bautizo' | 'Corporativo' | 'Social';
export type EventsTab = 'Todos' | 'Activos' | 'Pendientes' | 'Confirmados' | 'Cancelados';

export interface EventRecord {
  id: string;
  sortDate: string;
  dateLabel: string;
  rawDate: string;
  clientName: string;
  clientDocument: string;
  clientInitials: string;
  createdBy: string;
  hall: string;
  eventKind: EventKind;
  status: EventStatus;
  isActive: boolean;
  nextAction: string;
}
