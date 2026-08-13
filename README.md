# 🏥 HealthLab - Frontend

Sistema web de gestión clínica y laboratorio médico desarrollado con **React 19**, **TypeScript** y **Vite**. La plataforma permite optimizar la atención médica, agendamiento de citas, administración de pacientes, control de profesionales de la salud y emisión de reportes administrativos.

---

## 🚀 Características Principales

La aplicación cuenta con un sistema de autenticación basado en **JWT** y control de acceso por roles (**RBAC**):

### 👨‍⚕️ 1. Portal del Médico / Profesional
- **Agenda Médica**: Visualización y gestión de citas del día y calendario de atención.
- **Historial de Atención**: Consulta de antecedentes médicos del paciente, diagnósticos y evolución.
- **Tratamientos y Procedimientos**: Registro y gestión de tratamientos indicados.

### 👩‍💼 2. Portal de Recepción
- **Panel de Inicio / Recepción**: Monitoreo en tiempo real del flujo de atención del día.
- **Gestión de Pacientes**: Directorio completo de pacientes, registro de nuevos ingresos y actualización de datos.
- **Agendamiento de Citas**: Asignación y reprogramación de citas médicas.
- **Historial de Atención**: Consulta rápida de registros de atención del día.

### 🛡️ 3. Portal de Administración (Director Médico)
- **Dashboard Ejecutivo**: Métricas generales del centro médico y estadísticas.
- **Gestión de Usuarios y Roles**: Administración de cuentas de acceso, roles y permisos del sistema.
- **Directorio de Profesionales**: Alta y gestión del personal médico.
- **Reportes y Estadísticas**: Reportes detallados de atención, demanda y rendimiento clínico.

---

## 🛠️ Tecnología y Librerías

- **Core**: React 19, TypeScript, Vite 8
- **Enrutamiento**: React Router DOM v7
- **Iconos**: Lucide React
- **Estilos**: Custom CSS con variables de diseño, diseño adaptativo (Responsive) y soporte para Modo Oscuro/Claro (`ThemeContext`).
- **Estado Global & Autenticación**: React Context API (`AuthContext`, `ThemeContext`).

---

## 📁 Estructura del Proyecto

```text
HEALTLAB_FRONTEND/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/             # Recursos gráficos e imágenes
│   ├── components/         # Componentes reutilizables
│   │   ├── common/         # Modales, botones, NotFound, etc.
│   │   ├── forms/          # Formularios reutilizables
│   │   ├── layout/         # Layout principal y Sidebar/Navbar (DashboardLayout)
│   │   └── ui/             # Componentes de interfaz gráfica
│   ├── constants/          # Constantes del sistema
│   ├── context/            # Proveedores de contexto (AuthContext, ThemeContext)
│   ├── hooks/              # Custom hooks de React
│   ├── pages/              # Módulos y vistas agrupadas por rol
│   │   ├── admin/          # Vistas de administración general
│   │   ├── auth/           # Login y autenticación
│   │   ├── professional/   # Vistas para el médico/profesional
│   │   └── recepcionista/  # Vistas para recepción
│   ├── routes/             # Configuración de rutas y protección por rol (AppRoutes.tsx)
│   ├── services/           # Servicios de integración con la API REST (api.ts, auth.service.ts, etc.)
│   ├── styles/             # Archivos CSS globales y temas
│   ├── types/              # Definiciones de tipos e interfaces TypeScript
│   └── utils/              # Funciones auxiliares y formateadores
├── index.html              # HTML base
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración de Vite
```

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (versión 18.0 o superior recomendada)
- **npm** (incluido con Node.js) o **pnpm** / **yarn**

---

## 📦 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd HEALTLAB_FRONTEND
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y define la URL del backend API:
   ```env
   VITE_API_BASE_URL=http://localhost:5077/api
   ```

---

## 🏃‍♂️ Scripts Disponibles

En la raíz del proyecto puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo local con Hot Module Replacement (HMR).
- `npm run build`: Compila el código TypeScript y genera el bundle optimizado para producción en `/dist`.
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores.
- `npm run preview`: Previsualiza localmente el build de producción generado.

---

## 🔗 Integración con Backend API

La comunicación con el backend se realiza mediante la función auxiliar `apiFetch` alojada en `src/services/api.ts`:
- Manejo automático de encabezados `Authorization: Bearer <token>`.
- Redirección automática al `/login` en caso de token expirado o respuesta `401 Unauthorized`.
- Servicios modulares dedicados:
  - `auth.service.ts`: Autenticación y sesión.
  - `patients.service.ts`: Gestión de datos del paciente.
  - `appointments.service.ts`: Control de agendamientos.
  - `professionals.service.ts`: Gestión del personal médico.
  - `users.service.ts` & `permissions.service.ts`: Permisos y usuarios.
  - `treatments.service.ts`: Tratamientos clínicos.

---

## 📄 Licencia

Este proyecto es de uso privado para el sistema de gestión **HealthLab**. Todos los derechos reservados.
