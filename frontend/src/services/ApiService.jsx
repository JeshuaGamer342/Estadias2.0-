import { api } from "./apiConfig";

// Configuración base ya está en apiConfig.jsx
// Usar la instancia compartida en lugar de crear una nueva

// ===== FUNCIONES PARA TODAS LAS APIS DISPONIBLES =====

/**
 * 1. BÚSQUEDA POR ID
 * Busca un registro específico por ID en la tabla 'backup'
 */
export async function buscarPorId(id) {
    try {
        if (!id) {
            throw new Error('El ID es requerido');
        }

        const response = await api.get(`/api/backup/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'búsqueda por ID');
    }
}

/**
 * 2. LISTAR TODOS LOS REGISTROS
 * Lista registros de la tabla 'backup' con límite opcional
 */
export async function listarTodosLosRegistros(limit = 100) {
    try {
        const response = await api.get(`/api/backup?limit=${limit}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'listar todos los registros');
    }
}

/**
 * 3. BÚSQUEDA POR FECHA ESPECÍFICA
 * Busca registros por una fecha específica (YYYY-MM-DD)
 */
export async function buscarPorFecha(fecha) {
    try {
        if (!fecha) {
            throw new Error('La fecha es requerida');
        }

        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha)) {
            throw new Error('La fecha debe estar en formato YYYY-MM-DD');
        }

        const response = await api.get(`/api/buscar/fecha/${fecha}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'búsqueda por fecha');
    }
}

/**
 * 4. BÚSQUEDA POR RANGO DE FECHAS
 * Busca registros entre dos fechas, con opción de exportar CSV
 */
export async function buscarPorRangoFechas(fechaDesde, fechaHasta, format = 'json') {
    try {
        if (!fechaDesde || !fechaHasta) {
            throw new Error('Ambas fechas (desde y hasta) son requeridas');
        }

        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaDesde) || !fechaRegex.test(fechaHasta)) {
            throw new Error('Las fechas deben estar en formato YYYY-MM-DD');
        }

        // Validar que la fecha desde sea anterior a la fecha hasta
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            throw new Error('La fecha desde debe ser anterior a la fecha hasta');
        }

        const url = `/api/buscar/fechas?desde=${fechaDesde}&hasta=${fechaHasta}`;
        const finalUrl = format === 'csv' ? `${url}&format=csv` : url;

        const response = await api.get(finalUrl);

        if (format === 'csv') {
            return {
                type: 'csv',
                data: response.data,
                filename: `backup_${fechaDesde}_to_${fechaHasta}.csv`
            };
        }

        return response.data;
    } catch (error) {
        handleApiError(error, 'búsqueda por rango de fechas');
    }
}

/**
 * 5. BÚSQUEDA POR PALABRA CLAVE
 * Busca en títulos usando la función busqueda_titulo
 */
export async function buscarPorKeyword(keyword) {
    try {
        if (!keyword) {
            throw new Error('La palabra clave es requerida');
        }

        // Limpiar la keyword
        const cleanKeyword = keyword.trim();
        if (cleanKeyword.length < 2) {
            throw new Error('La palabra clave debe tener al menos 2 caracteres');
        }

        const response = await api.get(`/api/buscar/keyword/${encodeURIComponent(cleanKeyword)}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'búsqueda por palabra clave');
    }
}

/**
 * 6. BÚSQUEDA POR CATEGORÍA
 * Busca por categoría usando la función busqueda_categoria
 */
export async function buscarPorCategoria(categoria) {
    try {
        if (!categoria) {
            throw new Error('La categoría es requerida');
        }

        const cleanCategoria = categoria.trim();
        const response = await api.get(`/api/buscar/categoria/${encodeURIComponent(cleanCategoria)}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'búsqueda por categoría');
    }
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Función helper para buscar desde una fecha hasta hoy
 */
export async function buscarDesdeHoy(fechaDesde) {
    const fechaHoy = new Date().toISOString().split('T')[0];
    return buscarPorRangoFechas(fechaDesde, fechaHoy);
}

/**
 * Función helper para buscar desde una fecha muy antigua hasta una fecha específica
 */
export async function buscarHastaFecha(fechaHasta) {
    const fechaInicio = '2020-01-01';
    return buscarPorRangoFechas(fechaInicio, fechaHasta);
}

/**
 * Búsqueda combinada: permite buscar por múltiples criterios
 */
export async function busquedaCombinada(criterios) {
    try {
        const { id, fecha, fechaDesde, fechaHasta, keyword, categoria, limit } = criterios;

        // Priorizar por especificidad: ID > fecha específica > rango > keyword > categoría > todos
        if (id) {
            return await buscarPorId(id);
        }

        if (fecha) {
            return await buscarPorFecha(fecha);
        }

        if (fechaDesde && fechaHasta) {
            return await buscarPorRangoFechas(fechaDesde, fechaHasta);
        }

        if (fechaDesde) {
            return await buscarDesdeHoy(fechaDesde);
        }

        if (fechaHasta) {
            return await buscarHastaFecha(fechaHasta);
        }

        if (keyword) {
            return await buscarPorKeyword(keyword);
        }

        if (categoria) {
            return await buscarPorCategoria(categoria);
        }

        // Si no hay criterios específicos, listar todos
        return await listarTodosLosRegistros(limit);

    } catch (error) {
        handleApiError(error, 'búsqueda combinada');
    }
}

/**
 * Función para descargar CSV
 */
export async function descargarCSV(fechaDesde, fechaHasta) {
    try {
        const result = await buscarPorRangoFechas(fechaDesde, fechaHasta, 'csv');

        if (result.type === 'csv') {
            // Crear blob y descargar
            const blob = new Blob([result.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return { success: true, message: 'CSV descargado exitosamente' };
        }

        throw new Error('Error al generar CSV');
    } catch (error) {
        handleApiError(error, 'descarga de CSV');
    }
}

/**
 * Manejador centralizado de errores
 */
function handleApiError(error, operacion) {
    let errorMessage = `Error en ${operacion}`;

    if (error.response) {
        // El servidor respondió con un error
        console.error(`Error del servidor en ${operacion}:`, error.response.data);
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
    } else if (error.request) {
        // No se recibió respuesta del servidor
        console.error(`Error de conexión en ${operacion}:`, error.message);
        errorMessage = 'No se pudo conectar con el servidor';
    } else if (error.message) {
        // Otro tipo de error
        console.error(`Error en ${operacion}:`, error.message);
        errorMessage = error.message;
    } else {
        console.error(`Error desconocido en ${operacion}:`, error);
    }

    throw new Error(errorMessage);
}

// ===== FUNCIONES DE ESTADÍSTICAS Y UTILIDADES =====

/**
 * Obtener estadísticas básicas de la base de datos
 */
export async function obtenerEstadisticas() {
    try {
        // Obtener una muestra pequeña para calcular estadísticas básicas
        const response = await listarTodosLosRegistros(1000);
        const data = response.data || [];

        const stats = {
            totalRegistros: response.count || data.length,
            fechasMasRecientes: data.slice(0, 5).map(r => r.fecha),
            primeraFecha: data.length > 0 ? data[data.length - 1]?.fecha : null,
            ultimaFecha: data.length > 0 ? data[0]?.fecha : null,
        };

        return stats;
    } catch (error) {
        handleApiError(error, 'obtener estadísticas');
    }
}

/**
 * Validar conexión con el backend
 */
export async function validarConexion() {
    try {
        // Intentar obtener un registro pequeño para validar la conexión
        const response = await api.get('/api/backup?limit=1');

        const result = {
            success: true,
            message: 'Conexión exitosa con el backend',
            timestamp: new Date().toISOString(),
            apiUrl: api.defaults.baseURL,
            environment: import.meta.env.MODE
        };

        return result;
    } catch (error) {
        const result = {
            success: false,
            message: 'Error de conexión con el backend',
            error: error.message,
            timestamp: new Date().toISOString(),
            apiUrl: api.defaults.baseURL,
            environment: import.meta.env.MODE,
            details: {
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url
            }
        };

        return result;
    }
}

// Las funciones ya están exportadas individualmente arriba
// Exportamos solo la instancia de axios para uso directo si es necesario
export { api };

// Exportar por defecto un objeto con todas las funciones
export default {
    buscarPorId,
    listarTodosLosRegistros,
    buscarPorFecha,
    buscarPorRangoFechas,
    buscarPorKeyword,
    buscarPorCategoria,
    buscarDesdeHoy,
    buscarHastaFecha,
    busquedaCombinada,
    descargarCSV,
    obtenerEstadisticas,
    validarConexion,
    api
};