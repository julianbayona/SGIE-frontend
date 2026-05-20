export type QuoteStatus = 'Borrador' | 'Generada' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Desactualizada';
export type QuoteCustomerType = 'Socio' | 'No Socio';

export interface QuoteRecord {
  id: string;
  eventId: string;
  sortDate: string;
  eventName: string;
  eventMeta: string;
  eventDateLabel: string;
  customerName: string;
  customerType: QuoteCustomerType;
  createdAt: string;
  isCurrent: boolean;
  rawTotalValue: number;
  totalValue: string;
  status: QuoteStatus;
}
