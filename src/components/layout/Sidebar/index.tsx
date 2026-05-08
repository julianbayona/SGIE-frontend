import React from 'react';
import { NavLink } from 'react-router-dom';
import type { RolUsuario } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/', icon: 'calendar_month', label: 'Calendario', roles: ['ADMINISTRADOR', 'GERENTE', 'TESORERO'] },
  { to: '/events', icon: 'event_available', label: 'Eventos', roles: ['ADMINISTRADOR', 'GERENTE', 'TESORERO'] },
  { to: '/clients', icon: 'group', label: 'Clientes', roles: ['ADMINISTRADOR', 'GERENTE', 'TESORERO'] },
  { to: '/quotes', icon: 'description', label: 'Cotizaciones', roles: ['ADMINISTRADOR', 'GERENTE', 'TESORERO'] },
  { to: '/reports', icon: 'monitoring', label: 'Reportes', roles: ['ADMINISTRADOR', 'GERENTE', 'TESORERO'] },
  { to: '/users', icon: 'manage_accounts', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { to: '/catalogs', icon: 'settings', label: 'Catalogos', roles: ['ADMINISTRADOR'] },
] satisfies Array<{ to: string; icon: string; label: string; roles: RolUsuario[] }>;

const Sidebar: React.FC = () => {
  const { hasRole, user } = useAuth();
  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-black text-white flex flex-col z-40 border-r border-white/10">
      <div className="px-4 py-5">
        <div className="text-2xl font-display text-primary-gold leading-none">CB</div>
        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mt-1">SGIE</p>
      </div>

      <div className="px-4 py-2 mt-2">
        <p className="text-stone-500 text-[10px] uppercase tracking-widest font-medium">Gestion de eventos</p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded font-medium tracking-wide transition-colors duration-200 ${
                isActive
                  ? 'text-yellow-500 bg-white/10 font-bold border-r-4 border-yellow-600'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-yellow-500 font-bold">
            {(user?.nombre ?? 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-stone-200 text-xs font-bold truncate">{user?.nombre ?? 'Usuario'}</p>
            <p className="text-stone-500 text-[10px] truncate">{user?.rol ?? 'Sin rol'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
