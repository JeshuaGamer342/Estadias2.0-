import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno del archivo .env
const dotenvPath = path.resolve(process.cwd(), '.env');
console.log('Cargando .env desde:', dotenvPath);

if (fs.existsSync(dotenvPath)) {
    const content = fs.readFileSync(dotenvPath, { encoding: 'utf8' });
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
    });
}

console.log('\n=== CONFIGURACIÓN DE BASE DE DATOS ===');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_DATABASE);
console.log('Port:', process.env.DB_PORT);
console.log('Password definida:', process.env.DB_PASSWORD ? 'SÍ' : 'NO');

async function testConnection() {
    try {
        console.log('\n=== PROBANDO CONEXIÓN ===');

        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            connectTimeout: 10000,
            acquireTimeout: 10000,
            timeout: 10000
        };

        console.log('Intentando conectar...');
        const connection = await mysql.createConnection(config);

        console.log('✅ Conexión exitosa!');

        // Probar consulta simple
        console.log('\n=== PROBANDO CONSULTAS ===');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tablas encontradas:', tables.length);
        tables.forEach(table => {
            console.log('- ', Object.values(table)[0]);
        });

        // Verificar tabla backup específicamente
        const [backupCheck] = await connection.execute('SHOW TABLES LIKE "backup"');
        if (backupCheck.length > 0) {
            console.log('\n✅ Tabla "backup" existe');

            // Contar registros
            const [count] = await connection.execute('SELECT COUNT(*) as total FROM backup');
            console.log('Registros en backup:', count[0].total);

            // Obtener algunos registros de muestra
            const [sample] = await connection.execute('SELECT * FROM backup LIMIT 3');
            console.log('Muestra de datos:', sample.length, 'registros');
        } else {
            console.log('❌ Tabla "backup" no encontrada');
        }

        await connection.end();
        console.log('\n✅ Test de conexión completado exitosamente');

    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('Errno:', error.errno);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔑 PROBLEMA DE AUTENTICACIÓN:');
            console.error('- Verifica usuario y contraseña en Hostinger');
            console.error('- Revisa que el usuario tenga permisos sobre la base de datos');
            console.error('- Confirma que las credenciales no hayan cambiado');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n🌐 PROBLEMA DE CONECTIVIDAD:');
            console.error('- Verifica la dirección del servidor de base de datos');
            console.error('- Confirma que el servidor esté activo');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n🚫 CONEXIÓN RECHAZADA:');
            console.error('- Verifica el puerto (debería ser 3306 para MySQL)');
            console.error('- Confirma que el servidor de base de datos esté ejecutándose');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('\n⏱️ TIMEOUT DE CONEXIÓN:');
            console.error('- Tu IP puede estar bloqueada por Hostinger');
            console.error('- Verifica la configuración de firewall/seguridad');
        }

        process.exit(1);
    }
}

testConnection();