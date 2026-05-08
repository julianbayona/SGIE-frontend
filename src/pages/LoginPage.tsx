import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();

  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !contrasena.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    try {
      setIsLoading(true);
      await login(nombre.trim(), contrasena);
      // Redirigir al dashboard después del login exitoso
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-surface-container to-surface-container-low px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-border p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-gold/10 mb-4">
              <span className="material-symbols-outlined text-4xl text-primary-gold">celebration</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-on-surface mb-2">
              SGIE Club Boyacá
            </h1>
            <p className="text-sm text-on-surface-variant">
              Sistema de Gestión Integral de Eventos
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nombre" className="block text-sm font-bold text-on-surface mb-2">
                Usuario
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                placeholder="Ingresa tu nombre de usuario"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-sm font-bold text-on-surface mb-2">
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-gold text-white rounded-lg px-6 py-3 text-sm font-bold shadow-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">login</span>
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-on-surface-variant">
              © 2026 Club Boyacá. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Información de roles (solo para desarrollo) */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-bold text-blue-900 mb-2">Roles disponibles:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>ADMINISTRADOR</strong>: Acceso completo al sistema</li>
            <li>• <strong>GERENTE</strong>: Gestión de eventos y cotizaciones</li>
            <li>• <strong>TESORERO</strong>: Gestión de pagos y finanzas</li>
            <li>• <strong>JEFE_MESA</strong>: Gestión de montajes y menús</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
