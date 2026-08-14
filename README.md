# HealtLab — Frontend

SPA de gestión clínica (citas, pacientes, personal y reportes) sobre React 19, TypeScript y Vite. Consume la API ASP.NET de HealtLab con JWT y notificaciones SignalR.

## Stack

- **Core:** React 19, TypeScript, Vite 8
- **Enrutamiento:** React Router DOM v7
- **Realtime:** `@microsoft/signalr` → hub `/hubs/notifications`
- **Iconos:** Lucide React
- **Estilos:** CSS propio + `ThemeContext` (claro/oscuro)
- **Auth / estado:** `AuthContext`, `SignalRContext`

Gestor de paquetes del repo: **pnpm** (`pnpm-lock.yaml`). También funciona con `npm` si hace falta.

## Roles (RBAC)

Los claims del backend se mapean en el frontend así:

| Claim backend | Rol UI | Portal |
|---------------|--------|--------|
| `Administrador` | `admin` | Administración (usuarios, profesionales, reportes). **No es médico**: sin UI de estado clínico de doctor; etiqueta **Administrador**. |
| `Recepcionista` | recepción | Pacientes, citas, panel del día |
| `Profesional` | profesional | Agenda propia, atención clínica |

## Cuentas seed (backend)

Usar cuando la API haya sembrado usuarios (tabla `usuarios` vacía al arrancar):

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `Admin123!` | Administrador |
| `recepcion` | `Recepcion123!` | Recepcionista |
| `medico1` | `Medico123!` | Profesional |

## Requisitos

- Node.js 18+
- Backend HealtLab en ejecución (por defecto `http://localhost:5077`)
- pnpm (recomendado) o npm

## Cómo ejecutar

```bash
git clone <URL_DEL_REPOSITORIO>
cd HEALTLAB_FRONTEND

pnpm install
# o: npm install

pnpm dev
# o: npm run dev
```

- Dev server Vite: **http://localhost:5173**
- API por defecto: `http://localhost:5077/api` (`src/services/api.ts`)

### Proxy y variables de entorno

En `vite.config.ts`, las peticiones a `/api` se proxifican a `http://localhost:5077` (mismo origen en el browser, sin CORS en local).

Opcional — `.env` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:5077/api
```

Si no defines `VITE_API_BASE_URL`, se usa ese mismo valor por defecto.

### Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm dev` / `npm run dev` | Servidor de desarrollo (HMR), puerto 5173 |
| `pnpm build` / `npm run build` | Build de producción en `/dist` |
| `pnpm lint` / `npm run lint` | ESLint |
| `pnpm preview` / `npm run preview` | Preview del build |

## Integración con la API

- Cliente HTTP: `apiFetch` en `src/services/api.ts` (Bearer token, refresh en 401, limpieza de sesión).
- Servicios: `auth`, `patients`, `appointments`, `professionals`, `users`, `catalogs`, `treatments`, etc.
- Alta de personal (Admin): el flujo unificado del backend es `POST /api/Usuarios/completo` (Persona + Empleado + Usuario; si es Profesional también Medico + especialidad). Teléfono/dirección obligatorios para Profesional y Recepcionista; licencia + especialidad para Profesional.
- Especialidades: catálogo sembrado en el backend (`EspecialidadSeeder`); la UI las consume vía `catalogs.service.ts`.
- Citas: duración máxima **30 minutos** (regla del backend).

## SignalR

Tras el login, `SignalRContext` observa el `token` de `AuthContext` y:

1. Conecta a `{API_BASE_URL sin /api}/hubs/notifications` con el JWT.
2. Usa `withAutomaticReconnect()`.
3. Al logout (sin token) detiene la conexión y limpia notificaciones/actividades.

Si el token cambia (nuevo login), el efecto se vuelve a ejecutar y reabre el hub.

## Estructura

```text
HEALTLAB_FRONTEND/
├── public/
├── src/
│   ├── components/     # common, forms, layout, ui
│   ├── context/        # AuthContext, ThemeContext, SignalRContext
│   ├── pages/
│   │   ├── admin/          # Administración (Administrador)
│   │   ├── auth/
│   │   ├── professional/   # Profesional
│   │   └── recepcionista/
│   ├── routes/         # AppRoutes + guardas por rol
│   ├── services/       # api.ts y servicios REST
│   ├── styles/
│   ├── types/
│   └── utils/
├── package.json
├── pnpm-lock.yaml
└── vite.config.ts
```

## Licencia

Uso privado — HealtLab. Todos los derechos reservados.
