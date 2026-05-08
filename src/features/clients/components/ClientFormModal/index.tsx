import React, { useEffect, useMemo, useState } from 'react';
import type { Client, ClientCategory } from '@/features/clients/types';

export interface ClientFormValues {
  idNumber: string;
  fullName: string;
  category: ClientCategory;
  phone: string;
  email: string;
}

interface ClientFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialClient?: Client | null;
  idNumbersInUse: string[];
  onCancel: () => void;
  onSubmit: (values: ClientFormValues) => void;
}

const getEmptyForm = (): ClientFormValues => ({
  idNumber: '',
  fullName: '',
  category: 'Socio',
  phone: '',
  email: '',
});

const normalizeId = (value: string): string => value.replace(/[^\d]/g, '');

const inputClass =
  'w-full bg-white border border-border rounded-md px-3 py-2.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold/20 disabled:bg-stone-100 disabled:text-stone-500';

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  mode,
  initialClient,
  idNumbersInUse,
  onCancel,
  onSubmit,
}) => {
  const [form, setForm] = useState<ClientFormValues>(getEmptyForm);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === 'edit' && initialClient) {
      setForm({
        idNumber: normalizeId(initialClient.idNumber),
        fullName: initialClient.fullName,
        category: initialClient.category,
        phone: initialClient.phone,
        email: initialClient.email,
      });
      return;
    }

    setForm(getEmptyForm());
  }, [initialClient, isOpen, mode]);

  const normalizedId = useMemo(() => normalizeId(form.idNumber), [form.idNumber]);
  const isDuplicateId = useMemo(() => {
    if (!normalizedId || mode === 'edit') {
      return false;
    }

    return idNumbersInUse.includes(normalizedId);
  }, [idNumbersInUse, mode, normalizedId]);

  const isSubmitDisabled =
    !normalizedId || !form.fullName.trim() || !form.phone.trim() || isDuplicateId;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[1.5px] h-full w-full flex items-center justify-center p-4 md:p-8 overflow-hidden"
      onClick={(eventTarget) => {
        if (eventTarget.target === eventTarget.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-xl mx-auto overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-xl font-display font-bold text-text1">
            {mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
          <p className="text-sm text-text3 mt-1">Datos requeridos para solicitudes, cotizaciones y notificaciones.</p>
        </div>

        <div className="p-6 space-y-5">
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text3">Identificación</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text2 mb-2">Cédula *</label>
                <input
                  className={inputClass}
                  type="text"
                  inputMode="numeric"
                  placeholder="Sin puntos ni comas"
                  value={form.idNumber}
                  disabled={mode === 'edit'}
                  onChange={(eventTarget) => {
                    setForm((prev) => ({
                      ...prev,
                      idNumber: normalizeId(eventTarget.target.value),
                    }));
                  }}
                />
                <p className="text-xs mt-2 text-text3">
                  {mode === 'edit' ? 'La cédula no se edita porque identifica al cliente.' : 'Se valida duplicidad por cédula.'}
                </p>
                {isDuplicateId ? (
                  <p className="text-xs mt-1 text-red font-semibold">Esta cédula ya existe en el sistema.</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-text2 mb-2">Nombre completo *</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Nombres y apellidos"
                  value={form.fullName}
                  onChange={(eventTarget) => {
                    setForm((prev) => ({
                      ...prev,
                      fullName: eventTarget.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text3">Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text2 mb-2">Tipo *</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(eventTarget) => {
                    setForm((prev) => ({
                      ...prev,
                      category: eventTarget.target.value as ClientCategory,
                    }));
                  }}
                >
                  <option value="Socio">Socio</option>
                  <option value="No Socio">No Socio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text2 mb-2">Teléfono *</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Número WhatsApp"
                  value={form.phone}
                  onChange={(eventTarget) => {
                    setForm((prev) => ({
                      ...prev,
                      phone: eventTarget.target.value,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text2 mb-2">Correo electrónico</label>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(eventTarget) => {
                    setForm((prev) => ({
                      ...prev,
                      email: eventTarget.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-border bg-stone-50 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-text2 hover:bg-hover"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bg-gold text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-gold-d disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isSubmitDisabled}
            onClick={() => {
              onSubmit({
                ...form,
                idNumber: normalizedId,
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
              });
            }}
          >
            Guardar cliente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFormModal;
