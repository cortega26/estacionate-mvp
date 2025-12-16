<!-- filename: README.md -->

# Estaciónate - Análisis Integral de Startup

## Resumen Ejecutivo

- **Oportunidad:** Monetizar espacios de estacionamiento subutilizados para visitas en edificios residenciales mediante marketplace digital
- **Modelo:** Plataforma B2B2C con take rate, conectando administradoras con residentes verificados para arriendo de espacios por 11h/23h
- **MVP Técnico:** Front-end estático (GitHub Pages) + API serverless (Vercel) + pagos locales (MercadoPago/Fintoc) + Recuperación de cuenta (WhatsApp) + Rol de Conserjería (Dashboard móvil)
- **Mercado:** Chile inicialmente, enfoque en edificios de alta densidad con déficit de estacionamientos para visitas
- **Diferenciación:** Verificación de residentes, integración con administradoras, ventanas horarias adaptadas al mercado local

## Tabla de Contenidos

1. [Evaluación de la Idea](01-evaluacion-de-la-idea.md) - Oportunidad de mercado, competencia y casos de uso
2. [Pros y Contras](02-pros-y-contras.md) - Análisis técnico y comercial del modelo propuesto
3. [Implementación Técnica MVP](03-implementacion-tecnica-mvp.md) - Arquitectura completa, desarrollo y despliegue
4. [Retos y Riesgos](04-retos-y-riesgos.md) - Identificación y mitigación de amenazas críticas
5. [Recomendaciones Estratégicas](05-recomendaciones-estrategicas.md) - Roadmap de crecimiento y monetización
6. [Extras Opcionales](06-extras-opcionales.md) - Modelo financiero y pivotes potenciales

## Cómo Leer Este Análisis

**Orden sugerido para founders:** Comienza con Evaluación de la Idea (01) para validar el concepto, revisa Pros y Contras (02) para entender trade-offs, profundiza en Implementación Técnica (03) para el plan de desarrollo, y consulta Retos (04) y Recomendaciones (05) para la estrategia de ejecución.

**Para equipos técnicos:** Enfócate en Implementación Técnica (03) que consolida arquitectura, modelo de datos, APIs y flujos completos.

**Para adaptación a nuevos mercados:** Revisa supuestos específicos de Chile en cada sección y ajusta regulaciones, pasarelas de pago y comportamientos de usuario locales.

## Glosario Técnico

- **CLP:** Peso chileno sin centavos (montos enteros únicamente)
- **11h/23h:** Ventanas de arriendo (medio día 11 horas, día completo 23 horas)
- **Take rate:** Porcentaje de comisión sobre cada transacción
- **Conserjería:** Personal de edificio que valida acceso y estacionamiento
- **Webhook:** Notificación automática de cambios de estado en pagos
- **Conciliación:** Proceso de validación entre registros internos y pasarela de pagos

## Nota Legal

Este análisis contiene **supuestos técnicos y regulatorios** que requieren validación con expertos locales en Chile, incluyendo aspectos de copropiedad, responsabilidad civil, protección de datos y cumplimiento tributario. **No constituye asesoría legal o financiera.**