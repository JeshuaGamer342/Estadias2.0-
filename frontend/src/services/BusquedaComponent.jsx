import React, { useState } from 'react';
import { getId, getBada } from './BusquedaId';

const BusquedaComponent = () => {
    const [id, setId] = useState('');
    const [resultado, setResultado] = useState(null);
    const [todosLosRegistros, setTodosLosRegistros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para buscar por ID
    const handleBuscarPorId = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const data = await getId(id);
            setResultado(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener todos los registros
    const handleObtenerTodos = async () => {
        setLoading(true);
        setError(null);
        setTodosLosRegistros([]);

        try {
            const data = await getBada();
            setTodosLosRegistros(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Búsqueda en Base de Datos</h2>

            {/* Formulario de búsqueda por ID */}
            <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3>Buscar por ID</h3>
                <form onSubmit={handleBuscarPorId}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="Ingresa el ID (string)"
                            style={{
                                padding: '8px',
                                marginRight: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                minWidth: '200px'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !id.trim()}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Botón para obtener todos los registros */}
            <div style={{ marginBottom: '30px' }}>
                <button
                    onClick={handleObtenerTodos}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Cargando...' : 'Obtener Todos los Registros'}
                </button>
            </div>

            {/* Mostrar errores */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Mostrar resultado de búsqueda por ID */}
            {resultado && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>Resultado de la búsqueda:</h3>
                    <div style={{
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        padding: '15px',
                        borderRadius: '4px'
                    }}>
                        <pre>{JSON.stringify(resultado, null, 2)}</pre>
                    </div>
                </div>
            )}

            {/* Mostrar todos los registros */}
            {todosLosRegistros.length > 0 && (
                <div>
                    <h3>Todos los registros:</h3>
                    <div style={{
                        backgroundColor: '#e2e3e5',
                        padding: '15px',
                        borderRadius: '4px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        <pre>{JSON.stringify(todosLosRegistros, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusquedaComponent;