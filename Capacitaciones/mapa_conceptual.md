# Mapa Conceptual y Arquitectura del Sistema: Onprotec Capacitaciones

Este documento sirve como la **guía de supervivencia técnica y funcional** para la aplicación web de gestión, control de aforo, finanzas e integraciones de la **Sala de Capacitaciones de Onprotec C.A.**

---

## 1. Título y Propósito

* **Aplicación:** Onprotec Capacitaciones (Control de Aforo, CRM y Rentabilidad de Formación Técnica).
* **Propósito:** Centralizar el registro público de participantes, la validación automática de pagos (Pabilo), el control del aforo físico limitado de la sala (**aforo máximo estricto: 18 participantes + 1 instructor en tarima**), la gestión de lista de espera prioritaria, el cálculo de rentabilidad financiera (ROI), el mapa de conversión/fidelización de clientes frente a compras de hardware en tienda (Odoo ERP) y el check-in en tiempo real con encuestas de satisfacción generadas por código QR.

---

## 2. Arquitectura General y Tecnologías

```mermaid
flowchart TD
    subgraph Publico [Acceso Público & Clientes]
        Landing["Landing Page / Registro Web"]
        PabiloPay["Pasarela Pabilo (Pago Móvil / Tarjeta / Transferencia)"]
        SurveyQR["Encuesta de Satisfacción (QR Escaneado)"]
    end

    subgraph Core [Aplicación Web Next.js 15 - Widescreen First]
        AppServer["Next.js Server / Standalone Runner (Puerto Host 6008 -> 3000)"]
        AutoMigrate["AutoMigrate DDL Idempotente"]
        FormatUtils["FormatUtils (America/Caracas UTC-4)"]
        
        subgraph ModulosAdmin [Módulos Administrativos]
            DashboardKPIs["Dashboard KPIs (No-Show, ROI, Fidelización, Pagos)"]
            CapacitacionesMgr["Gestor de Capacitaciones & Costos"]
            InscripcionesMgr["Matriz de Inscripciones & Facturas"]
            CheckinMgr["Check-in en Sala (Aforo 1 a 18 & Modo Proyector QR)"]
            ParticipantesCRM["CRM de Participantes & Historial Tienda"]
        end
    end

    subgraph Integraciones [Integraciones & APIs Externas]
        OdooERP["Odoo 16 ERP (Catálogo de SKUs & Hardware Prácticas)"]
        PabiloAPI["Pabilo API (Webhook Conciliación Automática)"]
        WhatsAppAPI["WhatsApp (Meta Graph API / Baileys: Confirmación, 24h, Encuesta)"]
    end

    subgraph Database [Persistencia & Despliegue]
        PostgresDB[(PostgreSQL 16 Alpine)]
        Coolify["Coolify PaaS (Puerto Host: 6008)"]
        CloudflareTunnel["Cloudflare Tunnel (capacitacion.tutecnoservicio.com -> 192.168.1.32:6008)"]
    end

    Landing -->|POST /api/inscripciones| AppServer
    PabiloPay -->|Webhook POST /api/pabilo/webhook| AppServer
    SurveyQR -->|POST /encuesta/:id| AppServer
    
    AppServer --> AutoMigrate
    AppServer --> PostgresDB
    AppServer <--> OdooERP
    AppServer <--> PabiloAPI
    AppServer <--> WhatsAppAPI
    
    Coolify --> AppServer
    Coolify --> PostgresDB
    CloudflareTunnel --> AppServer
```

### Stack Técnico:
* **Framework:** Next.js 15 (App Router) con TypeScript y modo `standalone` para Docker.
* **Base de Datos & ORM:** PostgreSQL 16 con Drizzle ORM (`drizzle-orm` + `pg`).
* **Auto-Migraciones:** Script `src/lib/autoMigrate.ts` idempotente (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
* **Estilos & Diseño:** Tailwind CSS con paleta Onprotec Navy/Cyan/Blue y arquitectura Widescreen-First.
* **Zona Horaria:** `America/Caracas` (UTC-4) obligatoria vía `src/utils/formatUtils.ts`.
* **Despliegue:** Dockerfile multi-stage (Node 22-alpine), `docker-compose.yml`, Coolify y Cloudflare Tunnel.

---

## 3. Características Globales y Filosofía UX/UI

1. **Widescreen-First (Sin Scroll Vertical Innecesario):**
   * En pantallas de escritorio (1080p, 1440p, laptops), la información de primer nivel y métricas críticas se presentan en filas horizontales de 4 columnas o paneles paralelos tipo Split View.
   * Cintillo de navegación fijo (`sticky top-0 z-50`) con estado de integraciones (Odoo, Pabilo, Hora Venezuela).
   * Se reorganiza a flujo vertical amigable únicamente en dispositivos móviles o tablets (`max-width: 768px`).

2. **Horarios Locales Respetados (America/Caracas):**
   * Todas las fechas de eventos, aperturas de publicidad, confirmaciones 24h y timestamps de check-in se guardan en UTC en base de datos pero se renderizan forzosamente en `America/Caracas` (UTC-4) mediante `fmtLocalTime` y `fmtLocalDate`.

---

## 4. Detalle por Módulos y Lógica de Negocio

### A. Control de Aforo y Gestión de Cupos (Sala Onprotec)
* **Regla de Capacidad:** La sala física cuenta con una capacidad máxima estricta de **18 puestos para participantes** y **1 puesto para el instructor**.
* **Condición de Sobrecupo y Lista de Espera:**
  $$\text{Ocupación Activa} = \text{Inscritos} + \text{Confirmados} + \text{Asistió}$$
  * Si $\text{Ocupación Activa} < 18$: El participante ingresa con estado **`Inscrito`**.
  * Si $\text{Ocupación Activa} \ge 18$: La aplicación le asigna automáticamente el estado **`Lista de Espera`**. En la UI pública se notifica que los 18 cupos están cubiertos y que su puesto es prioritario ante cancelaciones.

### B. Funnel de Asistencia y Tasa de No-Show
* **Fórmula de Tasa de No-Show:**
  $$\text{Tasa No-Show (\%)} = \left(\frac{\text{No Asistió}}{\text{Confirmados}}\right) \times 100$$
* **Fórmula de Asistencia Efectiva:**
  $$\text{Asistencia Efectiva (\%)} = \left(\frac{\text{Asistió}}{\text{Confirmados}}\right) \times 100$$
* **Flujo Operativo:**
  1. Inscrito en landing web.
  2. Disparo de WhatsApp 24 horas antes solicitando confirmación.
  3. Cambio de estado a `Confirmado`.
  4. El día del evento en la puerta de la sala: Check-in presencial $\rightarrow$ Estado `Asistió`.
  5. Quien confirmó pero no asistió $\rightarrow$ Estado `No Asistió`.

### C. Retorno de Inversión (ROI Financiero)
* **Ingresos Brutos:** Sumatoria de las inscripciones con `isPaid = true` (en USD o contravalor en Bs).
* **Costos Totales:**
  $$\text{Costos Totales} = \text{Costos de Publicidad (Meta/Google Ads)} + \text{Costos Asociados (Refrigerios, Materiales, Logística)}$$
* **Utilidad Neta:**
  $$\text{Utilidad Neta} = \text{Ingresos Brutos} - \text{Costos Totales}$$
* **Porcentaje de ROI:**
  $$\text{ROI (\%)} = \left(\frac{\text{Utilidad Neta}}{\text{Costos Totales}}\right) \times 100$$

### D. Mapa de Fidelización y Cross-Selling de Hardware
* **Objetivo:** Medir la efectividad de las capacitaciones técnicas como gancho comercial para vender equipos de la tienda Onprotec.
* **Métricas:**
  * **Clientes Existentes:** Participantes con `hasStorePurchases = true`.
  * **Prospectos Vírgenes:** Participantes técnicos/instaladores que **no** han comprado en tienda.
  * **Recurrentes Sin Compra:** Porcentaje de alumnos que han asistido a más de 1 capacitación pero todavía no compran suministros físicos.

### E. Integraciones
1. **Odoo ERP:**
   * Conexión JSON-RPC con `product.template` para importar los SKUs de los equipos que se utilizan en los laboratorios prácticos (cámaras Hikvision, grabadores NVR, fusionadoras de fibra, biométricos).
2. **Pabilo Pay:**
   * Validación automática de pagos con webhook firmado mediante HMAC-SHA256 (`/api/pabilo/webhook`).
   * Al validarse la transacción en Pabilo, la inscripción pasa automáticamente a `isPaid = true` y estado `Confirmado`.
3. **WhatsApp Engine:**
   * Automatización de 3 plantillas críticas: Confirmación inmediata de registro, recordatorio 24h antes del evento con la ubicación de la sala Onprotec, y envío del link de encuesta post-evento.
4. **Códigos QR de Encuesta:**
   * Generación de código QR único por evento para evaluar al instructor, contenido e instalaciones de la sala (escala 1 a 5 y NPS 1 a 10).
   * Modo Kiosk / Proyector en el módulo de Check-in para proyectar el QR en pantalla gigante.

---

## 5. Instrucciones de Despliegue en Coolify & Cloudflare Tunnel
 
 1. **Creación en Coolify:**
    * Tipo: **Application from Git Repository** o **Docker Compose**.
    * Puerto expuesto / Mapeo de puertos: **`6008:3000`** (Host Port 6008 apuntando al contenedor 3000).
    * Dominio FQDN: **`https://capacitacion.tutecnoservicio.com`**.
    * Variables de entorno: Importar desde `.env.example`.
 2. **Base de Datos PostgreSQL:**
    * Utilizar el servicio `db` de `docker-compose.yml` o el servicio gestionado de PostgreSQL en Coolify.
 3. **Cloudflare Tunnel:**
    * Configurar ruta: `capacitacion.tutecnoservicio.com` $\rightarrow$ `http://192.168.1.32:6008`.

---

## 6. Ingesta de Formularios Históricos Reales & Catálogo Odoo

A partir del volcado real de Google Forms (hojas de cálculo `.xlsx`) y exportación de Odoo en `Formularios/`:
* **Capacitaciones Procesadas:** 38 eventos reales organizados por marcas aliadas (Hikvision, Dahua, TP-Link Omada, WatchGuard/SGSI, Ubiquiti UniFi, Marsriva, EZVIZ).
* **Participantes Únicos:** 630 integradores y técnicos normalizados y deduplicados por Cédula/RIF, correo electrónico y número de WhatsApp.
* **Inscripciones Históricas:** 1.283 registros cargados con aforo máximo de 18 cupos por sesión presencial y asignación a Lista de Espera a partir del cupo 19.
* **Encuestas de Satisfacción:** 256 evaluaciones post-evento con calificaciones del instructor, contenido, comodidad de sala Onprotec y sugerencias de certificación oficial (ej. HCSA Hikvision).
* **Regla de Negocio Crítica:** La única capacitación que generó costo de inscripción fue **"De Cero a UniFi: Redes Inalámbricas y Wi-Fi Profesional"** ($60 USD, métodos Binance USDT/Pago Móvil y enlaces a comprobantes en Google Drive); todas las demás capacitaciones fueron 100% gratuitas ($0 USD).
* **Campos Nuevos Auto-Migrados:**
  * En `participants`: `cargo`, `city`, `experience_level`, `referral_source`, `allows_contact`. `doc_number` hecho nullable para formularios que solo capturaron WhatsApp.
  * En `registrations`: `original_form_name`, `form_submitted_at`, `payment_notes`, `experience_level`.
  * En `surveys`: `participant_name`, `company`, `cargo`, `most_liked`, `suggestions`, `wants_future_certifications`, `has_active_projects`, `submitted_at`.
  * Sincronizados e implementados de manera idempotente mediante `src/lib/autoMigrate.ts` con protección `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## 7. Validación Manual de Pagos y Auditoría ("De Cero a UniFi")

* **Conciliación Híbrida (Manual vs. Pabilo):**
  * **Pabilo Pay (Automático):** Diseñado para cobros en línea a través de la web pública (`api.pabilo.app`) mediante Webhook y firma HMAC.
  * **Validación Manual (Comprobantes / Caja):** Permite al personal administrativo de Onprotec marcar pagos en efectivo, transferencias bancarias nacionales, Zelle o Binance USDT directamente desde la matriz `/admin/inscripciones`.
* **Caso de Auditoría Real ("De Cero a UniFi" - $60 USD):**
  * **Total Inscritos:** 18 participantes en sala.
  * **Asistentes con Pago Validado (17 personas):** Pagaron vía Binance USDT, Zelle o Efectivo en oficina y asistieron a la capacitación. Total recaudado: **$1.020,00 USD** (`pabiloStatus: 'manual'`).
  * **Participante que Faltó y No Pagó (1 persona - Steven Pinto, C.I. 29948073):** Registrado sin comprobante ni método especificado. Estado: **`No Asistió`**, **`isPaid: false`**, **`pabiloStatus: 'pending'`** con saldo pendiente de **$60,00 USD**.
* **Persistencia:** Cualquier cambio en la matriz de inscripciones se envía vía `PATCH /api/inscripciones` y se sincroniza en caliente con la base de datos y dataset del sistema.

---

## 8. Gestión Avanzada de Capacitaciones, Formularios Dinámicos, Encuestas, Historial de Participación y Credenciales OnProtec

### A. Identidad Corporativa OnProtec (`www.onprotec.com`) & Tema Claro / Oscuro
* **Recursos Oficiales Extraídos (`public/brand/`):** Logotipos oficiales `onprotec-logo-full.png`, `onprotec-logo-web.webp`, `onprotec-icon.png` y banner promocional `onprotec-hero-banner.avif` extraídos de `www.onprotec.com` («La Tienda del Instalador»).
* **Paleta Oficial:** Azul Marino Corporativo (`#1a1b4b`), Naranja Corporativo (`#e07b29`) y Azul Tecnológico (`#2a92f7`).
* **Selector de Vista Claro / Oscuro (`src/components/ThemeToggle.tsx`):** Botón persistente en la barra superior (Portada, Encuesta y Admin) que conmuta entre **Vista Oscura** y **Vista Clara** corporativa mediante `data-theme="light" | "dark"`, `localStorage` y `<meta name="color-scheme">`.

### B. Editor Integral de Capacitaciones (`PUT /api/capacitaciones` & Botón Editar)
* **Corrección de Aforo `CAP-2026-039`:** Se corrigió la generación de IDs en `POST /api/capacitaciones` utilizando `Math.max(...ids) + 1` en lugar de `length + 1`, reasignando el evento histórico HikCentral a `CAP-2026-014` y dejando **`CAP-2026-039` ("Gestiona y Monetiza tus clientes Dahua con DoLynk Care ☁️💼", Instructor: Alejandro Quijada)** con `0 / 18` cupos ocupados (`18 cupos disponibles`).
* **Edición Completa en 4 Pestañas (`/admin/capacitaciones`):**
  1. **Datos Generales & Costos:** Edición de nombre, código, marca aliada, instructor, fechas, estado, aforo, precios, costos y SKUs de Odoo.
  2. **Nota para la Presentación & Fotos de Portada (`presentationNotes`, `coverImageUrl`, `coverPhotos`):** Permite redactar notas destacadas para la presentación del curso e insertar múltiples fotografías para la portada subiendo archivos desde el computador (Base64 DataURL) o mediante URL.
  3. **Redacción de Preguntas del Formulario (`formQuestions`):** Constructor dinámico para redactar, agregar o eliminar preguntas personalizadas del formulario de inscripción (`text`, `textarea`, `select`, `radio`, `checkbox`), cuyas respuestas se almacenan en `registrations.custom_answers`.
  4. **Constructor de Encuesta al Final del Curso (`surveyQuestions` & `/api/encuestas`):** Permite redactar las preguntas de evaluación post-curso (`rating` 1-5, `nps` 0-10, `select`, `textarea`), proyectar el código QR y consultar las respuestas y promedios en tiempo real.

### C. Historial de Participación por Inscrito (`/api/participantes` & `/admin/participantes`)
* Tanto en el **Directorio CRM (`/admin/participantes`)** como en la **Matriz de Inscripciones (`/admin/inscripciones`)**, cada inscrito muestra el desglose exacto de **todas las capacitaciones donde ha participado** (`participations`), incluyendo código, nombre del curso, marca, fecha local en Caracas y estado (`Asistió`, `Confirmado`, `Inscrito`, `Lista de Espera`, `No Asistió`), además de un filtro dedicado para **Recurrentes (2+ Cursos)**.

### D. Sistema de Credenciales de Acceso Administrativo (`admin_users` & `/api/auth`)
* **Protección de `/admin`:** Pantalla de inicio de sesión corporativa en `src/app/admin/layout.tsx` respaldada por cookies de sesión HTTP-only (`onprotec_admin_session`) y la tabla `admin_users` (sincronizada en `src/db/schema.ts` y `src/lib/autoMigrate.ts`).
* **Módulo `/admin/credenciales`:** Gestión de usuarios administrativos, roles (`Super Admin`, `Gerencia General`, `Coordinador de Sala`, `Finanzas y Pagos`, `Recepción Check-in`), cambio de contraseñas y activación/desactivación de cuentas.

