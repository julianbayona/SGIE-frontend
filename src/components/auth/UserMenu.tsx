import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatShortId } from '@/utils/formatters';

const rolLabels: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  TESORERO: 'Tesorero',
  JEFE_MESA: 'Jefe de Mesa',
};

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Obtener iniciales del nombre
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ?? '';
    const second = parts[1] ?? '';
    if (first && second) {
      return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
      >
        {/* Avatar con iniciales */}
        <div className="w-10 h-10 rounded-full bg-primary-gold text-white flex items-center justify-center font-bold text-sm">
          {getInitials(user.nombre)}
        </div>

        {/* Información del usuario */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-on-surface">{user.nombre}</p>
          <p className="text-xs text-on-surface-variant">{rolLabels[user.rol] || user.rol}</p>
        </div>

        {/* Icono de dropdown */}
        <span className="material-symbols-outlined text-on-surface-variant">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-lg shadow-xl border border-border py-2 z-50">
          {/* Información del usuario */}
          <div className="px-4 py-3 border-b border-outline-variant/20">
            <p className="text-sm font-semibold text-on-surface">{user.nombre}</p>
            <p className="text-xs text-on-surface-variant mt-1">{rolLabels[user.rol] || user.rol}</p>
            <p className="text-xs text-on-surface-variant mt-1">ID: {formatShortId(user.usuarioId, 'USR-')}</p>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navegar a perfil
              }}
              className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Mi perfil
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navegar a configuración
              }}
              className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              Configuración
            </button>
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-outline-variant/20 pt-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
