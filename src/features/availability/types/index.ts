export type AvailabilityStatus = 'Libre' | 'Parcial' | 'Ocupado';

export interface Room {
  id: string;
  name: string;
  status: AvailabilityStatus;
}
