import salonesApi from '@/api/salones';
import type { SalonResponse } from '@/api/types';
import type { Room, AvailabilityStatus } from '@/features/availability/types';

/**
 * Determina el estado de disponibilidad de un salón.
 * El backend no devuelve disponibilidad calculada en el listado general,
 * por lo que se usa el endpoint de disponibilidad con el rango del día.
 */
function toRoom(salon: SalonResponse, disponibles: Set<string>): Room {
  let status: AvailabilityStatus = 'Ocupado';
  if (disponibles.has(salon.id)) {
    status = 'Libre';
  }
  return {
    id: salon.id,
    name: salon.nombre,
    status,
  };
}

const roomService = {
  /**
   * Consulta la disponibilidad de salones para un día completo.
   * Combina el listado general con el endpoint de disponibilidad.
   */
  async getRoomAvailability(date: Date): Promise<Room[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const toLocalISO = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const [todos, disponibles] = await Promise.all([
      salonesApi.listar(),
      salonesApi.consultarDisponibilidad({
        fechaHoraInicio: toLocalISO(startOfDay),
        fechaHoraFin: toLocalISO(endOfDay),
      }),
    ]);

    const disponiblesSet = new Set(disponibles.map((s) => s.id));
    return todos.filter((s) => s.activo).map((s) => toRoom(s, disponiblesSet));
  },
};

export default roomService;
