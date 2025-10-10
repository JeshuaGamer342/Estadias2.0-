import api from "./apiConfig";

// Función para buscar registros por categoría
export async function getByCategoria(categoriaId) {
    try {
        // Validar que el ID de categoría sea proporcionado
        if (!categoriaId) {
            throw new Error('El ID de categoría es requerido');
        }

        // Hacer petición al backend
        const response = await api.get(`/api/buscar/categoria/${categoriaId}`);

        console.log('Registros encontrados por categoría:', response.data);
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

// Función para buscar registros por editor
export async function getByEditor(editorId) {
    try {
        if (!editorId) {
            throw new Error('El ID de editor es requerido');
        }

        const response = await api.get(`/api/buscar/editor/${editorId}`);

        console.log('Registros encontrados por editor:', response.data);
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

// Función para buscar registros por formato
export async function getByFormato(formatoId) {
    try {
        if (!formatoId) {
            throw new Error('El ID de formato es requerido');
        }

        const response = await api.get(`/api/buscar/formato/${formatoId}`);

        console.log('Registros encontrados por formato:', response.data);
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
// getByCategoria(1);
// getByEditor(3);
// getByFormato(4);