import { useState, useCallback } from 'react';
import ApiService from '../services/ApiService';

/**
 * Hook personalizado para manejar todas las consultas a APIs de base de datos
 * Proporciona estado de loading, error, resultados y funciones para ejecutar consultas
 */
export const useDatabase = () => {
    const [state, setState] = useState({
        loading: false,
        error: null,
        resultados: null,
        estadisticas: null,
        conexion: null
    });

    // Función para actualizar el estado
    const updateState = useCallback((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Función para limpiar errores y resultados
    const limpiar = useCallback(() => {
        updateState({ error: null, resultados: null });
    }, [updateState]);

    // Función genérica para ejecutar consultas
    const ejecutarConsulta = useCallback(async (consultaFn, params = {}) => {
        updateState({ loading: true, error: null, resultados: null });

        try {
            const resultado = await consultaFn(params);
            updateState({
                loading: false,
                resultados: {
                    data: resultado,
                    timestamp: new Date().toISOString(),
                    params
                }
            });
            return resultado;
        } catch (error) {
            updateState({
                loading: false,
                error: error.message
            });
            throw error;
        }
    }, [updateState]);

    // Funciones específicas para cada tipo de consulta
    const consultas = {
        // Buscar por ID
        buscarPorId: useCallback(async (id) => {
            return ejecutarConsulta(() => ApiService.buscarPorId(id), { id });
        }, [ejecutarConsulta]),

        // Listar todos los registros
        listarTodos: useCallback(async (limit = 100) => {
            return ejecutarConsulta(() => ApiService.listarTodosLosRegistros(limit), { limit });
        }, [ejecutarConsulta]),

        // Buscar por fecha específica
        buscarPorFecha: useCallback(async (fecha) => {
            return ejecutarConsulta(() => ApiService.buscarPorFecha(fecha), { fecha });
        }, [ejecutarConsulta]),

        // Buscar por rango de fechas
        buscarPorRango: useCallback(async (fechaDesde, fechaHasta, format = 'json') => {
            return ejecutarConsulta(() =>
                ApiService.buscarPorRangoFechas(fechaDesde, fechaHasta, format),
                { fechaDesde, fechaHasta, format }
            );
        }, [ejecutarConsulta]),

        // Buscar por palabra clave
        buscarPorKeyword: useCallback(async (keyword) => {
            return ejecutarConsulta(() => ApiService.buscarPorKeyword(keyword), { keyword });
        }, [ejecutarConsulta]),

        // Buscar por categoría
        buscarPorCategoria: useCallback(async (categoria) => {
            return ejecutarConsulta(() => ApiService.buscarPorCategoria(categoria), { categoria });
        }, [ejecutarConsulta]),

        // Búsqueda combinada
        busquedaCombinada: useCallback(async (criterios) => {
            return ejecutarConsulta(() => ApiService.busquedaCombinada(criterios), criterios);
        }, [ejecutarConsulta]),

        // Descargar CSV
        descargarCSV: useCallback(async (fechaDesde, fechaHasta) => {
            updateState({ loading: true, error: null });
            try {
                const resultado = await ApiService.descargarCSV(fechaDesde, fechaHasta);
                updateState({ loading: false });
                return resultado;
            } catch (error) {
                updateState({ loading: false, error: error.message });
                throw error;
            }
        }, [updateState])
    };

    // Funciones de utilidad
    const utilidades = {
        // Verificar conexión
        verificarConexion: useCallback(async () => {
            try {
                const resultado = await ApiService.validarConexion();
                updateState({ conexion: resultado });
                return resultado;
            } catch (error) {
                const errorResult = {
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                };
                updateState({ conexion: errorResult });
                return errorResult;
            }
        }, [updateState]),

        // Cargar estadísticas
        cargarEstadisticas: useCallback(async () => {
            try {
                const stats = await ApiService.obtenerEstadisticas();
                updateState({ estadisticas: stats });
                return stats;
            } catch (error) {
                console.warn('No se pudieron cargar las estadísticas:', error.message);
                return null;
            }
        }, [updateState]),

        // Limpiar todo el estado
        limpiarTodo: useCallback(() => {
            setState({
                loading: false,
                error: null,
                resultados: null,
                estadisticas: null,
                conexion: null
            });
        }, [])
    };

    return {
        // Estado
        ...state,

        // Funciones de consulta
        ...consultas,

        // Utilidades
        ...utilidades,

        // Función de limpieza
        limpiar
    };
};

/**
 * Hook para manejar formularios de búsqueda
 */
export const useSearchForm = (initialValues = {}) => {
    const [formData, setFormData] = useState({
        id: '',
        fecha: '',
        fechaDesde: '',
        fechaHasta: '',
        keyword: '',
        categoria: '',
        limit: 100,
        ...initialValues
    });

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const updateMultipleFields = useCallback((updates) => {
        setFormData(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            id: '',
            fecha: '',
            fechaDesde: '',
            fechaHasta: '',
            keyword: '',
            categoria: '',
            limit: 100,
            ...initialValues
        });
    }, [initialValues]);

    const validateField = useCallback((field, value) => {
        switch (field) {
            case 'fecha':
            case 'fechaDesde':
            case 'fechaHasta':
                const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
                return fechaRegex.test(value) || !value;

            case 'keyword':
                return !value || value.trim().length >= 2;

            case 'categoria':
                return !value || value.trim().length >= 1;

            case 'id':
                return !value || value.trim().length >= 1;

            case 'limit':
                const num = parseInt(value);
                return !isNaN(num) && num > 0 && num <= 1000;

            default:
                return true;
        }
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};

        Object.keys(formData).forEach(field => {
            if (!validateField(field, formData[field])) {
                switch (field) {
                    case 'fecha':
                    case 'fechaDesde':
                    case 'fechaHasta':
                        errors[field] = 'Formato de fecha inválido (YYYY-MM-DD)';
                        break;
                    case 'keyword':
                        errors[field] = 'La palabra clave debe tener al menos 2 caracteres';
                        break;
                    case 'categoria':
                        errors[field] = 'La categoría es requerida';
                        break;
                    case 'id':
                        errors[field] = 'El ID es requerido';
                        break;
                    case 'limit':
                        errors[field] = 'El límite debe ser un número entre 1 y 1000';
                        break;
                }
            }
        });

        return errors;
    }, [formData, validateField]);

    const isValid = useCallback((fields = []) => {
        if (fields.length === 0) return true;

        return fields.every(field => validateField(field, formData[field]));
    }, [formData, validateField]);

    return {
        formData,
        updateField,
        updateMultipleFields,
        resetForm,
        validateField,
        validateForm,
        isValid
    };
};

export default useDatabase;