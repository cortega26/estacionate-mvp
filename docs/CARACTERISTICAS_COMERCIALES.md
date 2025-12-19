# Estacionate: Plataforma de Gestión de Estacionamientos de Visitas
**Documento de Características Comerciales (SaaS)**

## Resumen Ejecutivo
**Estacionate** es una solución "Tier 1 Marketplace" diseñada para transformar los estacionamientos de visitas en activos rentables, seguros y fáciles de gestionar. Nuestra plataforma permite a administradores de edificios y operadores de parking automatizar reservas, cobros y seguridad, todo desde la nube.

---

## Módulos Principales

### 1. Gestión Multi-Tenant (Multi-Edificio)
*Diseñado para Administradoras y Operadores de Parking.*
*   **Portafolio Unificado**: Administre múltiples edificios o condominios desde un solo panel de control ("Súper Admin").
*   **Configuración Granular**: Defina reglas de negocio (precios, horarios, cupos) específicas para cada comunidad.
*   **Roles y Permisos**: Accesos diferenciados para el Administrador General, Administrador del Edificio y Conserjería.

### 2. Motor de Reservas Inteligente
*Experiencia de usuario fluida y sin fricción.*
*   **Disponibilidad en Tiempo Real**: El sistema previene la sobreventa ("double booking") mediante control de concurrencia optimista.
*   **Búsqueda Avanzada**: Los usuarios pueden filtrar por fecha, horario y tipo de vehículo.
*   **Simplicidad Móvil**: Interfaz "Mobile-First" optimizada para reservar en menos de 3 clics.

### 3. Pasarela de Pagos & Facturación
*Monetización segura y automática.*
*   **Integración MercadoPago**: Soporte nativo para tarjetas de crédito, débito y prepago (WebPay).
*   **Cálculo de Comisiones**: Split de pagos automatizado. Calcule cuánto corresponde al edificio y cuánto a la plataforma (Markup/Take-rate).
*   **Transparencia Financiera**: Historial de transacciones inmutable verificado por logs de auditoría.

### 4. Seguridad & Control de Acceso (Gatekeeper)
*Herramientas para el personal en terreno.*
*   **Dashboard de Conserjería**: Vista dedicada para guardias y recepcionistas.
*   **Validación QR / Patente**: Verificación instantánea de reservas activas.
*   **Listas Negras/Bloqueos**: Capacidad de vetar usuarios o departamentos morosos.

### 5. Configuración de Precios Dinámicos (Yield Management)
*Maximice los ingresos según la demanda.*
*   **Gestión de Eventos**: Cree tarifas especiales para días de alta demanda (conciertos, partidos, festivos).
*   **Bloques de Disponibilidad**: Configure ventanas de tiempo flexibles (por hora, jornada, o 24 horas).

### 6. Identidad & Recuperación Moderna
*Seguridad sin comprometer la usabilidad.*
*   **Recuperación vía WhatsApp**: Sistema innovador de recuperación de contraseñas enviando códigos OTP directamente al WhatsApp del usuario, ideal para alta conversión.
*   **Encriptación y Privacidad**: Datos sensibles (RUT, Teléfono) encriptados bajo estándares SOC2 (en desarrollo).

---

## Diferenciadores Técnicos (Por qué elegirnos)

1.  **Arquitectura Escalable**: Construido sobre infraestructura Serverless (Vercel) capaz de escalar automáticamente ante picos de tráfico.
2.  **Seguridad Bancaria**: Headers de seguridad estrictos (CSP), protección contra ataques XSS y logs de auditoría inmutables.
3.  **Auditoría Total**: Cada acción (reserva, cancelación, login) queda registrada con IP, hora y actor, garantizando trazabilidad total ante disputas.

---

**Estado del Producto**: MVP Avanzado (Production Ready).
**Próximos Pasos**: Aplicación Móvil Nativa, Integración con Barreras IoT.
