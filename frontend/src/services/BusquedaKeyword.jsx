import axios from "axios";

// Función para buscar registros por palabra clave (keyword)
export async function getByKeyword(keyword) {
    try {
        // Validar que la palabra clave sea proporcionada
        if (!keyword) {
            throw new Error('La palabra clave es requerida');
        }

        // Validar que la palabra clave tenga al menos 2 caracteres
        if (keyword.trim().length < 2) {
            throw new Error('La palabra clave debe tener al menos 2 caracteres');
        }

        // Hacer petición al backend
        const response = await axios.get(`/api/buscar/keyword/${encodeURIComponent(keyword)}`);

        console.log('Registros encontrados por palabra clave:', response.data);
        return response.data;

    } catch (error) {
        if (error.response) {
            // El servidor respondió con un error
            console.error('Error del servidor:', error.response.data.message);
            throw new Error(error.response.data.message);
        } else if (error.request) {
            // No se recibió respuesta del servidor
            console.error('Error de conexión:', error.message);
            throw new Error('No se pudo conectar con el servidor');
        } else {
            // Otro tipo de error
            console.error('Error:', error.message);
            throw new Error(error.message);
        }
    }
}

// Función para búsqueda avanzada con múltiples filtros
// La función de búsqueda avanzada fue removida por petición del usuario.

// Función auxiliar para limpiar y validar keywords antes de buscar
export function sanitizeKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') {
        return '';
    }

    // Limpiar espacios extra y caracteres especiales problemáticos
    return keyword.trim().replace(/[<>]/g, '');
}

