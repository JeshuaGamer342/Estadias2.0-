import express from 'express';
import cors from 'cors';
import axios from 'axios';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Si existe un archivo .env en el backend y las variables no están definidas,
// cargamos sus pares KEY=VALUE en process.env (no usamos dotenv para mantenerlo ligero).
// Usar process.cwd() es más fiable en Windows cuando arrancas node desde la carpeta Backend.

const dotenvPath = path.resolve(process.cwd(), '.env');
console.log('Intentando cargar .env desde:', dotenvPath);
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
        // aceptar DB_NAME o DB_DATABASE según tu .env
        database: process.env.DB_NAME || process.env.DB_DATABASE,
        // asegurar que la contraseña sea string (evita 'client password must be a string')
        password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : undefined,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    });

// Debug: mostrar qué variables críticas están definidas (no mostrar la contraseña)
console.log('DB env:', {
    DB_USER: !!process.env.DB_USER,
    DB_NAME: !!(process.env.DB_NAME || process.env.DB_DATABASE),
    DB_HOST: !!process.env.DB_HOST,
    DB_PORT: !!process.env.DB_PORT,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DB_PASSWORD_defined: !!process.env.DB_PASSWORD
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

        // Si no está en la DB devolvemos 404 — ya no hacemos fallback a webhooks externos
        return res.status(404).json({ message: 'No se encontró ningún registro con ese ID' });
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
        const limit = req.query.limit ? Number(req.query.limit) : 100;
        const dbResult = await pool.query('SELECT * FROM backup ORDER BY fecha DESC, hora DESC LIMIT $1', [limit]);
        return res.json({ count: dbResult.rows.length, data: dbResult.rows });
    } catch (error) {
        console.error('Error en /api/backup:', error.message);
        return res.status(500).json({ message: 'Error listando registros', error: error.message });
    }
});

// Búsqueda por keyword en el título
app.get('/api/buscar/keyword/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        if (!keyword) return res.status(400).json({ message: 'keyword requerida' });
        const q = `%${keyword}%`;
        const dbResult = await pool.query('SELECT * FROM busqueda_titulo ($1)', [q]);
        return res.json({ count: dbResult.rows.length, data: dbResult.rows });
    } catch (error) {
        console.error('Error en /api/buscar/keyword:', error.message);
        return res.status(500).json({ message: 'Error en búsqueda por keyword', error: error.message });
    }
});

// Buscar por categoría (la columna `categoria` es texto; la ruta recibe el texto de categoría)
app.get('/api/buscar/categoria/:categoria', async (req, res) => {
    try {
        let { categoria } = req.params; // ahora recibimos la categoría como texto
        if (!categoria) return res.status(400).json({ message: 'categoria requerida' });
        categoria = categoria.trim();
        // Intentar usar la función almacenada `busqueda_categoria` de varias maneras
        // Algunas funciones pueden esperar texto en minúsculas, sin acentos, o incluso un id numérico.
        // Probamos variantes para adaptarnos a la función y añadimos logging para depuración.

        const attempts = [];
        // 1) Llamar la función tal cual (parametro texto)
        attempts.push({ sql: 'SELECT * FROM busqueda_categoria($1)', vals: [categoria], desc: 'directo' });
        // 1b) Llamar la función con comodines (por si la función espera pattern)
        attempts.push({ sql: 'SELECT * FROM busqueda_categoria($1)', vals: [`%${categoria}%`], desc: 'wildcard_direct' });
        // 2) Llamar la función con el valor en minúsculas
        attempts.push({ sql: 'SELECT * FROM busqueda_categoria($1)', vals: [categoria.toLowerCase()], desc: 'lowercase' });
        // 2b) minúsculas con comodines
        attempts.push({ sql: 'SELECT * FROM busqueda_categoria($1)', vals: [`%${categoria.toLowerCase()}%`], desc: 'wildcard_lowercase' });
        // 3) Intentar pasar el texto a la función usando unaccent(...) en el SQL (si la extensión está disponible)
        attempts.push({ sql: 'SELECT * FROM busqueda_categoria(unaccent($1))', vals: [categoria], desc: 'unaccent_direct' });
        // 3) Llamar la función pasando un número si el parámetro parece numérico
        const asNumber = Number(categoria);
        if (!Number.isNaN(asNumber)) {
            attempts.push({ sql: 'SELECT * FROM busqueda_categoria($1)', vals: [asNumber], desc: 'numeric' });
        }

        let dbResult = null;
        let used = null;

        for (const a of attempts) {
            try {
                console.log('Intentando busqueda_categoria with', a.desc, a.vals[0]);
                const r = await pool.query(a.sql, a.vals);
                if (r && r.rows && r.rows.length > 0) {
                    dbResult = r;
                    used = a.desc;
                    console.log(`busqueda_categoria returned ${r.rows.length} rows using ${a.desc}`);
                    // log sample rows (max 3) for debugging
                    console.log('Sample rows:', r.rows.slice(0, 3));
                    break;
                } else {
                    console.log(`busqueda_categoria returned 0 rows using ${a.desc}`);
                }
            } catch (fnErr) {
                console.warn(`Error al ejecutar busqueda_categoria (${a.desc}):`, fnErr.message);
                // continuar con siguiente intento
            }
        }

        // Si la función no devolvió nada, hacemos un fallback a la consulta directa sobre la tabla
        if (!dbResult) {
            console.log('Falling back to direct table query for categoria:', categoria);
            dbResult = await pool.query('SELECT * FROM busqueda_categoria($1)', [categoria]);
            used = 'fallback_table_query';
        }

        res.json({ method: used, count: dbResult.rows.length, data: dbResult.rows });
    } catch (error) {
        console.error('Error en /api/buscar/categoria:', error.message);
        res.status(500).json({ message: 'Error en búsqueda por categoría', error: error.message });
    }
});

// Búsqueda por rango de fechas: /api/buscar/fechas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Devuelve los registros tal como están en la base de datos.
app.get('/api/buscar/fechas', async (req, res) => {
    try {
        const { desde, hasta, format } = req.query;
        if (!desde || !hasta) return res.status(400).json({ message: 'Parametros "desde" y "hasta" requeridos' });

        // Validación básica de formato YYYY-MM-DD
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(desde) || !fechaRegex.test(hasta)) {
            return res.status(400).json({ message: 'Formato de fecha inválido, use YYYY-MM-DD' });
        }

        const dbResult = await pool.query('SELECT * FROM backup WHERE fecha BETWEEN $1 AND $2 ORDER BY fecha DESC, hora DESC', [desde, hasta]);

        // Si el cliente solicita CSV, lo generamos y lo devolvemos
        if (format && format.toLowerCase() === 'csv') {
            const rows = dbResult.rows;
            if (!rows || rows.length === 0) {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="backup_${desde}_to_${hasta}.csv"`);
                return res.send('');
            }

            // Generar CSV simple: encabezados = keys del primer objeto, valores escapados
            const headers = Object.keys(rows[0]);
            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '';
                const s = String(value);
                if (s.includes(',') || s.includes('\n') || s.includes('"')) {
                    return '"' + s.replace(/"/g, '""') + '"';
                }
                return s;
            };

            const csvLines = [headers.join(',')];
            for (const r of rows) {
                const line = headers.map(h => escapeCsv(r[h])).join(',');
                csvLines.push(line);
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="backup_${desde}_to_${hasta}.csv"`);
            return res.send(csvLines.join('\n'));
        }

        // Por defecto devolver JSON con las filas tal cual
        return res.json({ count: dbResult.rows.length, data: dbResult.rows });
    } catch (error) {
        console.error('Error en /api/buscar/fechas:', error.message);
        return res.status(500).json({ message: 'Error en búsqueda por rango de fechas', error: error.message });
    }
});

// Si existe una build del frontend, servirla (permite unificar en un solo puerto en producción)
try {
    // Vite usa 'dist' como directorio de build por defecto
    const buildPath = path.resolve(process.cwd(), '../frontend/dist');
    if (fs.existsSync(buildPath)) {
        console.log('Frontend build encontrado en:', buildPath, '- Serviremos archivos estáticos desde backend');
        app.use(express.static(buildPath));
        // Fallback para SPA - usando expresión regular en lugar de *
        app.get(/^(?!\/api).*/, (req, res) => {
            return res.sendFile(path.join(buildPath, 'index.html'));
        });
    } else {
        console.log('No se encontró frontend/dist. Asumiendo modo desarrollo (frontend en dev server separado).');
        console.log('Para unificar en producción, ejecuta "npm run build" en la carpeta frontend primero.');
    }
} catch (err) {
    console.warn('Error comprobando frontend build:', err.message);
}

// Iniciar servidor en puerto configurable. Por defecto 3001 (evita choque con create-react-app en 3000)
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
