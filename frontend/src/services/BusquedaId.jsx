import api from "./apiConfig";

// Función para buscar un registro por ID
export async function getId(id) {
    try {
        // Validar que el ID sea proporcionado
        if (!id) {
            throw new Error('El ID es requerido');
        }

        // Hacer petición al backend
        const response = await api.get(`/api/backup/${id}`);

        console.log('Registro encontrado:', response.data);
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

// Función para obtener todos los registros de badabun
export async function getBada() {
    try {
        // Obtener lista de registros desde la nueva ruta /api/backup
        const response = await api.get('/api/backup');

        console.log('Todos los registros:', response.data);
        return response.data;

    } catch (error) {
        if (error.response) {
            console.error('Error del servidor:', error.response.data.message);
            throw new Error(error.response.data.message);
        } else if (error.request) {
            console.error('Error de conexión:', error.message);
            throw new Error('No se pudo conectar con el servidor');
        } else {
            console.error('Error:', error.message);
            throw new Error(error.message);
        }
    }
}

// Ejemplo de uso (puedes comentar o eliminar esto)
// Llamar a getBada para obtener todos los registros
// getBada();