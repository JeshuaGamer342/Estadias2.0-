import React, { useState, useEffect } from 'react';
import { getId, getBada } from '../services/BusquedaId';
import BackHomeButton from '../components/BackHomeButton';
import './PageStyles.css';

const Id = () => {
    const [searchId, setSearchId] = useState('');
    const [result, setResult] = useState(null);
    const [allRecords, setAllRecords] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Helper para formatear valores tipo VERDADERO/NO/true/false a Sí/No
    const formatBool = (val) => {
        if (val === null || val === undefined) return '';
        const s = String(val).trim().toLowerCase();
        if (s === 'verdadero' || s === 'true' || s === 'si' || s === 'sí') return 'Sí';
        if (s === 'no' || s === 'false') return 'No';
        return val;
    };

    // Helper para obtener la fecha desde distintos nombres de campo y normalizar a ISO YYYY-MM-DD
    const getDate = (obj) => {
        if (!obj) return '';
        const raw = obj.fecha_publicacion || obj.fecha || obj.FECHA || obj.Fecha || obj.fecha_publicada || '';
        if (!raw) return '';

        const parseToISO = (value) => {
            if (!value && value !== 0) return '';
            if (value instanceof Date) {
                if (isNaN(value)) return '';
                return value.toISOString().slice(0, 10);
            }
            const s = String(value).trim();
            // DD/MM/YYYY or DD-MM-YYYY
            const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
            if (dmy) {
                const [, dd, mm, yyyy] = dmy;
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
            // YYYY-MM-DD
            const ymd = s.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
            if (ymd) {
                const [, yyyy, mm, dd] = ymd;
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
            // Try Date parse fallback
            const parsed = new Date(s);
            if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
            return s; // devolver original si no se pudo parsear
        };

        return parseToISO(raw);
    };

    // Función para buscar por ID específico
    const handleSearchById = async () => {
        if (!searchId.trim()) {
            setError('Por favor ingresa un ID válido');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await getId(searchId);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener todos los registros
    const handleGetAllRecords = async () => {
        setLoading(true);
        setError('');
        setAllRecords(null);

        try {
            const data = await getBada();
            setAllRecords(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Limpiar resultados
    const handleClear = () => {
        setResult(null);
        setAllRecords(null);
        setError('');
        setSearchId('');
    };

    return (
        <div className="page-container">
            <BackHomeButton />
            <div className="page-header">
                <h1>Búsqueda por ID</h1>
                <p>Busca un registro específico por su ID o consulta todos los registros disponibles.</p>
            </div>

            <div className="search-section">
                <div className="search-row">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Ingresa el ID del registro"
                        className="search-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchById()}
                    />
                    <button
                        onClick={handleSearchById}
                        disabled={loading}
                        className="search-button"
                    >
                        {loading ? 'Buscando...' : 'Buscar por ID'}
                    </button>
                </div>

                <div className="button-row">
                    <button
                        onClick={handleGetAllRecords}
                        disabled={loading}
                        className="secondary-button"
                    >
                        {loading ? 'Cargando...' : 'Obtener Todos los Registros'}
                    </button>
                    <button
                        onClick={handleClear}
                        className="clear-button"
                    >
                        Limpiar Resultados
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <i className="error-icon">⚠️</i>
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Cargando...</p>
                </div>
            )}

            {result && (
                <div className="results-section">
                    <h3>Resultado de la Búsqueda por ID</h3>
                    <div className="result-card">
                        <div className="result-header">
                            <span className="result-id">ID: {result.data?.id_post}</span>
                            <span className="result-date">{getDate(result.data)}</span>
                        </div>

                        <h4>{result.data?.titulo}</h4>
                        <p><strong>Editor:</strong> {result.data?.editor}</p>
                        <p><strong>Categoría:</strong> {result.data?.categoria}</p>
                        <p><strong>Formato:</strong> {result.data?.formato}</p>
                        <p><strong>Hora:</strong> {result.data?.hora || result.data?.HORA}</p>
                        <p><strong>Versión:</strong> {result.data?.version || result.data?.VERSION}</p>

                        <div className="platform-flags">
                            <p><strong>YT:</strong> {formatBool(result.data?.yt || result.data?.YT)}</p>
                            <p><strong>IG:</strong> {formatBool(result.data?.ig || result.data?.IG)}</p>
                            <p><strong>TT:</strong> {formatBool(result.data?.tt || result.data?.TT)}</p>
                            <p><strong>TH:</strong> {formatBool(result.data?.th || result.data?.TH)}</p>
                            <p><strong>X:</strong> {formatBool(result.data?.x || result.data?.X)}</p>
                        </div>

                        {(result.data?.url || result.data?.link || result.data?.LINK) && (
                            <a
                                href={result.data?.url || result.data?.link || result.data?.LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="result-link"
                            >
                                Ver enlace
                            </a>
                        )}
                    </div>
                </div>
            )}

            {allRecords && (
                <div className="results-section">
                    <h3>Todos los Registros ({allRecords.data?.length || 0})</h3>
                    <div className="results-grid">
                        {allRecords.data?.map((record, index) => (
                            <div key={record.id_post || index} className="result-card">
                                <div className="result-header">
                                    <span className="result-id">ID: {record.id_post}</span>
                                    <span className="result-date">{getDate(record)}</span>
                                </div>
                                <h4>{record.titulo}</h4>
                                <p><strong>Editor:</strong> {record.editor}</p>
                                <p><strong>Categoria:</strong> {record.categoria}</p>
                                <p><strong>Formato:</strong> {record.formato}</p>
                                <p><strong>Hora:</strong> {record.hora || record.HORA}</p>
                                <p><strong>Versión:</strong> {record.version || record.VERSION}</p>

                                <div className="platform-flags">
                                    <p><strong>YT:</strong> {formatBool(record.yt || record.YT)}</p>
                                    <p><strong>IG:</strong> {formatBool(record.ig || record.IG)}</p>
                                    <p><strong>TT:</strong> {formatBool(record.tt || record.TT)}</p>
                                    <p><strong>TH:</strong> {formatBool(record.th || record.TH)}</p>
                                    <p><strong>X:</strong> {formatBool(record.x || record.X)}</p>
                                </div>

                                {(record.url || record.link || record.LINK) && (
                                    <a
                                        href={record.url || record.link || record.LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="result-link"
                                    >
                                        Ver enlace
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(result || allRecords) && (
                <div className="results-summary">
                    <p>
                        {result
                            ? `Se encontró 1 registro`
                            : `Se encontraron ${allRecords?.data?.length || 0} registros`
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default Id;
