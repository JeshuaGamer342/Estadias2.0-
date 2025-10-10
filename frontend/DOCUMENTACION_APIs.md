# 🗃️ Documentación de APIs - Base de Datos

Este documento explica cómo usar todas las consultas a la base de datos desde el frontend de tu aplicación React.

## 📋 Índice
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [APIs Disponibles](#apis-disponibles)
- [Servicios Frontend](#servicios-frontend)
- [Hooks Personalizados](#hooks-personalizados)
- [Componentes de Ejemplo](#componentes-de-ejemplo)
- [Diagnóstico y Troubleshooting](#diagnóstico-y-troubleshooting)
- [Ejemplos de Uso](#ejemplos-de-uso)

## 🔧 Configuración de Variables de Entorno

### Para Desarrollo Local
Archivo `.env`:
```env
VITE_API_URL=http://localhost:3001
```

### Para Producción
Archivo `.env.production`:
```env
VITE_API_URL=https://estadias2-0.onrender.com
```

### En tu proveedor de hosting (ej: Vercel, Netlify)
Define la variable de entorno:
- **Variable**: `VITE_API_URL`
- **Valor**: `https://estadias2-0.onrender.com` (o donde esté tu API)

⚠️ **Importante**: Cualquier cambio en variables de entorno requiere rebuilding del sitio.

## 🔗 APIs Disponibles

### 1. **Buscar por ID**
```
GET /api/backup/:id
```
- **Descripción**: Busca un registro específico por ID
- **Parámetros**: `id` (string/number)
- **Ejemplo**: `/api/backup/12345`

### 2. **Listar todos los registros**
```
GET /api/backup?limit=N
```
- **Descripción**: Lista registros con límite opcional
- **Parámetros**: `limit` (opcional, default: 100)
- **Ejemplo**: `/api/backup?limit=50`

### 3. **Buscar por fecha específica**
```
GET /api/buscar/fecha/:fecha
```
- **Descripción**: Busca registros por una fecha específica
- **Parámetros**: `fecha` (YYYY-MM-DD)
- **Ejemplo**: `/api/buscar/fecha/2024-12-01`

### 4. **Buscar por rango de fechas**
```
GET /api/buscar/fechas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&format=csv
```
- **Descripción**: Busca registros entre dos fechas
- **Parámetros**: 
  - `desde` (requerido, YYYY-MM-DD)
  - `hasta` (requerido, YYYY-MM-DD)
  - `format` (opcional: 'json' o 'csv')
- **Ejemplo**: `/api/buscar/fechas?desde=2024-01-01&hasta=2024-12-31`

### 5. **Buscar por palabra clave**
```
GET /api/buscar/keyword/:keyword
```
- **Descripción**: Busca en títulos usando palabra clave
- **Parámetros**: `keyword` (string, mínimo 2 caracteres)
- **Ejemplo**: `/api/buscar/keyword/badabun`

### 6. **Buscar por categoría**
```
GET /api/buscar/categoria/:categoria
```
- **Descripción**: Busca registros por categoría específica
- **Parámetros**: `categoria` (string)
- **Ejemplo**: `/api/buscar/categoria/deportes`

## 🛠️ Servicios Frontend

### ApiService.jsx
Servicio principal que encapsula todas las llamadas a APIs con configuración robusta:

```javascript
import ApiService from '../services/ApiService';

// La configuración se hace automáticamente usando VITE_API_URL
// En desarrollo: http://localhost:3001
// En producción: tu URL de backend configurada

// Ejemplos de uso
const registro = await ApiService.buscarPorId('12345');
const todos = await ApiService.listarTodosLosRegistros(100);
const porFecha = await ApiService.buscarPorFecha('2024-12-01');
const porRango = await ApiService.buscarPorRangoFechas('2024-01-01', '2024-12-31');
const porKeyword = await ApiService.buscarPorKeyword('badabun');
const porCategoria = await ApiService.buscarPorCategoria('deportes');

// Descarga CSV
await ApiService.descargarCSV('2024-01-01', '2024-12-31');

// Utilidades y diagnóstico
const estadisticas = await ApiService.obtenerEstadisticas();
const conexion = await ApiService.validarConexion();
const diagnostico = ApiService.diagnosticoAPI(); // Para troubleshooting
```

### Características del ApiService actualizado:
- ✅ **Variables de entorno**: Usa `VITE_API_URL` automáticamente
- ✅ **Logging mejorado**: Muestra URLs y errores detallados
- ✅ **Manejo de CORS**: Detecta errores de red y CORS
- ✅ **Diagnóstico**: Funciones para troubleshooting
- ✅ **Interceptors**: Para request/response logging

## 🔍 Diagnóstico y Troubleshooting

### Función de Diagnóstico Automático
El sistema incluye herramientas de diagnóstico integradas:

```javascript
import { diagnosticoAPI, validarConexion } from '../services/ApiService';

// Diagnóstico completo (revisa la consola)
const info = diagnosticoAPI();

// Prueba de conexión
const conexion = await validarConexion();
```

### Checklist de Diagnóstico Rápido

1. **Verificar variables de entorno:**
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL);
   console.log('Environment:', import.meta.env.MODE);
   ```

2. **Probar backend directo:**
   - Abre en el navegador: `https://estadias2-0.onrender.com/api/backup?limit=1`
   - O usa: `curl -i https://estadias2-0.onrender.com/api/backup?limit=1`

3. **Revisar consola del navegador:**
   - ¿A qué host van las requests? Debe ser tu backend
   - ¿Status 200/404/500/CORS?
   - ¿Aparecen logs de "🚀 API Request"?

4. **Revisar pestaña Network:**
   - Confirmar URLs correctas
   - Verificar headers CORS
   - Status codes de respuesta

### Errores Comunes y Soluciones

#### Error de CORS
```
Access to fetch at 'https://tu-api...' has been blocked by CORS policy
```
**Solución**: Verificar configuración CORS en el backend:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://tu-app.predeploy.app'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: false
}));
```

#### Error 404 - Not Found
**Solución**: Verificar que las rutas del backend coincidan:
- Frontend hace: `/api/backup/123`
- Backend debe tener: `app.get('/api/backup/:id', ...)`

#### Mixed Content (HTTP/HTTPS)
**Solución**: En producción, tanto frontend como backend deben usar HTTPS.

#### Request a localhost en producción
**Solución**: Verificar que `VITE_API_URL` esté configurado correctamente en producción.

## 🪝 Hooks Personalizados

### useDatabase Hook
Hook que maneja el estado y las llamadas a APIs:

```javascript
import { useDatabase } from '../hooks/useDatabase';

function MiComponente() {
  const {
    loading,
    error,
    resultados,
    estadisticas,
    conexion,
    buscarPorId,
    listarTodos,
    buscarPorFecha,
    buscarPorRango,
    buscarPorKeyword,
    buscarPorCategoria,
    busquedaCombinada,
    descargarCSV,
    verificarConexion,
    cargarEstadisticas,
    limpiar
  } = useDatabase();

  // Usar las funciones...
  const handleBuscar = async () => {
    try {
      await buscarPorId('12345');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}
      {resultados && <div>{/* Mostrar resultados */}</div>}
    </div>
  );
}
```

### useSearchForm Hook
Hook para manejar formularios de búsqueda:

```javascript
import { useSearchForm } from '../hooks/useDatabase';

function FormularioBusqueda() {
  const { formData, updateField, resetForm, isValid } = useSearchForm();

  return (
    <div>
      <input
        value={formData.id}
        onChange={(e) => updateField('id', e.target.value)}
        placeholder="ID del registro"
      />
      <input
        type="date"
        value={formData.fecha}
        onChange={(e) => updateField('fecha', e.target.value)}
      />
      {/* Más inputs... */}
      <button onClick={resetForm}>Limpiar</button>
    </div>
  );
}
```

## 🎯 Componentes de Ejemplo

### 1. EjemplosAPIs.jsx
Componente completo con ejemplos de todas las APIs:
- **Ruta**: `/EjemplosAPIs`
- **Características**:
  - Ejemplos rápidos predefinidos
  - Formularios para consultas personalizadas
  - Manejo de errores y loading
  - Descarga de CSV
  - Verificación de conexión

### 2. ConsultasDatabase.jsx
Panel avanzado con todas las funcionalidades:
- **Ruta**: `/ConsultasDatabase`
- **Características**:
  - Interface completa para todas las APIs
  - Tabla de resultados
  - Estadísticas de la base de datos
  - Exportación de datos

## 💡 Ejemplos de Uso Práctico

### 1. Búsqueda Simple por ID
```javascript
import { useDatabase } from '../hooks/useDatabase';

function BusquedaSimple() {
  const { buscarPorId, loading, resultados } = useDatabase();

  const handleBuscar = () => {
    buscarPorId('12345');
  };

  return (
    <div>
      <button onClick={handleBuscar} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
      {resultados && (
        <div>
          <h3>Resultado:</h3>
          <pre>{JSON.stringify(resultados.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 2. Lista con Paginación
```javascript
function ListaConPaginacion() {
  const { listarTodos, loading, resultados } = useDatabase();
  const [limite, setLimite] = useState(10);

  const cargarMas = () => {
    listarTodos(limite + 10);
    setLimite(limite + 10);
  };

  return (
    <div>
      {resultados?.data?.data?.map(item => (
        <div key={item.id}>
          <h4>{item.titulo}</h4>
          <p>{item.fecha}</p>
        </div>
      ))}
      <button onClick={cargarMas} disabled={loading}>
        Cargar más
      </button>
    </div>
  );
}
```

### 3. Búsqueda con Filtros
```javascript
function BusquedaConFiltros() {
  const { busquedaCombinada, loading, resultados } = useDatabase();
  const { formData, updateField } = useSearchForm();

  const handleBuscar = () => {
    busquedaCombinada(formData);
  };

  return (
    <div>
      <input
        placeholder="ID"
        value={formData.id}
        onChange={(e) => updateField('id', e.target.value)}
      />
      <input
        placeholder="Palabra clave"
        value={formData.keyword}
        onChange={(e) => updateField('keyword', e.target.value)}
      />
      <input
        type="date"
        value={formData.fecha}
        onChange={(e) => updateField('fecha', e.target.value)}
      />
      <button onClick={handleBuscar}>Buscar</button>
      
      {resultados && (
        <div>
          {resultados.data?.data?.map(item => (
            <div key={item.id}>{item.titulo}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Descarga de Reportes
```javascript
function DescargaReportes() {
  const { descargarCSV, loading } = useDatabase();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const handleDescargar = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor selecciona las fechas');
      return;
    }

    try {
      await descargarCSV(fechaDesde, fechaHasta);
      alert('Archivo descargado exitosamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <input
        type="date"
        value={fechaDesde}
        onChange={(e) => setFechaDesde(e.target.value)}
      />
      <input
        type="date"
        value={fechaHasta}
        onChange={(e) => setFechaHasta(e.target.value)}
      />
      <button onClick={handleDescargar} disabled={loading}>
        📥 Descargar CSV
      </button>
    </div>
  );
}
```

## 🔧 Configuración del Backend

Asegúrate de que el backend esté ejecutándose:

```bash
cd Backend
node index.js
```

El servidor debería estar disponible en `http://localhost:3001`

## 📱 Rutas Disponibles en el Frontend

- `/` - Página principal con navegación
- `/Id` - Búsqueda por ID individual
- `/Fecha` - Búsqueda por fechas
- `/Keyword` - Búsqueda por palabra clave
- `/Categoria` - Búsqueda por categoría
- `/EjemplosAPIs` - Ejemplos prácticos de todas las APIs
- `/ConsultasDatabase` - Panel completo de administración

## 🚀 Cómo Iniciar

1. **Iniciar el backend:**
   ```bash
   cd Backend
   node index.js
   ```

2. **Iniciar el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acceder a los ejemplos:**
   - Ir a `http://localhost:5173/EjemplosAPIs`
   - O usar el panel completo en `http://localhost:5173/ConsultasDatabase`

## 🎯 Próximos Pasos

Con esta configuración puedes:

1. **Ejecutar cualquier consulta** usando los hooks y servicios
2. **Crear nuevos componentes** que usen las APIs
3. **Personalizar la UI** según tus necesidades
4. **Agregar nuevas funcionalidades** extendiendo los servicios
5. **Implementar autenticación** si es necesario
6. **Agregar más filtros** o criterios de búsqueda

¡Todas las APIs de tu base de datos están ahora disponibles desde el frontend con una interfaz completa y fácil de usar!