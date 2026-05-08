export type ClientCategory = 'Socio' | 'No Socio';
export type ClientStatus = 'Activo' | 'Suspendido';

export interface Client {
  id: string;
  idNumber: string;
  fullName: string;
  phone: string;
  email: string;
  category: ClientCategory;
  status: ClientStatus;
  registeredAt: string;
}

export type ClientsTab = 'Todos' | 'Socios' | 'No Socios';
