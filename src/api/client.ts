import axios, { AxiosError } from 'axios';

const apiBaseHost =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL ??
  'http://localhost:8080';

export const API_BASE_URL = `${apiBaseHost}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de petición: agrega el token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('sgie_access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: normaliza errores del backend
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ mensaje?: string; message?: string; errors?: Record<string, string> }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Log en consola para depuración — muestra el cuerpo exacto del error del backend
    if (error.response) {
      console.error(`[API ${status}]`, error.config?.url, JSON.stringify(data));
    }

    let message = 'Error inesperado. Intenta de nuevo.';

    // Manejar error 401 (No autorizado)
    if (status === 401) {
      message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      // Limpiar token del localStorage
      localStorage.removeItem('sgie_access_token');
      localStorage.removeItem('sgie_token_expiry');
      // Redirigir al login (se puede mejorar con un evento)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Manejar error 403 (Prohibido)
    else if (status === 403) {
      message = 'No tienes permisos para realizar esta acción.';
    }
    // El backend devuelve { "mensaje": "...", "timestamp": "..." }
    else if (data?.mensaje) {
      message = data.mensaje;
    } else if (data?.message) {
      message = data.message;
    } else if (status === 404) {
      message = 'Recurso no encontrado.';
    } else if (status === 400) {
      message = 'Datos inválidos. Revisa el formulario.';
    } else if (status === 409) {
      message = 'Conflicto: el recurso ya existe o hay un solapamiento.';
    } else if (status === 500) {
      message = 'Error interno del servidor.';
    } else if (!error.response) {
      message = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 8080.';
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
