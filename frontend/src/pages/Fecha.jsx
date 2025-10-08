import React, { useState } from 'react';
import BackHomeButton from '../components/BackHomeButton';
import { getByFecha, getByRangoFechas, getByFechaDesde, getByFechaHasta } from '../services/BusquedaFecha';
import './PageStyles.css';

const Fecha = () => {
    const [searchType, setSearchType] = useState('single'); // single, range, from, until
    const [singleDate, setSingleDate] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
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

    // Función para buscar por fecha específica
    const handleSingleDateSearch = async () => {
        if (!singleDate) {
            setError('Por favor selecciona una fecha');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByFecha(singleDate);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar por rango de fechas
    const handleRangeSearch = async () => {
        if (!fromDate || !toDate) {
            setError('Por favor selecciona ambas fechas para el rango');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByRangoFechas(fromDate, toDate);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Descargar resultados del rango como CSV (exactamente lo que hay en la DB)
    const handleDownloadRange = async () => {
        if (!fromDate || !toDate) {
            setError('Por favor selecciona ambas fechas para el rango antes de descargar');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Solicitar CSV al backend
            const url = `/api/buscar/fechas?desde=${fromDate}&hasta=${toDate}&format=csv`;
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);
            const blob = await response.blob();
            const filename = `backup_${fromDate}_to_${toDate}.csv`;
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar desde una fecha hasta hoy
    const handleFromDateSearch = async () => {
        if (!fromDate) {
            setError('Por favor selecciona una fecha de inicio');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByFechaDesde(fromDate);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar hasta una fecha específica
    const handleUntilDateSearch = async () => {
        if (!toDate) {
            setError('Por favor selecciona una fecha límite');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await getByFechaHasta(toDate);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Descargar resultados desde la fecha seleccionada hasta hoy (para 'from')
    const handleDownloadFrom = async () => {
        if (!fromDate) {
            setError('Por favor selecciona una fecha de inicio antes de descargar');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const url = `/api/buscar/fechas?desde=${fromDate}&hasta=${today}&format=csv`;
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);
            const blob = await response.blob();
            const filename = `backup_desde_${fromDate}_hasta_${today}.csv`;
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Descargar resultados desde una fecha muy antigua hasta la fecha seleccionada (para 'until')
    const handleDownloadUntil = async () => {
        if (!toDate) {
            setError('Por favor selecciona una fecha límite antes de descargar');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const fechaInicio = '2020-01-01';
            const url = `/api/buscar/fechas?desde=${fechaInicio}&hasta=${toDate}&format=csv`;
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);
            const blob = await response.blob();
            const filename = `backup_hasta_${toDate}.csv`;
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para ejecutar búsqueda según el tipo seleccionado
    const handleSearch = () => {
        switch (searchType) {
            case 'single':
                handleSingleDateSearch();
                break;
            case 'range':
                handleRangeSearch();
                break;
            case 'from':
                handleFromDateSearch();
                break;
            case 'until':
                handleUntilDateSearch();
                break;
            default:
                setError('Tipo de búsqueda no válido');
        }
    };

    // Limpiar resultados
    const handleClear = () => {
        setResults(null);
        setError('');
        setSingleDate('');
        setFromDate('');
        setToDate('');
    };

    // Obtener fecha de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="page-container">
            <BackHomeButton />
            <div className="page-header">
                <h1>Búsqueda por Fecha</h1>
                <p>Busca registros por fecha específica, rango de fechas o períodos personalizados.</p>
            </div>

            <div className="search-section">
                <div className="search-type-selector">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="searchType"
                            value="single"
                            checked={searchType === 'single'}
                            onChange={(e) => setSearchType(e.target.value)}
                        />
                        Fecha Específica
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="searchType"
                            value="range"
                            checked={searchType === 'range'}
                            onChange={(e) => setSearchType(e.target.value)}
                        />
                        Rango de Fechas
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="searchType"
                            value="from"
                            checked={searchType === 'from'}
                            onChange={(e) => setSearchType(e.target.value)}
                        />
                        Desde Fecha (hasta hoy)
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="searchType"
                            value="until"
                            checked={searchType === 'until'}
                            onChange={(e) => setSearchType(e.target.value)}
                        />
                        Hasta Fecha
                    </label>
                </div>

                <div className="date-inputs">
                    {searchType === 'single' && (
                        <input
                            type="date"
                            value={singleDate}
                            onChange={(e) => setSingleDate(e.target.value)}
                            className="date-input"
                            max={today}
                        />
                    )}

                    {(searchType === 'range' || searchType === 'from') && (
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            placeholder="Fecha desde"
                            className="date-input"
                            max={searchType === 'range' ? toDate || today : today}
                        />
                    )}

                    {(searchType === 'range' || searchType === 'until') && (
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            placeholder="Fecha hasta"
                            className="date-input"
                            min={searchType === 'range' ? fromDate : undefined}
                            max={today}
                        />
                    )}
                </div>

                <div className="button-row">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="search-button"
                    >
                        {loading ? 'Buscando...' : 'Buscar por Fecha'}
                    </button>
                    {searchType === 'range' && (
                        <button
                            onClick={handleDownloadRange}
                            disabled={loading}
                            className="download-button"
                        >
                            Descargar CSV
                        </button>
                    )}
                    {searchType === 'from' && (
                        <button
                            onClick={handleDownloadFrom}
                            disabled={loading}
                            className="download-button"
                        >
                            Descargar Desde → Hoy
                        </button>
                    )}
                    {searchType === 'until' && (
                        <button
                            onClick={handleDownloadUntil}
                            disabled={loading}
                            className="download-button"
                        >
                            Descargar Hasta
                        </button>
                    )}
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

            {results && (
                <div className="results-section">
                    <h3>
                        Resultados de Búsqueda por Fecha ({results.data?.length || 0} registros)
                    </h3>

                    {results.data && results.data.length > 0 ? (
                        <div className="results-grid">
                            {results.data.map((record, index) => (
                                <div key={record.id_post || index} className="result-card">
                                    <div className="result-header">
                                        <span className="result-id">ID: {record.id_post}</span>
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
                            <p>No se encontraron registros para la fecha seleccionada.</p>
                        </div>
                    )}

                    <div className="results-summary">
                        <p>
                            {searchType === 'single' && `Resultados para la fecha: ${singleDate}`}
                            {searchType === 'range' && `Resultados del ${fromDate} al ${toDate}`}
                            {searchType === 'from' && `Resultados desde ${fromDate} hasta hoy`}
                            {searchType === 'until' && `Resultados hasta ${toDate}`}
                        </p>
                        <p>Total: {results.data?.length || 0} registros encontrados</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fecha;
