# Registro De Cambios

Todos los cambios relevantes de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin Publicar]

### Agregado

- **Recuperación de cuenta:** implementación del flujo completo para restablecer contraseña mediante tokens por WhatsApp/SMS.
- **Rol de conserjería:** nuevo rol `concierge` con dashboard y permisos específicos.
- **Dashboard mobile-first:** layout dedicado para guardias/conserjes.

### Corregido

- **Logging de workers:** corrección de la firma de llamada `logger.error` en cron worker para manejar objetos de error correctamente.
- **Seguridad:** rate limiting agregado a endpoints de login.
- **Seguridad:** verificación de cuenta obligatoria antes de login.
- **Type safety:** corrección de errores TypeScript en `authStore`, `scripts/create-concierge.ts` y `admin/stats.ts`.

### Cambiado

- **Dependencias:** actualización de `package.json` para incluir tipos necesarios.
- **Configuración:** actualización de `.cursorrules` para reflejar nuevos flujos agentic.
