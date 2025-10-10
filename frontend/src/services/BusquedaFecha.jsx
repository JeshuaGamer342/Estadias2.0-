import api from "./apiConfig";

// Función para buscar registros por fecha específica
export async function getByFecha(fecha) {
    try {
        // Validar que la fecha sea proporcionada
        if (!fecha) {
            throw new Error('La fecha es requerida');
        }

        // Validar formato de fecha (YYYY-MM-DD)
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha)) {
            throw new Error('La fecha debe estar en formato YYYY-MM-DD');
        }

        // Hacer petición al backend
        const response = await api.get(`/api/buscar/fecha/${fecha}`);

        console.log('Registros encontrados por fecha:', response.data);
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

// Función para buscar registros por rango de fechas
export async function getByRangoFechas(fechaDesde, fechaHasta) {
    try {
        // Validar que ambas fechas sean proporcionadas
        if (!fechaDesde || !fechaHasta) {
            throw new Error('Ambas fechas (desde y hasta) son requeridas');
        }

        // Validar formato de fecha (YYYY-MM-DD)
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaDesde) || !fechaRegex.test(fechaHasta)) {
            throw new Error('Las fechas deben estar en formato YYYY-MM-DD');
        }

        // Validar que la fecha desde sea anterior a la fecha hasta
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            throw new Error('La fecha desde debe ser anterior a la fecha hasta');
        }

        // Hacer petición al backend
        const response = await api.get(`/api/buscar/fechas?desde=${fechaDesde}&hasta=${fechaHasta}`);

        console.log('Registros encontrados por rango de fechas:', response.data);
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

// Función para buscar registros desde una fecha específica hasta hoy
export async function getByFechaDesde(fechaDesde) {
    try {
        if (!fechaDesde) {
            throw new Error('La fecha desde es requerida');
        }

        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaDesde)) {
            throw new Error('La fecha debe estar en formato YYYY-MM-DD');
        }

        // Obtener fecha actual en formato YYYY-MM-DD
        const fechaHoy = new Date().toISOString().split('T')[0];

        // Usar la función de rango de fechas
        return await getByRangoFechas(fechaDesde, fechaHoy);

    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message);
    }
}

// Función para buscar registros desde una fecha específica hacia atrás
export async function getByFechaHasta(fechaHasta) {
    try {
        if (!fechaHasta) {
            throw new Error('La fecha hasta es requerida');
        }

        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaHasta)) {
            throw new Error('La fecha debe estar en formato YYYY-MM-DD');
        }

        // Usar una fecha muy antigua como punto de inicio
        const fechaInicio = '2020-01-01';

        // Usar la función de rango de fechas
        return await getByRangoFechas(fechaInicio, fechaHasta);

    } catch (error) {
        console.error('Error:', error.message);
        throw new Error(error.message);
    }
}

// Ejemplos de uso (puedes comentar o eliminar esto)
// getByFecha('2023-09-23');
// getByRangoFechas('2023-01-01', '2023-12-31');
// getByFechaDesde('2023-06-01');
// getByFechaHasta('2023-09-23');