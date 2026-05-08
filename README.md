# SGIE — Sistema de Gestión de Instalaciones para Eventos

> **Prototipo GUI Interactivo** · Entrega de Etapa de Diseño  
> Proyecto de Software · Club Boyacá

---

## ¿Qué es este proyecto?

Este repositorio corresponde al **prototipo interactivo de interfaz gráfica de usuario (GUI)** del sistema **SGIE** *(Sistema de Gestión de Instalaciones para Eventos)*, desarrollado como entrega formal de la **etapa de diseño** dentro del ciclo de vida del proyecto de software.

El prototipo fue construido en **React + TypeScript** con el objetivo de validar flujos de navegación, jerarquía visual, estructura de pantallas y experiencia de usuario **antes** del inicio de la implementación funcional. Los datos mostrados son estáticos o simulados; no existe conexión a base de datos ni lógica de negocio real.

---

## Propósito del prototipo

| Aspecto | Descripción |
|---|---|
| **Tipo** | Prototipo de alta fidelidad (hi-fi) |
| **Alcance** | Navegación completa entre módulos principales |
| **Datos** | Estáticos / simulados (sin backend) |
| **Objetivo** | Validar diseño de pantallas, flujos y sistema de diseño antes del desarrollo |

---

## Vistas del prototipo

### 1. Dashboard Principal

<img width="1897" height="895" alt="image" src="https://github.com/user-attachments/assets/4eb1c3bd-036f-49d7-bf62-66a13aa37ddf" />

Vista de inicio del sistema. Muestra el calendario principal en vista mensual con los eventos programados del mes en curso. En la barra lateral derecha se presenta el panel de **Disponibilidad de Salones**, con un mini-calendario y el estado en tiempo real de cada espacio (Libre, Parcial, Ocupado). La navegación lateral incluye accesos directos a todos los módulos del sistema. El botón **Crear Solicitud** permite iniciar el flujo de registro de un nuevo evento desde cualquier punto de la aplicación.

---

### 2. Listado de Cotizaciones

<img width="1901" height="898" alt="image" src="https://github.com/user-attachments/assets/568d0d41-2ab0-4ec9-8960-33589712e7a9" />


Módulo de gestión del histórico maestro de ventas y servicios. Presenta una tabla paginada con las cotizaciones organizadas por pestañas: **Recientes**, **Pendientes** y **Aprobadas**. Cada registro muestra el ID de cotización, el nombre del evento, el cliente asociado con su tipo (Socio / No Socio), la fecha de creación, el valor total y el estado actual (Aceptada, Enviada, Borrador, Desactualizada, Rechazada). Se incluyen acciones rápidas por fila y opciones de **Filtros Avanzados** y **Exportar Excel**.

---

### 3. Gestión de Clientes
<img width="1918" height="901" alt="image" src="https://github.com/user-attachments/assets/b728f487-d40b-4e04-a25b-33b942653617" />


Módulo de administración del directorio de clientes. La tabla paginada organiza los registros por cédula, nombre completo, teléfono, correo electrónico, tipo de cliente (Socio / No Socio) y estado (Activo / Suspendido). Las pestañas superiores permiten filtrar entre **Todos**, **Socios** y **No Socios**. Incluye filtros avanzados y el botón **Nuevo Cliente** para registrar nuevos contactos desde un modal de formulario.

---

### 4. Gestión de Eventos

<img width="1883" height="902" alt="image" src="https://github.com/user-attachments/assets/4bccba08-37f4-4dc4-b30f-74b49cd404d2" />


Módulo central de administración de eventos. Cada registro muestra el ID del evento, la fecha, el cliente con su identificación, el salón asignado, el tipo de evento (Social, Boda, Corporativo) y el estado del proceso (Confirmado, Pendiente Anticipo, Cotización Enviada). La vista se organiza en pestañas **Historial** y **Activos**. Desde cada fila se puede visualizar el detalle completo del evento, editarlo o agregar observaciones. El botón **Nuevo Evento** inicia el flujo de creación.

---

## Módulos incluidos

El prototipo cubre las siguientes vistas funcionales:

- **Dashboard** — Calendario mensual/semanal/diario + panel de disponibilidad de salones
- **Cotizaciones** — Listado histórico con estados, paginación y exportación
- **Clientes** — Directorio de socios y no socios con gestión de estado
- **Eventos** — Gestión completa del ciclo de vida de cada evento, con sub-vistas de:
  - Resumen, Solicitud, Cotización, Menú, Montaje, Pagos y Agenda
- **Reports** — Módulo de reportes (navegación disponible)
- **Catalog Settings** — Configuración del catálogo (navegación disponible)

---

## Estructura del proyecto

```
SGIE/
├── src/
│   ├── main.tsx                    # Punto de entrada
│   ├── App.tsx                     # Enrutamiento principal
│   ├── layouts/
│   │   └── MainLayout.tsx          # Layout con Header y Sidebar
│   ├── pages/                      # Páginas / vistas principales
│   │   ├── CalendarPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── EventSummaryPage.tsx
│   │   ├── EventRequestPage.tsx
│   │   ├── EventQuotePage.tsx
│   │   ├── EventMenuPage.tsx
│   │   ├── EventMontagePage.tsx
│   │   ├── EventPaymentsPage.tsx
│   │   ├── EventAgendaPage.tsx
│   │   ├── ClientsPage.tsx
│   │   └── QuotesPage.tsx
│   ├── features/                   # Módulos por dominio
│   │   ├── calendar/
│   │   ├── events/
│   │   ├── clients/
│   │   ├── quotes/
│   │   └── availability/
│   ├── components/                 # Componentes reutilizables (Button, Card, Header, Sidebar)
│   ├── services/                   # Servicios simulados de datos
│   └── store/                      # Estado global (calendarStore)
├── SGIE_DesignSystem_Master.html   # Guía del sistema de diseño
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| [React 18](https://react.dev/) | Framework de UI |
| [TypeScript 5](https://www.typescriptlang.org/) | Tipado estático |
| [Vite 5](https://vitejs.dev/) | Bundler y servidor de desarrollo |
| [Tailwind CSS 3](https://tailwindcss.com/) | Estilos utilitarios |

---

## Requisitos previos

- **Node.js** v18 o superior → [descargar](https://nodejs.org/)
- **npm** v9 o superior (incluido con Node.js)

```bash
node -v
npm -v
```

---

## Cómo ejecutar el prototipo

### 1. Descomprime y accede al proyecto

```bash
cd SGIE
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Inicia el servidor de desarrollo

```bash
npm run dev
```

### 4. Abre en el navegador

```
http://localhost:5173
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera la build de producción en `/dist` |
| `npm run preview` | Previsualiza la build de producción localmente |

---

## Sistema de diseño

El archivo **`SGIE_DesignSystem_Master.html`** en la raíz del proyecto documenta la guía visual completa del sistema: paleta de colores, tipografía, componentes base y patrones de UI. Se recomienda consultarlo como referencia de consistencia visual durante el desarrollo.

---

## Contexto académico

Este prototipo es la entrega correspondiente a la **etapa de diseño** del proyecto de software SGIE. Su propósito es:

- Verificar que los flujos de navegación son coherentes con los requerimientos levantados.
- Detectar inconsistencias de UX antes de iniciar la implementación.
- Servir como referencia visual para el equipo de desarrollo en etapas posteriores.
- Comunicar de forma clara y ejecutable la propuesta de interfaz a los stakeholders del proyecto.

> **Nota:** Este prototipo no requiere backend. Todos los datos son simulados localmente. Las interacciones son ilustrativas; algunos elementos pueden no tener comportamiento asociado.
