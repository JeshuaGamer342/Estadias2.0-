import api from "./apiConfig";

// ============= BÚSQUEDAS POR LLAVES FORÁNEAS =============

// Función para buscar registros por categoría
export async function getByCategoria(categoriaId) {
    try {
        if (!categoriaId) {
            throw new Error('El ID de categoría es requerido');
        }
        const response = await api.get(`/api/buscar/categoria/${categoriaId}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por categoría');
    }
}

// Función para buscar registros por editor
export async function getByEditor(editorId) {
    try {
        if (!editorId) {
            throw new Error('El ID de editor es requerido');
        }
        const response = await api.get(`/api/buscar/editor/${editorId}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por editor');
    }
}

// Función para buscar registros por formato
export async function getByFormato(formatoId) {
    try {
        if (!formatoId) {
            throw new Error('El ID de formato es requerido');
        }
        const response = await api.get(`/api/buscar/formato/${formatoId}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por formato');
    }
}

// ============= BÚSQUEDAS POR FECHA =============

// Función para buscar registros por fecha específica
export async function getByFecha(fecha) {
    try {
        if (!fecha) {
            throw new Error('La fecha es requerida');
        }
        validateDateFormat(fecha);
        const response = await api.get(`/api/buscar/fecha/${fecha}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por fecha');
    }
}

// Función para buscar registros por rango de fechas
export async function getByRangoFechas(fechaDesde, fechaHasta) {
    try {
        if (!fechaDesde || !fechaHasta) {
            throw new Error('Ambas fechas (desde y hasta) son requeridas');
        }
        validateDateFormat(fechaDesde);
        validateDateFormat(fechaHasta);
        validateDateRange(fechaDesde, fechaHasta);

        const response = await api.get(`/api/buscar/fechas?desde=${fechaDesde}&hasta=${fechaHasta}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por rango de fechas');
    }
}

// ============= BÚSQUEDAS POR PALABRA CLAVE =============

// Función para buscar registros por palabra clave (keyword)
export async function getByKeyword(keyword) {
    try {
        if (!keyword) {
            throw new Error('La palabra clave es requerida');
        }
        if (keyword.trim().length < 2) {
            throw new Error('La palabra clave debe tener al menos 2 caracteres');
        }

        const response = await api.get(`/api/buscar/keyword/${encodeURIComponent(keyword)}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al buscar por palabra clave');
    }
}

// ============= BÚSQUEDA AVANZADA =============

// Función para búsqueda avanzada con múltiples filtros
// La función getBusquedaAvanzada fue removida por petición del usuario.

// ============= FUNCIONES AUXILIARES =============

// Función para validar formato de fecha
function validateDateFormat(fecha) {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
        throw new Error('La fecha debe estar en formato YYYY-MM-DD');
    }
}

// Función para validar rango de fechas
function validateDateRange(fechaDesde, fechaHasta) {
    if (new Date(fechaDesde) > new Date(fechaHasta)) {
        throw new Error('La fecha desde debe ser anterior a la fecha hasta');
    }
}

// Función para manejar errores de manera consistente
function handleError(error, contextMessage) {
    if (error.response) {
        console.error(`${contextMessage} - Error del servidor:`, error.response.data.message);
        throw new Error(error.response.data.message);
    } else if (error.request) {
        console.error(`${contextMessage} - Error de conexión:`, error.message);
        throw new Error('No se pudo conectar con el servidor');
    } else {
        console.error(`${contextMessage}:`, error.message);
        throw new Error(error.message);
    }
}

// ============= FUNCIONES DE UTILIDAD =============

// Función para obtener fecha actual en formato YYYY-MM-DD
export function getFechaActual() {
    return new Date().toISOString().split('T')[0];
}

// Función para obtener fecha de hace X días
export function getFechaHaceXDias(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().split('T')[0];
}

// Función para formatear fecha para mostrar
export function formatearFecha(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============= EJEMPLOS DE USO =============

// Ejemplos comentados - puedes descomentarlos para probar
/*
// Buscar por categoría
getByCategoria(1).then(data => console.log('Categoría 1:', data));

// Buscar por fecha
getByFecha('2023-09-23').then(data => console.log('Fecha específica:', data));

// Buscar por rango de fechas
getByRangoFechas('2023-01-01', '2023-12-31').then(data => console.log('Rango:', data));

// Buscar por palabra clave
getByKeyword('tutorial').then(data => console.log('Keyword:', data));

// Búsqueda avanzada
getBusquedaAvanzada({
    categoria: 1,
    keyword: 'gaming',
    fechaDesde: '2023-01-01',
    fechaHasta: '2023-12-31'
}).then(data => console.log('Avanzada:', data));
*/