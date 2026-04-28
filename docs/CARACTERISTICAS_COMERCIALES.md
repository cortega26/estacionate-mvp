# Estacionate: Plataforma De Gestión De Estacionamientos De Visita

**Documento de características comerciales (SaaS B2B)**

> Nota: este documento debe leerse junto con `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`. La fase activa es SaaS B2B sin pagos integrados de residentes/comunidades, sin cobros directos a visitantes, sin payouts productivos y sin custodia de fondos comunitarios por parte de Estacionate.

## Resumen Ejecutivo

**Estacionate** es una solución SaaS para ordenar y profesionalizar la gestión de estacionamientos de visita en comunidades residenciales. La plataforma permite a administradores de edificios coordinar reservas, validar accesos, reducir fricción operativa y mantener trazabilidad desde la nube.

## Módulos Principales

### 1. Gestión Multi-Tenant (Multi-Edificio)

_Diseñado para administradoras y comunidades residenciales._

- **Portafolio unificado:** administrar múltiples edificios o condominios desde un solo panel de control.
- **Configuración granular:** definir reglas operativas (horarios, cupos, restricciones) específicas para cada comunidad.
- **Roles y permisos:** accesos diferenciados para administración general, administración de edificio y conserjería.

### 2. Motor De Reservas Inteligente

_Experiencia de usuario fluida y sin fricción._

- **Disponibilidad en tiempo real:** el sistema previene doble reserva mediante controles de concurrencia.
- **Búsqueda avanzada:** usuarios pueden filtrar por fecha, horario y tipo de vehículo cuando el flujo lo requiera.
- **Simplicidad móvil:** interfaz mobile-first optimizada para reservar en pocos pasos.

### 3. Reportes Operacionales Y Trazabilidad

_Visibilidad para administración sin activar flujos de cobro productivo._

- **Historial de uso:** registros trazables de reservas, validaciones y eventos operativos.
- **Reportes para administración:** métricas de ocupación, actividad e incidentes.
- **Evidencia auditada:** acciones relevantes respaldadas por logs de auditoría.

### 4. Seguridad Y Control De Acceso (Conserjería)

_Herramientas para el personal en terreno._

- **Dashboard de conserjería:** vista dedicada para guardias y recepcionistas.
- **Validación QR / patente:** verificación de reservas activas cuando el flujo esté habilitado.
- **Listas de bloqueo:** capacidad de vetar usuarios, patentes o unidades según reglas de la comunidad y marco legal aplicable.

### 5. Configuración Operativa Flexible

_Adaptación a reglas internas de cada edificio._

- **Gestión de eventos:** reglas especiales para días de alta demanda, siempre dentro de las reglas del edificio.
- **Bloques de disponibilidad:** ventanas de tiempo configurables por hora, jornada o rangos definidos.

### 6. Identidad Y Recuperación Moderna

_Seguridad sin comprometer usabilidad._

- **Recuperación vía WhatsApp:** recuperación de contraseñas mediante códigos OTP enviados al canal configurado del usuario.
- **Cifrado y privacidad:** datos sensibles (RUT, teléfono) protegidos con cifrado y manejo responsable de PII.

## Diferenciadores Técnicos

1. **Arquitectura escalable:** construida sobre infraestructura serverless (Vercel) capaz de escalar ante picos de tráfico.
2. **Seguridad robusta:** headers de seguridad estrictos (CSP), protección contra XSS y logs de auditoría inmutables.
3. **Auditoría total:** cada acción relevante (reserva, cancelación, login) queda registrada con IP, hora y actor para trazabilidad ante disputas.

**Estado del producto:** MVP avanzado en fase SaaS B2B.
**Próximos pasos:** pilotos controlados, mejoras de onboarding, reportes operacionales y validación con administradoras.
