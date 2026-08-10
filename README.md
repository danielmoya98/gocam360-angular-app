# 🎥 gocam360 Enterprise Platform

[![Angular](https://img.shields.io/badge/Angular-v22+-DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Render-Deploy_Ready-46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

Plataforma SaaS Enterprise para la gestión de **Eventos 360°**, transmisión en tiempo real a **Muro en Vivo (Live Wall)**, captura de invitados mediante **Web Mobile QR** con verificación OTP, administración de **Cola de Impresiones Térmicas DNP/Fuji**, módulo **CRM de Prospectos Comerciales** y **Bitácora de Auditoría** de seguridad.

---

## 🌟 Características Principales

- **⚡ Arquitectura Moderna con Angular Signals**: Estado reactivo de alto rendimiento utilizando Signals, `computed()` y `effect()`.
- **🎨 Diseño Acme Dark Obsidian**: Estética premium con Tailwind CSS 4, micro-animaciones Bézier a 60 FPS y selector de tema claro/oscuro.
- **📲 Captura Web Mobile QR de Invitados**: Registro directo de números móviles mediante OTP para descarga de videos e impresiones.
- **🖨️ Estación de Impresión Térmica**: Gestión visual de la cola de impresión física para impresoras DNP / Fuji en formato 10x15.
- **📊 Resumen Ejecutivo & CRM Prospectos**: Visualización de métricas en tiempo real, estado de clientes prospecto y botón de contacto por WhatsApp.
- **🛡️ Bitácora de Auditoría & Seguridad**: Registro en tiempo real de accesos, roles (SUPERADMIN / ADMIN) y acciones críticas.
- **🆘 Centro de Ayuda & Soporte Técnico**: Acordeón interactivo de preguntas frecuentes con búsqueda reactiva y botón de soporte WhatsApp.

---

## 🚀 Despliegue en Render (Static Site)

Esta aplicación está **100% optimizada para ser desplegada de forma gratuita en Render**:

1. Crea un nuevo **Static Site** en tu cuenta de [Render Dashboard](https://dashboard.render.com/).
2. Conecta este repositorio de GitHub: `danielmoya98/gocam360-angular-app`.
3. Configura los siguientes parámetros (o usa el archivo `render.yaml` incluido):
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `./dist/angular-setup-ai/browser`
   - **Rewrites (Single Page App)**:
     - `Source`: `/*`
     - `Destination`: `/index.html`

---

## 💻 Desarrollo Local

### Prerrequisitos
- **Node.js**: `v20.x` o superior
- **npm**: `v10.x` o superior

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/danielmoya98/gocam360-angular-app.git

# 2. Entrar al directorio
cd gocam360-angular-app

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run start
```

Abre tu navegador en `http://localhost:4200/` para explorar la plataforma.

---

## 📦 Scripts Disponibles

- `npm run start`: Inicia el servidor local de desarrollo (`ng serve`).
- `npm run build`: Compila la aplicación en producción para Render / CDN (`ng build`).
- `npm run test`: Ejecuta las pruebas unitarias.

---

## 🛡️ Licencia

Desarrollado para la suite **gocam360 Enterprise**. Todos los derechos reservados.
