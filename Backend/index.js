import pg from "pg";
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // Para poder recibir JSON en las peticiones

export const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "BD_Badabun",
    password: "1234",
    port: 5432,
});

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.json({ message: 'Servidor backend funcionando correctamente' });
});

// Ruta de prueba para verificar conexión a la base de datos
app.get('/api/id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM badabun');
        res.json({
            message: 'Conexión a base de datos exitosa',
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error de conexión a base de datos',
            error: error.message
        });
    }
});

// Ruta para buscar por ID específico
app.get('/api/badabun/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE id_post = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontró ningún registro con ese ID'
            });
        }

        res.json({
            message: 'Registro encontrado',
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por ID',
            error: error.message
        });
    }
});

// Ruta para buscar por fecha
app.get('/api/buscar/fecha/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE fecha = $1', [fecha]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros para esa fecha'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros para la fecha ${fecha}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por fecha',
            error: error.message
        });
    }
});

// Ruta para buscar por rango de fechas
app.get('/api/buscar/fechas', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                message: 'Se requieren los parámetros "desde" y "hasta"'
            });
        }

        const result = await pool.query(
            'SELECT * FROM badabun WHERE fecha BETWEEN $1 AND $2 ORDER BY fecha DESC',
            [desde, hasta]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros en el rango de fechas especificado'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros entre ${desde} y ${hasta}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por rango de fechas',
            error: error.message
        });
    }
});

// Ruta para buscar por keyword (en título)
app.get('/api/buscar/keyword/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const result = await pool.query(
            'SELECT * FROM badabun WHERE LOWER(titulo) LIKE LOWER($1)',
            [`%${keyword}%`]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros que contengan esa palabra clave'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros que contienen "${keyword}"`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por palabra clave',
            error: error.message
        });
    }
});

// Ruta para buscar por categoría
app.get('/api/buscar/categoria/:categoriaId', async (req, res) => {
    try {
        const { categoriaId } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE categoriaB = $1', [categoriaId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros para esa categoría'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros para la categoría ${categoriaId}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por categoría',
            error: error.message
        });
    }
});

// Ruta para buscar por plataforma
app.get('/api/buscar/plataforma/:plataformaId', async (req, res) => {
    try {
        const { plataformaId } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE plataformaB = $1', [plataformaId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros para esa plataforma'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros para la plataforma ${plataformaId}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por plataforma',
            error: error.message
        });
    }
});

// Ruta para buscar por editor
app.get('/api/buscar/editor/:editorId', async (req, res) => {
    try {
        const { editorId } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE editor = $1', [editorId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros para ese editor'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros para el editor ${editorId}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por editor',
            error: error.message
        });
    }
});

// Ruta para buscar por formato
app.get('/api/buscar/formato/:formatoId', async (req, res) => {
    try {
        const { formatoId } = req.params;
        const result = await pool.query('SELECT * FROM badabun WHERE formato = $1', [formatoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros para ese formato'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros para el formato ${formatoId}`,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar por formato',
            error: error.message
        });
    }
});

// Ruta para búsqueda avanzada con múltiples filtros
app.get('/api/buscar/avanzado', async (req, res) => {
    try {
        const { categoria, plataforma, editor, formato, keyword, fechaDesde, fechaHasta } = req.query;

        let query = 'SELECT * FROM badabun WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (categoria) {
            paramCount++;
            query += ` AND categoriaB = $${paramCount}`;
            params.push(categoria);
        }

        if (plataforma) {
            paramCount++;
            query += ` AND plataformaB = $${paramCount}`;
            params.push(plataforma);
        }

        if (editor) {
            paramCount++;
            query += ` AND editor = $${paramCount}`;
            params.push(editor);
        }

        if (formato) {
            paramCount++;
            query += ` AND formato = $${paramCount}`;
            params.push(formato);
        }

        if (keyword) {
            paramCount++;
            query += ` AND LOWER(titulo) LIKE LOWER($${paramCount})`;
            params.push(`%${keyword}%`);
        }

        if (fechaDesde && fechaHasta) {
            paramCount += 2;
            query += ` AND fecha BETWEEN $${paramCount - 1} AND $${paramCount}`;
            params.push(fechaDesde, fechaHasta);
        } else if (fechaDesde) {
            paramCount++;
            query += ` AND fecha >= $${paramCount}`;
            params.push(fechaDesde);
        } else if (fechaHasta) {
            paramCount++;
            query += ` AND fecha <= $${paramCount}`;
            params.push(fechaHasta);
        }

        query += ' ORDER BY fecha DESC';

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron registros con los criterios especificados'
            });
        }

        res.json({
            message: `Se encontraron ${result.rows.length} registros`,
            filtros: { categoria, plataforma, editor, formato, keyword, fechaDesde, fechaHasta },
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error en la búsqueda avanzada',
            error: error.message
        });
    }
});

app.listen(3001, () => {
    console.log('Servidor corriendo en http://localhost:3001');
});