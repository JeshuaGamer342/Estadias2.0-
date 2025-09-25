import express from 'express';
import cors from 'cors';
import axios from 'axios';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Si existe un archivo .env en el backend y las variables no están definidas,
// cargamos sus pares KEY=VALUE en process.env (no usamos dotenv para mantenerlo ligero).
const dotenvPath = path.resolve(new URL('.', import.meta.url).pathname, '.env').replace(/^\/(.:\/)/, '$1');
try {
    if (fs.existsSync(dotenvPath)) {
        const content = fs.readFileSync(dotenvPath, { encoding: 'utf8' });
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eq = trimmed.indexOf('=');
            if (eq === -1) return;
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            // quitar comillas si existen
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = val;
        });
    }
} catch (e) {
    console.warn('No se pudo cargar .env automáticamente:', e.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// Ya no usamos Make/webhooks aquí — el backend habla directamente con Postgres.

// Configurar conexión a Postgres (no se usa dotenv aquí):
// usa process.env.DATABASE_URL o las variables DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT
const pool = process.env.DATABASE_URL
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
    : new pg.Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    });

// Test rápido de conexión a Postgres para detectar errores tempranos (credenciales, password type, etc.)
(async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('Conexión a Postgres OK');
    } catch (err) {
        console.error('Error conectando a Postgres — revisa tus variables de entorno:', err.message);
        // No forzamos shutdown para que puedas ver logs; opcionalmente podríamos process.exit(1)
    }
})();

// Legacy route: redirige antiguas llamadas a /api/badabun/:id hacia /api/backup/:id
app.get('/api/badabun/:id', (req, res) => {
    const { id } = req.params;
    // Redireccion interna (cliente recibirá 302)
    return res.redirect(`/api/backup/${encodeURIComponent(id)}`);
});

// Ruta para buscar por fecha
app.get('/api/buscar/fecha/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;

        // Consultar en la DB (tabla 'backup')
        const dbResult = await pool.query('SELECT * FROM backup WHERE fecha = $1 ORDER BY hora DESC', [fecha]);

        // Log simple (antes estaba notificando a Make, ahora solo logueamos)
        console.log('search_by_date', { fecha, count: dbResult.rows.length });

        res.json({ message: `Se encontraron ${dbResult.rows.length} registros para la fecha ${fecha}`, data: dbResult.rows });
    } catch (error) {
        res.status(500).json({
            message: 'Error al enviar búsqueda por fecha al webhook',
            error: error.message
        });
    }
});

// Ruta para buscar por rango de fechas
app.get('/api/backup/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Primero intentamos obtener el registro desde Postgres (tabla 'backup')
        const dbResult = await pool.query('SELECT * FROM backup WHERE id = $1 LIMIT 1', [id]);

        if (dbResult.rows && dbResult.rows.length > 0) {
            const row = dbResult.rows[0];

            // Enviar evento al webhook para registro/logging (no esperamos datos de vuelta ahora)
            console.log('search_by_id', { id, source: 'postgres', found: true, table: 'backup' });

            return res.json({ message: 'Registro encontrado', data: row });
        }

        // Si no est\u00e1 en la DB, consulta al webhook externo como respaldo
        const webhookUrl = `${MAKE_WEBHOOK_URL}?id=${encodeURIComponent(id)}`;

        const response = await axios.get(webhookUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        let originalData = response.data;
        if (!originalData || (typeof originalData === 'object' && Object.keys(originalData).length === 0)) {
            return res.status(404).json({ message: 'No se encontr\u00f3 ning\u00fan registro con ese ID' });
        }

        if (typeof originalData === 'string') {
            try {
                originalData = JSON.parse(originalData);
            } catch (e) {
                return res.status(500).json({ message: 'Error: El webhook devolvi\u00f3 datos en formato no v\u00e1lido', rawResponse: originalData });
            }
        }

        if (Array.isArray(originalData)) originalData = originalData[0] || {};

        // Intentar mapear campos b\u00e1sicos si vienen desde el webhook
        const resultRow = {
            id: originalData.id || originalData.ID || id,
            titulo: originalData.titulo || originalData.TITULO || '',
            editor: originalData.editor || originalData.EDITOR || '',
            categoria: originalData.categoria || originalData.CATEGORIA || '',
            formato: originalData.formato || originalData.FORMATO || '',
            fecha: originalData.fecha || originalData.FECHA || '',
            link: originalData.url || originalData.LINK || ''
        };

        console.log('search_by_id_fallback', { id, source: 'make_fallback', found: true, table: 'backup' });

        return res.json({ message: 'Registro encontrado (desde webhook)', data: resultRow });
    } catch (error) {
        console.error('Error al buscar por ID en Make.com:', error.message);
        if (error.code === 'ECONNABORTED') {
            res.status(504).json({
                message: 'Timeout: El webhook de Make.com tard\u00f3 demasiado en responder'
            });
        } else if (error.response) {
            console.error('Error response:', error.response.data);
            res.status(error.response.status).json({
                message: 'Error del webhook de Make.com',
                error: error.response.data
            });
        } else {
            res.status(500).json({
                message: 'Error al realizar b\u00fasqueda por ID',
                error: error.message
            });
        }
    }
});

// Ruta para listar registros de la tabla 'backup' (opcional ?limit=N)
app.get('/api/backup', async (req, res) => {
    try {
        const limit = req.query.limit ? Math.min(1000, Number(req.query.limit)) : 100; // to avoid huge responses
        const dbResult = await pool.query('SELECT * FROM backup ORDER BY fecha DESC, hora DESC LIMIT $1', [limit]);
        console.log('list_backup', { count: dbResult.rows.length, table: 'backup' });
        res.json({ count: dbResult.rows.length, data: dbResult.rows });
    } catch (error) {
        console.error('Error al listar registros de backup:', error.message);
        res.status(500).json({ message: 'Error al listar registros', error: error.message });
    }
});
// Ruta para buscar por formato
app.get('/api/buscar/formato/:formatoId', async (req, res) => {
    try {
        const { formatoId } = req.params;

        const dbResult = await pool.query('SELECT * FROM backup WHERE formato = $1 ORDER BY fecha DESC, hora DESC', [formatoId]);
        console.log('search_by_format', { formatoId, count: dbResult.rows.length, table: 'backup' });
        res.json({ message: `Se encontraron ${dbResult.rows.length} registros para el formato ${formatoId}`, data: dbResult.rows });
    } catch (error) {
        res.status(500).json({
            message: 'Error al enviar búsqueda por formato al webhook',
            error: error.message
        });
    }
});

// Ruta para búsqueda avanzada con múltiples filtros
app.get('/api/buscar/avanzado', async (req, res) => {
    try {
        const { categoria, platforms, editor, formato, keyword, fechaDesde, fechaHasta } = req.query;
        // Construir consulta SQL dinámica
        let query = 'SELECT * FROM backup WHERE 1=1';
        const params = [];
        let idx = 1;

        if (categoria) { query += ` AND categoria = $${idx++}`; params.push(categoria); }
        if (editor) { query += ` AND editor = $${idx++}`; params.push(editor); }
        if (formato) { query += ` AND formato = $${idx++}`; params.push(formato); }
        if (keyword) { query += ` AND LOWER(titulo) LIKE LOWER($${idx++})`; params.push(`%${keyword}%`); }
        if (fechaDesde && fechaHasta) { query += ` AND fecha BETWEEN $${idx++} AND $${idx++}`; params.push(fechaDesde, fechaHasta); }
        else if (fechaDesde) { query += ` AND fecha >= $${idx++}`; params.push(fechaDesde); }
        else if (fechaHasta) { query += ` AND fecha <= $${idx++}`; params.push(fechaHasta); }

        // platforms: CSV 'YT,IG' -> construir OR sobre columnas booleanas
        if (platforms) {
            const cols = platforms.split(',').map(s => s.trim()).filter(Boolean);
            const allowed = ['YT', 'IG', 'TT', 'TH', 'X'];
            const safeCols = cols.filter(c => allowed.includes(c));
            if (safeCols.length > 0) {
                const orConds = safeCols.map(c => `${c} = true`).join(' OR ');
                query += ` AND (${orConds})`;
            }
        }

        query += ' ORDER BY fecha DESC, hora DESC';

        const dbResult = await pool.query(query, params);
        console.log('advanced_search', { filters: { categoria, plataforma, editor, formato, keyword, fechaDesde, fechaHasta }, count: dbResult.rows.length });

        res.json({ message: `Se encontraron ${dbResult.rows.length} registros`, filtros: { categoria, plataforma, editor, formato, keyword, fechaDesde, fechaHasta }, data: dbResult.rows });
    } catch (error) {
        res.status(500).json({
            message: 'Error al enviar búsqueda avanzada al webhook',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});