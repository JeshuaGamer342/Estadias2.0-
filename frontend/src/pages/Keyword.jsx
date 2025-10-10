import React, { useState } from 'react';
import BackHomeButton from '../components/BackHomeButton';
import { getByKeyword, sanitizeKeyword } from '../services/BusquedaKeyword';
import './PageStyles.css';

const Keyword = () => {
    const [keyword, setKeyword] = useState('');

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

    // Función para búsqueda simple por palabra clave
    const handleSimpleSearch = async () => {
        const cleanKeyword = sanitizeKeyword(keyword);
        if (!cleanKeyword || cleanKeyword.length < 2) {
            setError('Por favor ingresa una palabra clave válida (mínimo 2 caracteres)');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByKeyword(cleanKeyword);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    // Ejecutar búsqueda simple
    const handleSearch = () => {
        handleSimpleSearch();
    };
    // Limpiar resultados
    const handleClear = () => {
        setResults(null);
        setError('');
        setKeyword('');
    };

    // Obtener fecha de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="page-container">
            <BackHomeButton />
            <div className="page-header">
                <h1>Búsqueda por Palabra Clave</h1>
                <p>Busca registros por palabras clave simples, múltiples o con filtros avanzados.</p>
            </div>

            <div className="search-section">
                <div className="search-inputs">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Ingresa una palabra clave"
                        className="search-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="button-row">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="search-button"
                    >
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                    <button
                        onClick={handleClear}
                        className="clear-button"
                    >
                        Limpiar
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
                        Resultados de Búsqueda ({results.data?.length || 0} registros)
                    </h3>

                    {/* Mostrar errores si existen (para búsqueda múltiple) */}
                    {results.errors && results.errors.length > 0 && (
                        <div className="warning-message">
                            <p><strong>Advertencias:</strong></p>
                            <ul>
                                {results.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mostrar palabras clave usadas (para búsqueda múltiple) */}
                    {results.keywords && (
                        <div className="keywords-used">
                            <p><strong>Palabras clave utilizadas:</strong> {results.keywords.join(', ')}</p>
                        </div>
                    )}

                    {results.data && results.data.length > 0 ? (
                        <div className="results-grid">
                            {results.data.map((record, index) => (
                                <div key={record.id || record.id_post || index} className="result-card">
                                    <div className="result-header">
                                        <span className="result-id">ID: {record.id || record.id_post}</span>
                                        <span className="result-date">{getDate(record)}</span>
                                    </div>
                                    <h4>{record.titulo}</h4>
                                    <p><strong>Editor:</strong> {record.editor}</p>
                                    <p><strong>Categoría:</strong> {record.categoria}</p>
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
                    ) : (
                        <div className="no-results">
                            <p>No se encontraron registros que coincidan con los criterios de búsqueda.</p>
                        </div>
                    )}

                    <div className="results-summary">
                        <p>
                            Total: {results.data?.length || 0} registros encontrados
                        </p>
                        {/* Modo múltiple / avanzado removidos */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Keyword;
