import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
}

interface Toast extends Required<ToastInput> {
  id: string;
}

interface ToastContextValue {
  notify: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, { icon: string; bar: string; iconBox: string }> = {
  success: {
    icon: 'check_circle',
    bar: 'bg-green-600',
    iconBox: 'bg-green-100 text-green-800',
  },
  error: {
    icon: 'error',
    bar: 'bg-red-600',
    iconBox: 'bg-red-100 text-red-800',
  },
  info: {
    icon: 'info',
    bar: 'bg-[#A8841C]',
    iconBox: 'bg-[#f6efd5] text-[#A8841C]',
  },
};

const createToastId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, description = '', type = 'info' }: ToastInput) => {
      const id = createToastId();
      setToasts((current) => [...current.slice(-3), { id, title, description, type }]);
      window.setTimeout(() => removeToast(id), 4500);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (title, description) => notify({ title, description, type: 'success' }),
      error: (title, description) => notify({ title, description, type: 'error' }),
      info: (title, description) => notify({ title, description, type: 'info' }),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-20 z-[200] flex w-[min(92vw,390px)] flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];

          return (
            <div
              key={toast.id}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15"
              role="status"
              aria-live="polite"
            >
              <div className={`h-1.5 ${style.bar}`} />
              <div className="flex gap-3 p-4">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.iconBox}`}>
                  <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-stone-950">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm font-semibold leading-5 text-stone-600">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Cerrar notificacion"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }

  return context;
}
