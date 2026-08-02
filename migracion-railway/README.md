# Proyecto: Migración de Aplicaciones de Railway a Coolify (Proxmox)

Este directorio está destinado a la organización, scripts de despliegue, plantillas de variables de entorno y documentación para el traslado de servicios alojados en **Railway** hacia la infraestructura propia auto-alojada en **Coolify / Proxmox** (`192.168.1.32`).

## Estructura de Trabajo

- `/configs`: Configuraciones Docker Compose / Nixpacks por servicio.
- `/env-templates`: Plantillas de variables de entorno requeridas para inyección en Coolify.
- `/logs`: Bitácora de estado de migración y pruebas de funcionamiento.

## Estado del Proyecto
- **Fase Actual**: Relevamiento e Inventario de Servicios activos en Railway.
- **Meta**: $0 factura mensual en la nube.
