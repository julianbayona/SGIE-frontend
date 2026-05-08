export type QuoteStatus = 'Borrador' | 'Generada' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Desactualizada';
export type QuoteCustomerType = 'Socio' | 'No Socio';
export type QuotesTab = 'Recientes' | 'Pendientes' | 'Aprobadas';

export interface QuoteRecord {
  id: string;
  eventName: string;
  eventMeta: string;
  customerName: string;
  customerType: QuoteCustomerType;
  createdAt: string;
  totalValue: string;
  status: QuoteStatus;
}
