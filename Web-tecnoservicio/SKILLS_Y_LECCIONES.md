# Bitácora de Lecciones Técnicas, Reglas de Infraestructura & Skills Aprendidos

Documentación técnica y operativa acumulada durante el desarrollo, despliegue y optimización de **TuTecnoServicio.com**.

---

## 1. Infraestructura: Coolify + Cloudflare Tunnels (Proxmox)

> [!IMPORTANT]
> **Regla de Oro para Evitar Bucle 302 y Error 502 Bad Gateway**:
> - Al desplegar un contenedor en **Coolify** que recibe tráfico desde **Cloudflare Tunnels**, en la casilla de dominio de Coolify se DEBE configurar como `http://subdominio.midominio.com` (con HTTP y NO con HTTPS).
> - **Explicación Técnica**: Traefik (el proxy inverso interno de Coolify) intenta forzar una redirección SSL (HTTP 302) si se configura como `https://`. Al recibir la petición desde Cloudflare Tunnel por HTTP interno en el puerto 80/3030, Traefik responde con 302, generando un bucle infinito de redirecciones y resultando en un error `502 Bad Gateway` en Cloudflare.
> - **Mapeo de Puertos**: Cuando se requiere exponer un puerto específico en la IP de la máquina host (`192.168.1.32:3030`), se debe incluir en el `docker-compose.yml`:
>   ```yaml
>   ports:
>     - "3030:80"
>   ```

---

## 2. Configuración de Correo Corporativo & DNS (Cloudflare + DonWeb / Ferozo)

> [!TIP]
> **Arquitectura de Correo para `contacto@tutecnoservicio.com`**:
> - **Cluster de Correo DonWeb**: `l0051632.ferozo.com`
> - **Registros MX en Cloudflare**:
>   - Tipo `MX` | Nombre `@` | Servidor `l0051632.ferozo.com` | Prioridad `10` | Estado: **DNS Only (Nube Gris)**.
> - **Registros de Autoconfiguración**:
>   - `CNAME autoconfig` ➔ `l0051632.ferozo.com` (DNS Only / Nube Gris)
>   - `CNAME autodiscover` ➔ `l0051632.ferozo.com` (DNS Only / Nube Gris)
> - **Redirección de Webmail**:
>   - Regla de redirección en Cloudflare (Page Rule / Redirect Rule):
>   - `http://webmail.tutecnoservicio.com` ➔ `https://l0051632.ferozo.com/webmail` (Redirección 301).
> - **Puertos para Thunderbird / Clientes**:
>   - IMAP: Puerto 993 (SSL/TLS) | SMTP: Puerto 465 (SSL/TLS).

---

## 3. Copywriting de Conversión & Posicionamiento de Marca

> [!NOTE]
> **Psicología de Ventas para Dueños de PyMEs**:
> 1. **Vocabulario Positivo y Constructivo**:
>    - Sustituir verbos agresivos como *"eliminar"* por verbos orientados a solución: *"resolver"*, *"sustituir"*, *"transformar"*.
>    - Evitar palabras cargadas negativamente como *"dolores de cabeza"* y reemplazarlas por *"retrasos operativos"*, *"situaciones"* u *"obstáculos con solución"*.
> 2. **Posicionamiento Estratégico**:
>    - **NO** posicionarse como "técnico apaga fuegos" o instalador puntual de software.
>    - **SÍ** posicionarse como **Consultor Integral de Procesos & Tecnología** que evalúa, diagnostica e instala soluciones físicas (hardware) y lógicas (software) con Retorno de Inversión (ROI) directo y ahorro en dólares.
> 3. **Identidad de Marca**:
>    - Usar la combinación del nombre y apellido completo (**Juan Carlos Bastardo**) para proyectar solidez ejecutiva, seriedad institucional y autoridad profesional.

---

## 4. Diseño Mobile-First (Celulares 6.3"+) & Isotipo

> [!NOTE]
> **Patrones UI/UX Móviles**:
> - **Barra Flotante Inferior (Thumb Zone Ergonomics)**: En pantallas de 6.3"+ (iPhone 13-16 Pro, Samsung Galaxy, Xiaomi), la zona inferior es el área natural de alcance del pulgar. Incluir accesos directos a WhatsApp y Diagnóstico.
> - **Prevención de Zoom en iOS Safari**: Fijar font-size base de 16px en inputs e incluir `inputmode="text"` y `inputmode="email"` para abrir teclados móviles sin deformar la pantalla.
> - **Favicon de Isotipo**: Utilizar el procesador `TT` cuadrado como favicon en lugar del logotipo horizontal completo.
