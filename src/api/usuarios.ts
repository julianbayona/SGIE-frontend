import apiClient from './client';
import type { RolUsuario } from './auth';

export interface UsuarioResponse {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface CrearUsuarioRequest {
  nombre: string;
  contrasena: string;
  rol: RolUsuario;
}

const usuariosApi = {
  listar(): Promise<UsuarioResponse[]> {
    return apiClient.get<UsuarioResponse[]>('/usuarios').then((response) => response.data);
  },

  crear(data: CrearUsuarioRequest): Promise<UsuarioResponse> {
    return apiClient.post<UsuarioResponse>('/usuarios', data).then((response) => response.data);
  },

  activar(id: string): Promise<UsuarioResponse> {
    return apiClient.patch<UsuarioResponse>(`/usuarios/${id}/activar`).then((response) => response.data);
  },

  desactivar(id: string): Promise<UsuarioResponse> {
    return apiClient.patch<UsuarioResponse>(`/usuarios/${id}/desactivar`).then((response) => response.data);
  },
};

export default usuariosApi;
