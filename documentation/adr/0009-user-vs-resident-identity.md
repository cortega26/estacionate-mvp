# ADR 0009: User vs Resident — Contrato de Identidad

**Estado:** Aceptado
**Fecha:** 2026-04-27

---

## Contexto

El sistema tiene dos modelos de identidad que coexisten sin contrato formal:

- `User`: staff interno de plataforma (admins, concierges, sales reps, soporte, finanzas).
- `Resident`: persona que vive en una unidad del edificio y puede hacer reservas.

El código de login (`backend/src/api/auth/login.ts`) busca en ambas tablas. El frontend usa el rol `resident` como string en el authStore. Sin embargo, `Resident` no tiene contraseña — la autenticación de residentes va por un path diferente (o no está completamente implementada).

Riesgos actuales:

- Un `User` con `role = 'admin'` y un `Resident` podrían tener el mismo email sin colisión controlada.
- El JWT no distingue explícitamente si el actor es un `User` o un `Resident`, lo que puede causar que lógica de permisos aplique incorrectamente.
- Los endpoints no tienen un contrato explícito de "solo `Resident`s pueden hacer reservas" vs "solo `User`s internos pueden ver `/api/admin/**`".

---

## Decisión

### Mantener la separación `User` / `Resident`

Son dos actores con responsabilidades distintas y no deben unificarse:

| Dimensión       | `User` (interno)                                       | `Resident` (externo)                          |
| --------------- | ------------------------------------------------------ | --------------------------------------------- |
| Quién es        | Staff de plataforma o administradora                   | Habitante de una unidad en un edificio        |
| Autenticación   | Email + password; MFA obligatorio para roles sensibles | Email + password; MFA recomendado             |
| Alcance         | Global o con scope por membership (ADR 0007, ADR 0008) | Con scope al edificio de su unidad            |
| Puede crear     | Edificios, usuarios, reglas, reportes                  | Reservas, visitas (según reglas del edificio) |
| Puede ver       | Según rol (ADR 0008)                                   | Sus propias reservas, datos de su unidad      |
| JWT `actorType` | `"user"`                                               | `"resident"`                                  |

### Contrato del JWT

El JWT payload debe incluir `actorType` para que el middleware resuelva permisos sin ambigüedad:

```typescript
type JWTPayload =
  | { actorType: 'user'; userId: string; role: Role; buildingId?: string }
  | { actorType: 'resident'; residentId: string; buildingId: string; unitId: string };
```

Nunca usar solo `role` para determinar si el actor puede acceder a un endpoint de reservas — verificar además que `actorType === 'resident'`.

### Endpoints exclusivos por actor type

| Endpoint group                    | Actor permitido                                    |
| --------------------------------- | -------------------------------------------------- |
| `POST /api/bookings`              | Solo `resident`                                    |
| `GET /api/bookings` (las propias) | Solo `resident`                                    |
| `GET /api/spots?available=true`   | `resident` o `user` (concierge, admin)             |
| `POST /api/concierge/verify`      | Solo `user` con rol `concierge` o `building_admin` |
| `GET /api/admin/**`               | Solo `user` con rol autorizado (ADR 0008)          |
| `POST /api/auth/login`            | Ambos — distinguir por `actorType` en respuesta    |

### Unicidad de email entre tablas

Imponer unicidad de email entre `User` y `Resident` a nivel de aplicación (no necesariamente FK de DB). Si un email existe en `User`, no puede existir como `Resident` en el mismo edificio sin un vínculo explícito. Esto previene confusión de identidad cuando el administrador de un edificio también es residente.

### Path futuro: `ResidentAccount`

Si en el futuro se necesita que un residente tenga una cuenta unificada que también actúe como `building_admin` de su propio edificio (ej: el presidente del comité que también reserva), esto se resuelve con un vínculo `Resident.userId` que apunta a un `User` con rol `committee_viewer`. No colapsar los modelos — mantener el vínculo explícito.

---

## Alternativas descartadas

| Alternativa                                                             | Por qué se descartó                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unificar `User` y `Resident` en un solo modelo con `type` discriminator | Mezcla permisos de plataforma con permisos de edificio; complica el schema y las queries |
| `Resident` como `User` con rol `resident`                               | `Role` enum es para staff interno; contaminación semántica                               |
| Autenticación separada por dominio (subdominio.estacionate.com)         | Sobre-ingeniería para el tamaño actual; el `actorType` en JWT es suficiente              |

---

## Criterios de aceptación (gate para implementación)

- [ ] El JWT payload incluye `actorType: 'user' | 'resident'`.
- [ ] `POST /api/bookings` rechaza actores con `actorType === 'user'` (a menos que sea un admin creando en nombre de un residente — caso especial con audit).
- [ ] `GET /api/admin/**` rechaza actores con `actorType === 'resident'` con 403.
- [ ] Test: login como `Resident` devuelve JWT con `actorType: 'resident'` y `buildingId`.
- [ ] Test: login como `User` devuelve JWT con `actorType: 'user'` y `role`.
- [ ] No existe email duplicado entre `User` y `Resident` en el seed de demo.

---

## Consecuencias

- El seed debe crear `Resident`s con credenciales de login independientes de `User`.
- El middleware de auth debe bifurcar la lógica de lookup basado en `actorType` del JWT, no solo buscar en `User`.
- Los tests de auth existentes deben verificar que el `actorType` correcto está presente en la respuesta de login.
