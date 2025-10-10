import React, { useState } from 'react';
import BackHomeButton from '../components/BackHomeButton';
import { getByCategoria } from '../services/BusquedaCategoria';
import './PageStyles.css';

const Categoria = () => {
    const [searchId, setSearchId] = useState('');
    const [results, setResults] = useState(null);
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

    // Helper para obtener la fecha desde distintos nombres de campo
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
            const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
            if (dmy) {
                const [, dd, mm, yyyy] = dmy;
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
            const ymd = s.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
            if (ymd) {
                const [, yyyy, mm, dd] = ymd;
                return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
            const parsed = new Date(s);
            if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
            return s;
        };

        return parseToISO(raw);
    };

    // Función para buscar por categoría
    const handleSearch = async () => {
        if (!searchId.trim()) {
            setError('Por favor ingresa una categoria valida');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByCategoria(searchId);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Limpiar resultados
    const handleClear = () => {
        setResults(null);
        setError('');
        setSearchId('');
    };

    return (
        <div className="page-container">
            <BackHomeButton />
            <div className="page-header">
                <h1>Búsqueda por Categoría</h1>
                <p>Busca todos los registros que pertenecen a una categoría específica.</p>
            </div>

            <div className="search-section">
                <div className="search-row">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Ingresa alguna categoría válida"
                        className="search-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="search-button"
                    >
                        {loading ? 'Buscando...' : 'Buscar por Categoría'}
                    </button>
                </div>

                <div className="button-row">
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
                    <p>Buscando registros...</p>
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h3>
                        Resultados de Búsqueda por Categoría
                    </h3>
                    <p className="search-info">
                        Categoria buscada: <strong>{searchId}</strong> |
                        Registros encontrados: <strong>{results.data?.length || 0}</strong>
                    </p>

                    {results.data && results.data.length > 0 ? (
                        <div className="results-grid">
                            {results.data.map((record, index) => (
                                <div key={record.id || record.id_post || index} className="result-card">
                                    <div className="result-header">
                                        <span className="result-id">ID: {record.id || record.id_post}</span>
                                        <span className="result-date">{getDate(record)}</span>
                                    </div>
                                    <h4>{record.titulo}</h4>
                                    <div className="result-details">
                                        <p><strong>Editor:</strong> {record.editor}</p>
                                        <p><strong>Categoría:</strong> {record.categoria}</p>
                                        <p><strong>Formato:</strong> {record.formato}</p>
                                        <p><strong>Hora:</strong> {record.hora || record.HORA}</p>
                                        <p><strong>Versión:</strong> {record.version || record.VERSION}</p>
                                    </div>

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
                    ) : (
                        <div className="no-results">
                            <p>No se encontraron registros para la categoría: {searchId}</p>
                            <p>Verifica que la categoría sea correcta y que existan registros para esta categoría.</p>
                        </div>
                    )}

                    <div className="results-summary">
                        <div className="summary-stats">
                            <p><strong>Resumen de la búsqueda:</strong></p>
                            <p>Tipo: Categoría</p>
                            <p>ID buscado: {searchId}</p>
                            <p>Resultados: {results.data?.length || 0} registros</p>
                        </div>

                        {results.data && results.data.length > 0 && (
                            <div className="summary-breakdown">
                                <p><strong>Desglose por fecha:</strong></p>
                                {/* Agrupar por fecha para mostrar estadísticas */}
                                {(() => {
                                    const dateGroups = {};
                                    results.data.forEach(record => {
                                        const date = getDate(record);
                                        dateGroups[date] = (dateGroups[date] || 0) + 1;
                                    });
                                    return Object.entries(dateGroups)
                                        .sort(([a], [b]) => new Date(b) - new Date(a))
                                        .slice(0, 5) // Mostrar solo las 5 fechas más recientes
                                        .map(([date, count]) => (
                                            <span key={date} className="date-stat">
                                                {date}: {count} registro{count > 1 ? 's' : ''}
                                            </span>
                                        ));
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Categoria;
