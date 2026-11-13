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

1. **Widescreen-First, Carta de Presentación Ejecutiva & Carrusel Rotante:**
   * En pantallas de escritorio (1080p, 1440p, laptops), la información de primer nivel y métricas críticas se presentan en formato apaisado de alta legibilidad.
   * **Banner Carrusel de Fotos Rotantes en Portada:** Ubicado en la columna derecha del Hero (`lg:col-span-5`), ocupa el espacio visual destacado con un carrusel interactivo con fotos de alta resolución de las capacitaciones y marcas oficiales (Dahua, Hikvision, UniFi, TP-Link). Rota automáticamente cada 5 segundos (se pausa al pasar el cursor) y dispone de flechas de navegación y puntos indicadores. **Al hacer clic en cualquier slide o en el botón de acción**, selecciona automáticamente esa capacitación y realiza scroll suave directamente al formulario de inscripción (`#registro-express`), sincronizando de inmediato el evento.
   * La Landing Page pública funciona como la **carta de presentación ejecutiva de la Sala de Capacitaciones OnProtec en Torre América Piso 14**, con layout split-view (7 cols convocatoria/temario, 5 cols carrusel visual y formulario con comprobante de pago).
   * Cintillo de navegación fijo (`sticky top-0 z-50`) con marca oficial y acceso administrativo seguro.
   * Se reorganiza a flujo vertical amigable únicamente en dispositivos móviles o tablets (`max-width: 768px`).

2. **Autenticación Administrativa & Usuario Master Principal:**
   * **Portal Administrativo Protegido (`/admin/*`):** El acceso al panel administrativo está 100% blindado mediante solicitud de usuario/correo corporativo y contraseña con tokens criptográficos de sesión HTTP-only.
   * **Usuario Master Principal:** `juan@onprotec.com` (o usuario `juan`) con contraseña `5197148` y rol `Super Admin Master`, con acceso total a métricas, finanzas, edición/eliminación de cursos y gestión de credenciales.
   * **Seguridad Visual Reforzada:** Se eliminaron las cajas de contraseñas visibles en texto plano, reemplazándolas por políticas corporativas de seguridad y campos con enmascaramiento seguro y conmutador de visibilidad.
   * **Comunicaciones Oficiales:** Todos los mensajes de confirmación y botones de WhatsApp se dirigen al *"Equipo de OnProtec"*, garantizando una voz institucional uniforme.

3. **Control de Contraste y Modos de Color (Dark/Light):**
   * Configuración de Tailwind `darkMode: "class"` controlada por selector explícito en `<html>` (`.dark` / `[data-theme]`), evitando que sistemas operativos en modo oscuro fuercen clases oscuras sobre vistas claras.
   * Regla de Alto Contraste en Modo Claro: Textos oscuros (`#0f172a`, `#1e293b`, `#475569`) sobre fondos blancos/grises, garantizando máxima legibilidad en todas las vistas administrativas (Directorio de Participantes, Gestor de Capacitaciones, Check-in).

3. **Horarios Locales Respetados (America/Caracas):**
   * Todas las fechas de eventos, aperturas de publicidad, confirmaciones 24h y timestamps de check-in se guardan en UTC en base de datos pero se renderizan forzosamente en `America/Caracas` (UTC-4) mediante `fmtLocalTime` y `fmtLocalDate`.

---

## 4. Detalle por Módulos y Lógica de Negocio

### A. Control de Aforo, Privacidad y Gestión de Cupos
* **Sede Oficial y Política de Privacidad de Ubicación:**
  * **Ubicación Física Real:** **Torre América, Piso 14, Urbanización El Recreo, Caracas, Venezuela** (gestionable y editable en panel privado).
  * **Resguardo Público:** En la landing page pública **se oculta la dirección exacta y piso** para prevenir la llegada de personas no inscritas ni invitadas. Se presenta como *"Sede Corporativa OnProtec (Caracas)"*, informando al usuario que la dirección detallada y coordenadas se despachan por WhatsApp tras confirmar su invitación o pago.
* **Aforo Físico de Sala:** Capacidad física máxima estricta de **18 puestos para participantes** y **1 puesto para el instructor**.
* **Lógica Dual de Aforo OnProtec (Gratuito vs. Cobrado):**
  1. **Presentaciones Gratuitas (`isFree = true`):**
     * Meta de pre-inscripción ampliada de **30 hasta 40 participantes**.
     * Esta holgura permite al equipo de OnProtec contactar y reconfirmar telefónicamente a los **18 asistentes presenciales finales**, mitigando el No-Show habitual de los eventos sin costo.
     * Solo si la pre-inscripción supera los 40 registros entra en estado **`Lista de Espera`**.
     * **Confirmación Post-Envío:** Informa claramente que el participante está **Pre-inscrito**, explicando que se realiza una preselección de asistentes para garantizar la rotación y diversidad de técnicos en sala antes de remitir la invitación formal.
  2. **Actividades Cobradas / Pagas (`isFree = false` o `price > 0`):**
     * Aforo estricto de **solo 18 puestos VIP garantizados**.
     * Exige método de pago, referencia de transacción y **zona de carga de comprobante de pago (voucher/captura/PDF)**.
     * **Métodos de Pago Expresados:** La lista de métodos de pago en el formulario solo exhibe los expresamente configurados para ese curso.
     * **Confirmación Post-Envío:** Notifica de inmediato que el participante está **Formalmente Inscrito** con cupo VIP asegurado.
* **Validación Anti-Duplicados:**
  * El sistema valida mediante normalización de caracteres que ningún número de Cédula o RIF (o correo electrónico) se registre más de una vez en la misma capacitación activa. Retorna error `409 Conflict` con indicaciones claras para contactar al equipo de OnProtec vía WhatsApp si requiere gestionar su registro.
* **Sección de Preguntas del Formulario 100% Editable:**
  * El título y la descripción de la sección técnica del formulario público son completamente editables por curso desde la pestaña de preguntas del panel administrativo (`formQuestionsTitle` y `formQuestionsDescription`).
* **Condición de Sobrecupo y Lista de Espera:**
  $$\text{Ocupación Activa} = \text{Inscritos} + \text{Confirmados} + \text{Asistió}$$
  * Si $\text{Ocupación Activa} < \text{Capacidad Efectiva}$ (18 para pagos, 40 para gratuitos): Estado **`Inscrito`**.
  * Si $\text{Ocupación Activa} \ge \text{Capacidad Efectiva}$: Estado **`Lista de Espera`**.

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

---

## 9. Reestructuración Arquitectónica UX/UI & CRO de Alta Conversión (`src/app/page.tsx`)

Se reconstruyó desde cero la página principal de **"OnProtec® | Sala de Capacitaciones — La Tienda del Instalador"** aplicando principios de Optimización de Tasa de Conversión (CRO) y extrayendo el sistema de diseño exacto de `https://onprotec.com/lp/onprotec`:

1. **Identidad Visual Extraída de `www.onprotec.com`:**
   * **Paleta Oficial:** Naranja Vibrante Primario (`#f4730a` / hover `#ef7922`), Azul Marino Corporativo (`#2a285c` / `#29275c`), Amarillo Cashea (`#fdff00`), Verde WhatsApp (`#25d366`) y fondo limpio con espacio en blanco generoso (`#f8f9fc` / `#ffffff`) por defecto en Modo Claro (`data-theme="light"`), manteniendo soporte completo para Modo Oscuro (`<ThemeToggle />`).
   * **Tipografía y Lenguaje Gráfico:** Fuente geométrica `'Montserrat'` / `'Mont'` (pesos 400 a 900), titular icónico **"La tienda del INSTALADOR"** con texto contorneado (`.text-stroke-orange`), línea punteada naranja (`.onprotec-dotted-line`), patrón hexagonal de fondo (`.onprotec-hex-bg`) y píldoras naranjas de categorías (`REDES`, `CCTV`, `SEGURIDAD`, `COMPUTACIÓN`).
2. **Hero Section (Impacto, Exclusividad y Enganche):**
   * Cintillo superior naranja oficial + Header blanco con buscador en vivo, navegación rápida y acceso administrativo.
   * Propuesta de valor inmediata destacando la exclusividad del laboratorio (**18 puestos técnicos + 1 especialista**), CTA de alto contraste (*"Asegura tu cupo ahora"*) y tarjeta interactiva del evento destacado con galería de fotos de portada (`coverPhotos`), nota de presentación (`presentationNotes`) y barra de escasez de cupos en tiempo real.
3. **Sección de Propuesta de Valor (Grid Empresarial de 4 Pilares):**
   * Tarjetas con íconos modernos y alto respiro visual que destacan: (1) Equipos Energizados en Vivo, (2) Aforo VIP Estricto 18+1, (3) Acreditación Oficial QR y (4) Rentabilidad Comercial & Cashea.
4. **Organización Visual de la Información (Insignias y Línea de Tiempo):**
   * Catálogo filtrable por vertical tecnológica, marca o búsqueda de texto con insignias escaneables (fecha y hora en `America/Caracas`, inversión y barra de ocupación).
   * **Línea de Tiempo (Timeline) de 4 Etapas:** Acreditación QR (08:30 AM) $\rightarrow$ Arquitectura & Dimensionamiento (09:00 AM) $\rightarrow$ Laboratorio Hands-On en Vivo (10:45 AM) $\rightarrow$ Evaluación QR & Beneficios (12:00 PM).
5. **Fricción Cero en el Registro (`#registro-express`):**
   * Formulario corporativo sticky agrupado lógicamente (1. Identificación del Instalador, 2. Contacto & Empresa Integradora, 3. Perfil Técnico / Preguntas Dinámicas `formQuestions`, 4. Reporte de Pago condicional) utilizando **etiquetas flotantes (`peer` Floating Labels)** y botón ancho de confirmación.
6. **Prueba Social, Autoridad y Cintillo Oficial Cashea:**
   * Tarjetas interactivas de marcas certificadas (`Hikvision`, `Dahua Technology`, `TP-Link / Omada`, `Ubiquiti UniFi`, `WatchGuard`, `EZVIZ`, `Marsriva`), cintillo oficial `.cashea-banner` (`#fdff00` con `/brand/icono-cashea.png`) y botón flotante `.float-wa` de WhatsApp (`http://wa.me/584129635648`).

---

## 10. Control de Asistencia en Mesa, Ficha de Datos del Inscrito & Formato Físico de Lista de Asistencia

Atendiendo los requerimientos operativos de Coordinación de Sala (Diana Barrero):

1. **Bloqueo Estricto de Inscripciones en Eventos Finalizados / Pasados:**
   * Tanto en la API (`POST /api/inscripciones`) como en la Landing Page (`src/app/page.tsx`), las capacitaciones con estado `Finalizado`, `Cancelado` o fuera de convocatoria activa bloquean el formulario.
   * En la interfaz pública se introdujo el selector de pestañas: **Convocatorias Abiertas (Inscripción Activa)** vs. **Histórico de Talleres (Archivo)**. Si un usuario inspecciona un taller pasado, se presenta una tarjeta informativa de cierre con botón para saltar al evento abierto vigente.

2. **Inspección Integral de Datos del Inscrito (`viewingDetailsReg`):**
   * En la matriz `/admin/inscripciones` y en `/admin/participantes`, se añadió el botón **"👁️ Ver Datos"** y enlace en el nombre del participante.
   * Abre una ficha completa widescreen que muestra: Cédula, WhatsApp (enlace directo), Email, Ciudad, Empresa, Cargo, Nivel de experiencia, Fuente de referencia, **todas las respuestas dinámicas a las preguntas redactadas del formulario (`customAnswers`)**, detalles de pago/factura y notas especiales.

3. **Logos Oficiales OnProtec (Color y Blanco Vectorial):**
   * Actualizados en `public/brand/` con los nuevos activos provistos (`onprotec-logo-color.png` y `onprotec-logo-white.png`), adaptándose automáticamente a vistas claras y oscuras en cabeceras, modales y pie de página.

4. **Toma de Asistencia Interactiva (1-Tap Check) y Carnet Físico:**
   * En `/admin/checkin` ("Lista de Asistencia & Check-in"), Diana puede dar un solo clic a **`[ ✓ Marcar Presente ]`** / **`[ ✓ ASISTIÓ ]`**, registrando la hora exacta en Caracas (`America/Caracas`) y actualizando en tiempo real el termómetro de ocupación de sala (1 a 18).
   * Campo editable en línea de **Nº de Carnet Físico** (`carnetNumber`) para ingresar a mano los carnets (ej. 01, 09, 15) como se hace en mesa de recepción.

5. **Generador de Formato Físico de Asistencia (Print / PDF / CSV):**
   * Botón **"🖨️ Generar Lista de Asistencia (PDF / Imprimir)"** que reproduce el diseño exacto del formato físico de recepción:
     * Cabecera oficial con Logo OnProtec, Título del Evento, Badge de Confirmados y Aforo Máximo.
     * Tira de datos: Evento/Código, Fecha Caracas, Estatus e Instrucción de Mesa ("Escribir Nº Carnet a mano").
     * Tabla formateada: `Nº`, `NOMBRE Y APELLIDO`, `CÉDULA DE IDENTIDAD`, `EMPRESA / PROYECTO`, `Nº DE CARNET (A MANO)`, `HORA`, `FIRMA`.
     * Filas adicionales en blanco para registros de último momento.
     * Pie de validación con líneas para `Responsable del Registro en Mesa` y `Coordinador del Evento (Firma y Sello)`.
   * Soporte para exportación instantánea en formato Excel / CSV.




6. **Sistema Dinámico de Contraste Tipográfico (Modo Claro vs. Modo Oscuro):**
   * **Modo Claro:** Tipografías, títulos (`h1`, `h2`, `h3`, `h4`, `th`), celdas de tabla e inputs se renderizan en tonos oscuros de alto contraste (`#0f172a`, `#1e293b`, `#334155`) sobre fondos blancos/grises (`#ffffff`, `#f8f9fc`). Todos los botones coloreados (`#f4730a`, `#2a285c`, `.bg-emerald-600`, etc.) preservan estrictamente su tipografía en blanco puro (`#ffffff !important`).
   * **Modo Oscuro:** Tipografías, encabezados e inputs se renderizan en tonos claros (`#ffffff`, `#f1f5f9`, `#e2e8f0`) sobre fondos oscuros (`#0b0e17`, `#111526`), con inputs en fondo oscuro y texto blanco.
   * **Adaptación de Logos:** Sobre superficies claras se muestra el logotipo a color (`onprotec-logo-color.png`), mientras que sobre superficies oscuras o pie de página `#2a285c` se renderiza el logotipo blanco monocromático (`onprotec-logo-white.png`).

7. **Corrección de Legibilidad en Panel Administrativo (Modo Claro) y Ajuste de Personal:**
   * **Legibilidad en Modo Claro:** Se eliminaron las clases de bajo contraste en `/admin/participantes`, `/admin/inscripciones`, `/admin/checkin` y `/admin/capacitaciones`. Títulos, nombres de participantes, cédulas, empresas y teléfonos ahora se muestran en tonos oscuros de alto contraste (`#0f172a`, `#1e293b`, `#0e5cd7`) sobre fondos claros, y los badges de estado (`Asistió`, `Confirmado`, `Prospecto Virgen`) utilizan fondos pastel con tipografía saturada de alta legibilidad.
   * **Depuración de Personal:** Se eliminó cualquier referencia a "Rafael Herrera", asignando la responsabilidad de coordinación y registro en mesa directamente a **Diana Barrero / Coordinación de Sala**.

8. **Subida y Gestión de Comprobantes de Pago (Archivos / Vouchers en Formulario Dinámico y Registro Express):**
   * **Constructor de Preguntas (`/admin/capacitaciones`):** Soporte nativo para preguntas de tipo `file` ("📎 Subir Archivo / Comprobante de Pago") con botón de 1 clic `+ Comprobante de Pago` en la pestaña 3.
   * **Formulario Público (`src/app/page.tsx`):**
     * Área interactiva con arrastrar y soltar (drag & drop) o selector de archivos para comprobantes (JPG, PNG, WEBP, PDF hasta 8MB) que genera vista previa instantánea con botón de eliminación.
     * Disponible tanto en preguntas personalizadas dinámicas de tipo `file` como en el "Grupo 4: Reporte de Pago" para capacitaciones pagas.
   * **Visualización Administrativa (`/admin/inscripciones` y `/admin/participantes`):**
     * Tabla y modal de detalle permiten previsualizar miniaturas en tiempo real y abrir/descargar el voucher adjunto con un solo clic.

---

## 11. Arquitectura de Persistencia Robusta en Producción (Docker Volume en Coolify & Backups Automáticos)

Para erradicar por completo la pérdida de capacitaciones, preguntas personalizadas, inscritos o encuestas recién creadas al desplegar nuevas versiones de la aplicación desde Git:

1. **Volumen Persistente de Docker en Coolify (`/app/data`):**
   * Se configuró y vinculó a la aplicación de Coolify (`jzhfwt5pm8hanaoy8w60lwdl`) un almacenamiento persistente (`type: persistent`, volumen `jzhfwt5pm8hanaoy8w60lwdl-onprotec_capacitaciones_data`, `mount_path: /app/data`).
   * La variable de entorno `DATA_DIR=/app/data` define la ubicación física del archivo maestro `realFormsData.json`.
   * En cada despliegue, Docker desacopla y vuelve a montar este volumen intacto, garantizando que ninguna capacitación (ej. `CAP-2026-040`) ni registro (ej. `#1284`) sea eliminado o reseteado al compilar una nueva imagen.

2. **Módulo Centralizado de Persistencia (`src/lib/serverStorage.ts`):**
   * Determina inteligentemente la ruta de almacenamiento según el entorno (`DATA_DIR` $\rightarrow$ `/app/data` $\rightarrow$ `./data` $\rightarrow$ `src/lib/realFormsData.json`).
   * **Arranque Idempotente:** Si el volumen está vacío (primer arranque), siembra automáticamente los 40 cursos y registros históricos. Si ya existe, carga la base viva con todos los cambios y creaciones del usuario.
   * **Escritura Atómica:** Emplea archivos temporales `.tmp` y `fs.renameSync` para prevenir corrupción de datos en escrituras concurrentes.
   * **Backups Rotativos Automáticos:** En cada guardado crea una copia histórica con marca de tiempo en `/app/data/backups/realFormsData.backup-*.json`, conservando automáticamente las 10 versiones más recientes.

3. **Script de Inicialización de Contenedor (`docker-entrypoint.sh`):**
   * Configurado en `Dockerfile` como punto de entrada (`ENTRYPOINT`).
   * Al iniciar el contenedor como `root`, ajusta los permisos del volumen montado (`chown -R nextjs:nodejs /app/data`) y delega la ejecución de `node server.js` al usuario sin privilegios `nextjs` mediante `su-exec`.

4. **Descarga y Restauración de Respaldo Administrativo (`/api/admin/backup`):**
   * Botón directo **"Descargar Respaldo BD"** en `/admin/capacitaciones` para que la gerencia y coordinación descarguen en 1 clic un archivo JSON íntegro con el estado exacto de la base de datos viva.
   * Endpoint `POST /api/admin/backup` para restauración instantánea en caso de contingencia.

5. **Permisos y Eliminación de Capacitaciones en Cascada (Diana / Coordinación de Sala):**
   * Se habilitó el endpoint `DELETE /api/capacitaciones?id=<id>` con eliminación en cascada de inscripciones y encuestas asociadas para garantizar integridad referencial.
   * En `/admin/capacitaciones`, se añadieron botones de eliminación rápida en la tabla (`[ 🗑️ Borrar ]`) y en el pie del modal de edición (`[ 🗑️ Eliminar Capacitación ]`).
   * **Salvaguarda Visual:** Modal de confirmación con alerta de impacto antes de ejecutar la eliminación definitiva en el almacenamiento persistente.
