# Plan Comercial Y De Conversión 2026

**Fecha:** 2026-04-26
**Alcance:** mejora de producto, mejora de conversión, ejecución founder solo, preparación de pitch
**Audiencia:** founder, futuros colaboradores, agentes de IA, asesores

## Propósito

Este documento es la visión general y punto de entrada para el conjunto de planificación comercial y de conversión.

Mantiene la recomendación estratégica principal en un solo lugar y enlaza los documentos de ejecución detallada para que el material siga siendo mantenible.

## Resumen Ejecutivo

La prioridad actual no es una reescritura completa de la plataforma. La prioridad es hacer que Estacionate sea más fácil de entender, más fácil de confiar, más fácil de demostrar y más fácil de comprar.

Para la etapa actual del negocio, la estrategia recomendada es:

1. Mantener estable la aplicación autenticada central.
2. Mejorar los workflows visibles que forman confianza durante demos y pilotos.
3. Fortalecer la capa de ventas y adquisición alrededor del producto.
4. Postergar cualquier migración completa de frontend o backend salvo que mejore directamente conversión, calidad de demo o velocidad de entrega.

## Recomendación Técnica

1. No realizar ahora una reescritura completa del frontend.
2. Mejorar primero la UX y confiabilidad operacional de la aplicación existente.
3. Si se necesita una capa pública de adquisición, usar Next.js solo para la superficie de marketing y ventas.
4. Mantener backend en el stack actual a corto plazo mientras se refactorizan en sitio flujos críticos de negocio.

## Por Qué Esta Recomendación Calza Con El Repo Actual

1. El frontend ya usa React, Vite y TypeScript.
2. El backend ya usa Express, TypeScript, Prisma, PostgreSQL y Redis.
3. El despliegue productivo ya es Vercel-first.
4. Las auditorías existentes muestran deuda de mantenibilidad y consistencia, pero no una necesidad urgente de reescritura full-stack.
5. Para ejecución founder solo, la entrega predecible aporta más que migraciones simultáneas de frameworks.

## Mapa De Documentos

Usa estos documentos en conjunto:

1. [commercial-roadmap-2026.md](commercial-roadmap-2026.md): roadmap de ejecución 30-60-90.
2. [founder-sales-playbook-es.md](founder-sales-playbook-es.md): playbook comercial en español para llamadas, discovery, objeciones y encuadre de piloto.
3. [conversion-backlog-2026.md](conversion-backlog-2026.md): backlog priorizado de producto orientado a conversión.
4. [client-pitch-deck-outline-2026.md](client-pitch-deck-outline-2026.md): estructura de deck para clientes.

## KPIs A Medir

### KPIs De Producto Y Conversión

1. Tasa demo-a-seguimiento.
2. Tasa seguimiento-a-piloto.
3. Tasa de conversión piloto-a-pago.
4. Tiempo desde primer contacto a propuesta.
5. Tiempo desde propuesta a cierre.
6. Punto de abandono en el proceso de demo.
7. Cantidad de fallas críticas durante demo.
8. Tiempo de onboarding de un edificio nuevo.
9. Tiempo hasta crear la primera reserva exitosa.
10. Incidentes de soporte durante piloto.

### KPIs Técnicos

1. Latencia p95 en flujos críticos.
2. Tasa de éxito de reservas.
3. Problemas de conciliación de pagos.
4. Tasa de error en endpoints críticos.
5. Tasa de aprobación E2E para flujos críticos.
6. Frecuencia de rollback de releases.

## Recomendación Final

La mejor ruta de corto plazo es una estrategia de endurecimiento comercial-producto, no una migración full-stack.

En orden de prioridad:

1. Afinar posicionamiento.
2. Mejorar calidad de demo.
3. Mejorar señales de confianza.
4. Pulir los workflows más visibles.
5. Estandarizar las áreas técnicas más frágiles.
6. Usar Next.js solo si se necesita una capa pública de ventas más fuerte.
