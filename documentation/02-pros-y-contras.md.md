<!-- filename: 02-pros-y-contras.md -->

# Pros y Contras del Modelo Propuesto

## Análisis Técnico

### GitHub Pages + Vercel: Ventajas

**Costos Mínimos**
- GitHub Pages: gratuito para repos públicos, hosting global con CDN
- Vercel Functions: 100GB-horas/mes gratis, suficiente para validación inicial
- Estimación MVP: $0-50 USD/mes los primeros 6 meses

**Rendimiento Optimizado**
- Static Site Generation (SSG) con tiempo de carga <2s
- Edge functions para lógica crítica con latencia <100ms
- PWA permite experiencia nativa sin app stores

**Escalabilidad Incremental**
- Vercel Pro ($20/mes) soporta 1000+ funciones concurrentes
- Fácil migración a Next.js/React Server Components cuando sea necesario
- Database scaling horizontal con Postgres read replicas

### GitHub Pages + Vercel: Desventajas

**Limitaciones Técnicas**
- GitHub Pages solo contenido estático, no server-side rendering
- Vercel free: timeout 10s por función, puede ser insuficiente para conciliación compleja
- Sin WebSockets nativos para actualizaciones en tiempo real

**Observabilidad Restringida**
- Logs limitados en tier gratuito, debugging complejo en producción  
- Sin APM avanzado, métricas de negocio requieren integración externa
- Alerting básico, respuesta a incidentes manual

**Seguridad y Compliance**
- No HSM para secretos críticos, dependencia de Vercel KV/Postgres
- Sin WAF configurado por defecto, vulnerabilidad a ataques DDoS
- Backup y disaster recovery manual

**Límites Free Tier**
- Vercel: 1000 invocaciones serverless/día pueden agotarse rápido
- Bandwidth: 100GB/mes puede ser insuficiente con crecimiento
- Database connections: pool limitado en Neon/Supabase free

## Análisis de Negocio

### Fortalezas Comerciales

**Adopción Administradoras**
- Revenue sharing sin inversión inicial vs. SaaS con costo fijo
- Digitalización atractiva para edificios premium que buscan diferenciación
- Reducción de conflictos entre residentes por temas de estacionamiento

**Incentivos Alineados**
- Administradoras ganan por espacios subutilizados
- Residentes obtienen conveniencia y seguridad
- Plataforma escala comisiones con volumen

**Barrera de Entrada Natural**
- Relaciones B2B con administradoras requieren confianza y tiempo
- Integración operativa con conserjería crea switching costs
- Verificación de residentes genera red de usuarios exclusiva

### Debilidades Comerciales

**Dependencia de Adopción Dual**
- Administradoras Y residentes deben adoptar simultáneamente
- Problema del huevo y la gallina: pocos espacios → pocos usuarios → pocos espacios

**Pricing en CLP Enteros**
- Menos flexibilidad que pricing dinámico por centavos
- Dificulta optimización de revenue management vs. competidores

**Dependencia Pasarelas**
- MercadoPago: comisiones 2.9-6.4% + $3 CLP fijo
- Fintoc: comisiones variables según banco, UX inconsistente
- Single points of failure para toda la experiencia de pago

## Matriz de Riesgos vs Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación | Dueño |
|--------|--------------|---------|------------|--------|
| **Baja adopción administradoras** | Alta | Alto | Programa piloto con revenue garantizado, casos de éxito replicables | CEO |
| **Problemas integración pagos** | Media | Alto | Sandbox extensivo, fallbacks MercadoPago + Fintoc, tests automatizados | CTO |
| **Conflictos legales copropiedad** | Media | Medio | Asesoría legal preventiva, TyC claros, seguro responsabilidad civil | Legal |
| **Capacidad Vercel insuficiente** | Baja | Alto | Monitoreo proactivo, plan de migración a tier pago, optimización queries | DevOps |
| **Competencia con recursos** | Media | Medio | Ventaja primer movimiento, diferenciación por verificación residentes | CEO |
| **UX compleja para conserjería** | Media | Medio | Training presencial, soporte telefónico 24/7, UX simplificado móvil | Producto |

## Checklist de Decisiones para Avanzar a MVP

### Validación de Mercado ✓
- [ ] 5+ entrevistas administradoras con interés confirmado
- [ ] 20+ residentes dispuestos a pagar $3.000+ CLP
- [ ] 2+ edificios piloto identificados con >30 unidades
- [ ] Pricing 11h/23h validado vs. alternativas por hora

### Preparación Técnica ✓  
- [ ] Sandbox MercadoPago + Fintoc configurado y probado
- [ ] Arquitectura MVP documentada con diagramas
- [ ] Base de datos diseñada con migraciones
- [ ] Plan de monitoreo y alerting definido

### Aspectos Legales y Operativos ✓
- [ ] Consultoría legal sobre copropiedad y responsabilidad civil
- [ ] TyC y política privacidad revisadas por abogado
- [ ] Proceso de verificación residentes documentado
- [ ] Protocolo de soporte a conserjería establecido

### Métricas y KPIs ✓
- [ ] Dashboard de métricas de producto definido
- [ ] Objetivos cuantitativos para piloto (ocupación, NPS, etc.)
- [ ] Plan de pivot si métricas no se cumplen
- [ ] Presupuesto y runway para 6 meses validación

_Volver al índice_ → [README.md](README.md)