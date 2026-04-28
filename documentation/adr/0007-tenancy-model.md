# ADR 0007: Tenancy Model

**Estado:** Aceptado  
**Fecha:** 2026-04-27

**Nota Fase 1:** Cualquier dato de pagos mencionado en esta ADR corresponde a
infraestructura demo/simulador o futuro bloqueado. La fase habilitada es SaaS B2B
sin pagos integrados ni payouts.

---

## Contexto

El schema actual tiene un modelo `Building` con un campo `adminCompany String?` y un modelo `User` con `buildingId String?`. No existe un modelo formal de membership que relacione usuarios con edificios bajo un rol específico. Esto provoca que los filtros por `buildingId` sean opcionales en las queries, que los roles sean globales en lugar de scoped por tenant, y que no haya forma de que un usuario interno pertenezca a múltiples edificios con distintos roles.

Riesgo crítico: un `building_admin` asignado al Edificio A puede hoy hacer queries al Edificio B cambiando el `buildingId` en el request — no hay enforcement de tenant isolation a nivel de datos.

---

## Decisión

### Tenant principal: `Building`

El `Building` es el tenant operacional y legal. Todos los datos operativos
(reservas, spots, disponibilidad, registros demo/futuros de pagos, audit logs,
accesos de conserjería) pertenecen a un edificio y solo son accesibles por
actores autorizados en ese edificio.

### Agrupador multi-edificio: `ManagementCompany`

Las administradoras que gestionan múltiples edificios se modelan como `ManagementCompany`. Un `ManagementCompany` puede tener N `Building`s. Los usuarios internos de una administradora pueden tener memberships en todos los edificios de su empresa sin necesitar memberships individuales — el scope se deriva del `managementCompanyId`.

**Nota:** El campo actual `Building.adminCompany String?` es un string libre. Se reemplaza progresivamente por una FK a `ManagementCompany`. En el corto plazo (piloto), el string se mantiene como dato informativo mientras el modelo `ManagementCompany` se introduce.

### Membership model: `UserBuildingMembership`

Los usuarios internos (staff de plataforma, building admins, concierges, sales reps) tienen memberships explícitas por edificio:

```
UserBuildingMembership {
  id         String   @id
  userId     String
  buildingId String
  role       Role     // el rol en ESTE edificio específico
  isActive   Boolean  @default(true)
  createdAt  DateTime
}
```

Un usuario puede tener múltiples memberships (ej: concierge en Edificio A, building_admin en Edificio B). Los roles globales de plataforma (`super_admin`, `platform_ops`, `finance`, `sales_manager`, `legal_viewer`) no requieren membership — su scope es global y se deriva del `User.role`.

### Residents

Los `Resident`s son actores distintos a los `User`s internos. Un `Resident` está asociado a una `Unit` dentro de un `Building`. El `Resident` no tiene membership — su scope es implícitamente el edificio de su unidad. Ver ADR 0009 para el contrato completo de identidad.

### Enforcement backend

Todo endpoint que opera sobre datos de un edificio debe derivar el building scope del JWT del actor autenticado:

- Si el actor es un `User` con rol global → scope global, sin filtro
- Si el actor es un `User` con membership → scope = `membership.buildingId`
- Si el actor es un `Resident` → scope = `resident.unit.buildingId`
- Nunca tomar `buildingId` directamente de query params o body sin verificar que el actor tiene membership en ese edificio

Ver ADR 0008 para el middleware de enforcement.

---

## Alternativas descartadas

| Alternativa                                   | Por qué se descartó                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `User` como tenant                            | Requiere que cada usuario sea su propio tenant; no aplica a B2B                                                                  |
| `ManagementCompany` como tenant principal     | Complica el modelo de datos y la isolation; edificios con distintas administradoras seguirían necesitando isolation por edificio |
| Roles globales para todos                     | Un building_admin de Edificio A no debe ver Edificio B; requiere scoping                                                         |
| `buildingId` en request como fuente de verdad | Permite IDOR; debe derivarse del token autenticado                                                                               |

---

## Criterios de aceptación (gate para implementación)

- [ ] `UserBuildingMembership` existe en schema con FK a `User` y `Building`.
- [ ] Todo endpoint admin y concierge usa `requireBuildingScope()` middleware (ADR 0008).
- [ ] Test negativo: usuario autenticado en Building A recibe 403 al acceder a recursos de Building B.
- [ ] `super_admin`, `platform_ops`, y roles globales omiten el filter de building pero registran acceso en AuditLog.

---

## Consecuencias

- Los endpoints que hoy aceptan `buildingId` como parámetro libre deben validarlo contra la membership del actor.
- El seed debe crear `UserBuildingMembership` rows para los usuarios de demo.
- El JWT payload debe incluir `buildingId` (para usuarios scoped) o un flag de rol global para evitar un DB round-trip en cada request.
