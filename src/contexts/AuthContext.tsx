import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authApi, { type AuthResponse, type UsuarioAutenticado, type RolUsuario } from '@/api/auth';

interface AuthContextType {
  user: UsuarioAutenticado | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nombre: string, contrasena: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: RolUsuario | RolUsuario[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'sgie_access_token';
const TOKEN_EXPIRY_KEY = 'sgie_token_expiry';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar token del localStorage al iniciar
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

        if (!storedToken || !storedExpiry) {
          setIsLoading(false);
          return;
        }

        // Verificar si el token ha expirado
        const expiryDate = new Date(storedExpiry);
        if (expiryDate <= new Date()) {
          // Token expirado
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
          setIsLoading(false);
          return;
        }

        // Token válido, cargar información del usuario
        setToken(storedToken);
        const userData = await authApi.me();
        setUser(userData);
      } catch (error) {
        console.error('Error al cargar autenticación:', error);
        // Si falla, limpiar el token
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (nombre: string, contrasena: string) => {
    try {
      const response: AuthResponse = await authApi.login({ nombre, contrasena });

      // Guardar token en localStorage
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, response.expiresAt);

      // Actualizar estado
      setToken(response.accessToken);
      setUser({
        usuarioId: response.usuarioId,
        nombre: response.nombre,
        rol: response.rol,
        tokenExpiraEn: response.expiresAt,
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);

    // Limpiar estado
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: RolUsuario | RolUsuario[]): boolean => {
    if (!user) return false;

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.rol);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Hook para obtener el token actual (útil para el interceptor de axios)
export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};
