import apiClient from './client';

export type RolUsuario = 'ADMINISTRADOR' | 'GERENTE' | 'TESORERO' | 'JEFE_MESA';

export interface LoginRequest {
  nombre: string;
  contrasena: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  expiresAt: string; // ISO 8601
  usuarioId: string;
  nombre: string;
  rol: RolUsuario;
}

export interface UsuarioAutenticado {
  usuarioId: string;
  nombre: string;
  rol: RolUsuario;
  tokenExpiraEn: string; // ISO 8601
}

const authApi = {
  /** Inicia sesión con nombre de usuario y contraseña */
  login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data);
  },

  /** Obtiene la información del usuario autenticado actual */
  me(): Promise<UsuarioAutenticado> {
    return apiClient.get<UsuarioAutenticado>('/auth/me').then((r) => r.data);
  },
};

export default authApi;
