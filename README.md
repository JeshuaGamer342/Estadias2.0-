# Sistema de Búsqueda Badabun

Sistema unificado con backend (Express.js + PostgreSQL) y frontend (React + Vite) que puede ejecutarse como una sola aplicación.

## 🚀 Instalación

1. **Instalar todas las dependencias:**
```bash
npm run install-all
```

2. **Configurar variables de entorno:**
   - Copia `Backend/.env.example` a `Backend/.env`
   - Configura tus credenciales de PostgreSQL

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Unificado (Recomendado para Producción)
```bash
# Compila el frontend y ejecuta todo desde el backend en un solo puerto
npm run start:unified
```
El proyecto estará disponible en: `http://localhost:3001`

### Modo Desarrollo (Frontend y Backend separados)
```bash
# Frontend en puerto 5173, Backend en puerto 3001
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Solo Backend (API)
```bash
npm start
```
Solo la API estará disponible en: `http://localhost:3001`

## 📁 Estructura del Proyecto

```
├── Backend/           # Servidor Express.js + API
│   ├── index.js      # Servidor principal
│   ├── .env.example  # Ejemplo de configuración
│   └── package.json
├── frontend/         # Aplicación React
│   ├── src/         # Código fuente
│   ├── dist/        # Build de producción (generado)
│   └── package.json
└── package.json     # Scripts unificados
```

## 🌐 API Endpoints

- `GET /api/backup/:id` - Buscar por ID
- `GET /api/buscar/fecha/:fecha` - Buscar por fecha
- `GET /api/buscar/fechas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` - Rango de fechas
- `GET /api/buscar/keyword/:keyword` - Buscar por palabra clave
- `GET /api/buscar/categoria/:categoria` - Buscar por categoría
- `GET /api/backup?limit=N` - Listar registros

## 🔧 Variables de Entorno

Crea un archivo `Backend/.env` con:

```env
DB_USER=tu_usuario
DB_HOST=localhost
DB_NAME=tu_base_de_datos
DB_PASSWORD=tu_contraseña
DB_PORT=5432
PORT=3001
```

## � Despliegue

Para despliegue en producción:

```bash
npm run production
```

Esto compilará el frontend e iniciará el servidor unificado listo para producción.

## 🌐 Despliegue en Nube

### Opción 1: Vercel (Recomendada)

1. **Preparar base de datos:**
   - Crear cuenta en [Neon.tech](https://neon.tech)
   - Crear nueva base de datos PostgreSQL
   - Copiar la URL de conexión

2. **Desplegar en Vercel:**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Desde la raíz del proyecto
   vercel
   ```

3. **Configurar variables de entorno en Vercel:**
   - Ir al dashboard de Vercel
   - Proyecto → Settings → Environment Variables
   - Agregar tu `DATABASE_URL` y otras variables necesarias

### Opción 2: Railway

1. Conectar repositorio a Railway
2. Railway detectará automáticamente la configuración
3. Configurar variables de entorno en Railway