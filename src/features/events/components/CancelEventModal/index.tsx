import React, { useEffect, useState } from 'react';

interface CancelEventModalProps {
  open: boolean;
  eventTitle: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

const CancelEventModal: React.FC<CancelEventModalProps> = ({
  open,
  eventTitle,
  submitting,
  error,
  onClose,
  onConfirm,
}) => {
  const [motivo, setMotivo] = useState('');
  const motivoLimpio = motivo.trim();
  const canSubmit = Boolean(motivoLimpio) && !submitting;

  useEffect(() => {
    if (!open) {
      setMotivo('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-100 bg-white shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Accion irreversible
              </p>
              <h3 className="mt-1 text-2xl font-display font-bold text-on-surface">
                Cancelar evento
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                {eventTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full p-1.5 text-on-surface-variant hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Al confirmar, el evento pasara a Cancelado. Tambien se desactualizaran cotizaciones vigentes,
            se cancelaran pruebas de plato, recordatorios pendientes y sincronizaciones de Google Calendar.
          </div>

          <label className="block text-sm font-bold text-on-surface">
            Motivo de cancelacion
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              rows={5}
              maxLength={500}
              disabled={submitting}
              autoFocus
              placeholder="Ejemplo: El cliente solicito cancelar por cambio de fecha."
              className="mt-2 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal text-on-surface outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-on-surface-variant">
              Este motivo quedara guardado en el historial del evento.
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              {motivo.length}/500
            </span>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-3 border-t border-border px-6 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <p className="hidden text-xs text-on-surface-variant sm:block">
            {motivoLimpio ? 'Listo para cancelar.' : 'Escribe un motivo para habilitar la cancelacion.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-bold text-text2 hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => onConfirm(motivoLimpio)}
            disabled={!canSubmit}
            className="rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
            style={{
              minWidth: '150px',
              border: canSubmit ? '1px solid #b91c1c' : '1px solid #fecaca',
              backgroundColor: canSubmit ? '#dc2626' : '#fef2f2',
              color: canSubmit ? '#ffffff' : '#991b1b',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.55,
            }}
          >
            {submitting ? 'Cancelando...' : 'Cancelar evento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelEventModal;
