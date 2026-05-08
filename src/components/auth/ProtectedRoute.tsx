import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { RolUsuario } from '@/api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: RolUsuario | RolUsuario[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary-gold animate-spin">
            progress_activity
          </span>
          <p className="mt-4 text-on-surface-variant">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requieren roles específicos, verificar
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-lg border border-border p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">block</span>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">
            Acceso Denegado
          </h2>
          <p className="text-on-surface-variant mb-6">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary-gold text-white rounded-lg px-6 py-3 text-sm font-bold hover:bg-primary transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos correctos
  return <>{children}</>;
};

export default ProtectedRoute;
