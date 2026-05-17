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

export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: EventStatus;
  salon: string;
}
