// ─────────────────────────────────────────────
// Enums del backend
// ─────────────────────────────────────────────

export type TipoCliente = 'SOCIO' | 'NO_SOCIO';

export type EstadoEvento =
  | 'PENDIENTE'
  | 'COTIZACION_ENVIADA'
  | 'COTIZACION_APROBADA'
  | 'PENDIENTE_ANTICIPO'
  | 'CONFIRMADO'
  | 'CANCELADO';

export type EstadoCotizacion =
  | 'BORRADOR'
  | 'GENERADA'
  | 'ENVIADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'DESACTUALIZADA';

// ─────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────

export interface ClienteResponse {
  id: string;
  cedula: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  tipoCliente: TipoCliente;
  activo: boolean;
  creadoPor: string | null;
}

export interface RegistrarClienteRequest {
  cedula: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  tipoCliente: TipoCliente;
  creadoPor?: string;
}

// ─────────────────────────────────────────────
// Salones
// ─────────────────────────────────────────────

export interface SalonResponse {
  id: string;
  nombre: string;
  capacidad: number;
  descripcion: string;
  activo: boolean;
}

export interface RegistrarSalonRequest {
  nombre: string;
  capacidad: number;
  descripcion?: string;
}

export interface ConsultarDisponibilidadParams {
  fechaHoraInicio: string; // ISO 8601 LocalDateTime: "2025-10-14T14:00:00"
  fechaHoraFin: string;
  capacidadMinima?: number;
}

// ─────────────────────────────────────────────
// Eventos
// ─────────────────────────────────────────────

export interface ReservaSalonResponse {
  id: string;
  reservaRaizId: string;
  salonId: string;
  numInvitados: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  version: number;
  vigente: boolean;
}

export interface EventoResponse {
  id: string;
  clienteId: string;
  tipoEventoId: string;
  tipoComidaId: string;
  usuarioCreadorId: string;
  estado: EstadoEvento;
  gcalEventId: string | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  reservas: ReservaSalonResponse[];
}

export interface CrearEventoRequest {
  clienteId: string;
  tipoEventoId: string;
  tipoComidaId: string;
  fechaHoraInicio: string; // ISO 8601 LocalDateTime
  fechaHoraFin: string;
}

export interface CrearReservaSalonRequest {
  salonId: string;
  numInvitados: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
}

export interface ModificarReservaSalonRequest {
  salonId: string;
  numInvitados: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
}

export interface ConfirmarEventoRequest {}

export interface CancelarEventoRequest {
  motivo: string;
}

export interface PruebaPlatoRequest {
  fechaRealizacion: string;
}

export interface PruebaPlatoResponse {
  id: string;
  eventoId: string;
  fechaRealizacion: string;
  estado: string;
}

// ─────────────────────────────────────────────
// Cotizaciones
// ─────────────────────────────────────────────

export interface CotizacionItemResponse {
  id: string;
  tipoConcepto: string;
  origenId: string;
  descripcion: string;
  precioBase: number;
  precioOverride: number | null;
  cantidad: number;
  subtotal: number;
}

export interface CotizacionResponse {
  id: string;
  reservaId: string;
  usuarioId: string;
  estado: EstadoCotizacion;
  vigente: boolean;
  valorSubtotal: number;
  descuento: number;
  valorTotal: number;
  observaciones: string | null;
  items: CotizacionItemResponse[];
}

export interface GenerarCotizacionRequest {
  descuento?: number;
  observaciones?: string | null;
}

export interface ActualizarItemCotizacionRequest {
  precioOverride: number | null;
}

export interface ActualizarItemsCotizacionRequest {
  items: Array<{ itemId: string; precioOverride: number | null }>;
}

// ─────────────────────────────────────────────
// Catálogos
// ─────────────────────────────────────────────

export interface CatalogoBasicoResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CatalogoBasicoRequest {
  nombre: string;
  descripcion?: string;
}

export interface ColorResponse {
  id: string;
  nombre: string;
  codigoHex: string;
  activo: boolean;
}

export interface ColorRequest {
  nombre: string;
  codigoHex: string;
}

export interface MantelResponse {
  id: string;
  nombre: string;
  colorId?: string;
  idColor?: string;
  color?: ColorResponse | null;
  activo: boolean;
}

export interface MantelRequest {
  nombre: string;
  colorId: string;
}

export interface SobremantelResponse {
  id: string;
  nombre: string;
  colorId?: string;
  idColor?: string;
  color?: ColorResponse | null;
  activo: boolean;
}

export interface SobremantelRequest {
  nombre: string;
  colorId: string;
}

export interface TipoAdicionalResponse {
  id: string;
  nombre: string;
  modoCobro: 'UNIDAD' | 'SERVICIO';
  precioBase: number;
  activo: boolean;
}

export interface TipoAdicionalRequest {
  nombre: string;
  modoCobro: 'UNIDAD' | 'SERVICIO';
  precioBase: number;
}

export interface PlatoRequest {
  nombre: string;
  descripcion?: string;
  precioBase: number;
}

// ─────────────────────────────────────────────
// Menús
// ─────────────────────────────────────────────

export interface ItemMenuResponse {
  id: string;
  platoId: string;
  cantidad: number;
  excepciones: string | null;
}

export interface SeleccionMenuResponse {
  id: string;
  tipoMomentoId: string;
  items: ItemMenuResponse[];
}

export interface MenuResponse {
  id: string;
  reservaId: string;
  notasGenerales: string | null;
  selecciones: SeleccionMenuResponse[];
}

export interface ItemMenuRequest {
  platoId: string;
  cantidad: number;
  excepciones?: string;
}

export interface SeleccionMenuRequest {
  tipoMomentoId: string;
  items: ItemMenuRequest[];
}

export interface ConfigurarMenuRequest {
  notasGenerales?: string;
  selecciones: SeleccionMenuRequest[];
}

export interface SeleccionMenuRequest {
  tipoMomentoId: string;
  items: ItemMenuRequest[];
}

export interface ItemMenuRequest {
  platoId: string;
  cantidad: number;
  excepciones?: string;
}

export interface MenuResponse {
  id: string;
  reservaId: string;
  notasGenerales: string | null;
  selecciones: SeleccionMenuResponse[];
}

export interface SeleccionMenuResponse {
  id: string;
  tipoMomentoId: string;
  items: ItemMenuResponse[];
}

export interface ItemMenuResponse {
  id: string;
  platoId: string;
  cantidad: number;
  excepciones: string | null;
}

export interface TipoMomentoMenuResponse {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface TipoMomentoMenuRequest {
  nombre: string;
}

export interface PlatoResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number;
  activo: boolean;
}

export interface PlatoMomentoRequest {
  platoId: string;
  tipoMomentoId: string;
}

export interface PlatoMomentoResponse {
  platoId: string;
  tipoMomentoId: string;
}

// ─────────────────────────────────────────────
// Montajes
// ─────────────────────────────────────────────

export interface InfraestructuraReservaResponse {
  id: string;
  mesaPonque: boolean;
  mesaRegalos: boolean;
  espacioMusicos: boolean;
  estanteBombas: boolean;
}

export interface MontajeMesaReservaResponse {
  id: string;
  tipoMesaId: string;
  tipoSillaId: string;
  sillaPorMesa: number;
  cantidadMesas: number;
  mantelId: string | null;
  sobremantelId: string | null;
  vajilla: boolean;
  fajon: boolean;
}

export interface AdicionalEventoResponse {
  id: string;
  tipoAdicionalId: string;
  cantidad: number;
}

export interface MontajeResponse {
  id: string;
  reservaId: string;
  observaciones: string | null;
  mesas: MontajeMesaReservaResponse[];
  infraestructura: InfraestructuraReservaResponse;
  adicionales: AdicionalEventoResponse[];
}

export interface MontajeMesaReservaRequest {
  tipoMesaId: string;
  tipoSillaId: string;
  sillaPorMesa: number;
  cantidadMesas: number;
  mantelId?: string;
  sobremantelId?: string;
  vajilla: boolean;
  fajon: boolean;
}

export interface InfraestructuraReservaRequest {
  mesaPonque: boolean;
  mesaRegalos: boolean;
  espacioMusicos: boolean;
  estanteBombas: boolean;
}

export interface AdicionalEventoRequest {
  tipoAdicionalId: string;
  cantidad: number;
}

export interface ConfigurarMontajeRequest {
  observaciones?: string;
  mesas: MontajeMesaReservaRequest[];
  infraestructura: InfraestructuraReservaRequest;
  adicionales?: AdicionalEventoRequest[];
}

// ─────────────────────────────────────────────
// Pagos
// ─────────────────────────────────────────────

export interface AnticipoResponse {
  id: string;
  cotizacionId: string;
  usuarioId: string;
  valor: number;
  metodoPago: string;
  fechaPago: string; // LocalDate: "2025-10-14"
  observaciones: string | null;
  totalPagado: number;
  saldoPendiente: number;
}

export interface RegistrarAnticipoRequest {
  valor: number;
  metodoPago: string;
  fechaPago: string; // "YYYY-MM-DD"
  observaciones?: string;
}

export interface RecordatorioAnticipoResponse {
  id: string;
  eventoId: string;
  usuarioId: string;
  fechaRecordatorio: string;
  estado: string;
  notificacionId: string | null;
}

export interface ProgramarRecordatorioRequest {
  fechaRecordatorio: string; // YYYY-MM-DD
}

export interface EstadoFinancieroEventoResponse {
  eventoId: string;
  cotizacionVigenteId: string | null;
  valorTotal: number;
  totalPagado: number;
  saldoPendiente: number;
  pagadoTotalmente: boolean;
}

// ─────────────────────────────────────────────
// Notificaciones y Calendar
// ─────────────────────────────────────────────

export interface NotificacionDestinatarioResponse {
  id: string;
  usuarioId: string | null;
  telefono: string | null;
  correo: string | null;
  estado: string;
}

export interface NotificacionResponse {
  id: string;
  eventoId: string;
  tipo: string;
  fechaProgramada: string;
  fechaEnvio: string | null;
  estado: string;
  intentos: number;
  payloadJson: string;
  destinatarios: NotificacionDestinatarioResponse[];
}

export interface EventoCalendarResponse {
  id: string;
  origenTipo: string;
  origenId: string;
  eventoId: string;
  tipo: string;
  googleEventId: string | null;
  fechaSync: string | null;
  estado: string;
  intentos: number;
  mensajeError: string | null;
}

// -------------------------------------------------------------
// Reportes
// -------------------------------------------------------------

export interface EstadoEventoResumenResponse {
  estado: EstadoEvento;
  total: number;
}

export interface ResumenEventosResponse {
  desde: string;
  hasta: string;
  totalEventos: number;
  confirmados: number;
  cancelados: number;
  porcentajeConfirmados: number;
  porcentajeCancelados: number;
  estados: EstadoEventoResumenResponse[];
}

export interface EventosMensualesResponse {
  anio: number;
  mes: number;
  confirmados: number;
  cancelados: number;
  total: number;
}

export interface ReporteFinancieroEventoResponse {
  eventoId: string;
  cliente: string;
  fechaHoraInicio: string;
  estado: EstadoEvento;
  cotizacionId: string | null;
  valorTotal: number;
  totalPagado: number;
  saldoPendiente: number;
  pagadoTotalmente: boolean;
}

export interface AnticipoPeriodoResponse {
  anticipoId: string;
  eventoId: string;
  cliente: string;
  cotizacionId: string;
  valor: number;
  metodoPago: string;
  fechaPago: string;
}

export interface AnticiposPorMetodoResponse {
  metodoPago: string;
  cantidad: number;
  total: number;
}

export interface ReporteAnticiposResponse {
  desde: string;
  hasta: string;
  cantidad: number;
  totalRecaudado: number;
  porMetodo: AnticiposPorMetodoResponse[];
  anticipos: AnticipoPeriodoResponse[];
}

export interface DemandaSalonResponse {
  salonId: string;
  salon: string;
  totalReservas: number;
  totalEventos: number;
  totalInvitados: number;
}
