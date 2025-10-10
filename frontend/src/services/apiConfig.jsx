import axios from "axios";

// Configuración base usando variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Crear instancia de axios configurada
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 segundos de timeout
    withCredentials: false, // cambiar a true si usas cookies/sesión
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Solo mostrar errores en desarrollo
        if (import.meta.env.DEV) {
            console.error('API Error:', error);
        }
        return Promise.reject(error);
    }
);

// Exportar la instancia configurada y la URL base
export { api, API_BASE_URL };
export default api;