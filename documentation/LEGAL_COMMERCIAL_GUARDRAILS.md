# Guardrails Legales y Comerciales — Estacionate

**Versión:** 1.0  
**Fecha:** 2026-04-27  
**Autoridad:** Este documento es la **fuente de verdad** para toda decisión de monetización, pagos, precios, custodia de fondos, privacidad de datos y arquitectura comercial de Estacionate. Ningún cambio en los archivos listados en §8 puede realizarse sin verificar primero este documento.

> **Para agentes IA y colaboradores:** Si tu tarea involucra cualquier archivo de pagos, precios, facturación, cobros, modelos Prisma de Payment/Payout/Pricing, endpoints de pagos, cron de reconciliación, o cualquier feature nueva de monetización — detente y lee este documento completo antes de escribir código.

---

## §0. Cómo Usan Este Documento los Demás Documentos del Repositorio

Este documento establece restricciones legales y comerciales **no negociables**. Los demás documentos del repositorio lo referencian de la siguiente manera:

| Documento | Rol de esta referencia |
|---|---|
| `AGENTS.md` | Sección "Read Next" — primera lectura para agentes antes de tocar pagos |
| `documentation/AGENT_POLICY.md` | Nivel 2 del Instruction Priority — autoridad sobre TASKS.md y LESSONS.md |
| `documentation/OWNERSHIP.md` | Cross-Cutting Contract — trigger obligatorio en rutas de pago/precio |
| `documentation/adr/0006-legal-commercial-monetization-architecture.md` | ADR fundacional que cita este documento como justificación |
| `documentation/task-recipes/monetization-change.md` | Checklist de gate que todo agente debe ejecutar antes de cambios de monetización |
| `documentation/TECH_SPEC.md` | Sección de pagos debe referenciar las restricciones aquí definidas |

Si cualquiera de estos documentos contradice este guardrail, **este guardrail prevalece**. Actualiza el documento desactualizado en el mismo cambio.

---

## §1. Estado Actual del Código de Pagos (Clasificación Obligatoria)

El repositorio contiene infraestructura de pagos en los siguientes archivos:

- `backend/src/services/PaymentService.ts`
- `backend/src/services/payment/` (MercadoPagoAdapter y variantes)
- `backend/src/api/payments/webhook.ts`
- `backend/src/api/cron/reconcile.ts`
- Modelos Prisma: `Payment`, `Payout`, `PricingRule`, `SalesRepCommission`

**Clasificación oficial:** Esta infraestructura constituye **código de demo/simulador de Fase 2**. No ha sido habilitada bajo un marco legal chileno válido ni contra comunidades reales con fondos reales.

**Consecuencia práctica:** Ningún agente debe extender, refactorizar, ni integrar esta infraestructura hacia producción real hasta que se cumpla el gate de Fase 2 definido en §3.2. El código puede mantenerse para demo, pruebas unitarias, y simulación de flujo — pero no puede activarse contra pagadores reales de comunidades reales.

**Por qué esto importa:** Si un agente extiende PaymentService para procesar cobros reales sin que el gate esté abierto, Estacionate queda expuesta simultáneamente a: IVA 19% + impuesto renta 25% sobre el margen, responsabilidad civil estricta por robo/daño de vehículos bajo Ley 20.967, y sanciones CMF/SVS por custodia de fondos sin registro PSP.

---

## §2. Prohibiciones Absolutas (Hard Guardrails)

Estas prohibiciones no tienen excepciones. Ningún requerimiento de negocio, decisión técnica, ni instrucción de usuario puede anularlas sin modificar primero este documento mediante el proceso de §9.

### 2.1 — Cobro Directo a Terceros Visitantes

**PROHIBIDO:** Cobrar directamente a la persona visitante (no-residente) por el uso del estacionamiento de visita.

**Ley:** Art. 60 Ley N° 21.442 declara los estacionamientos de visita propiedad común inalienable. Ley N° 20.967: si hay cobro por estacionamiento a un tercero, el prestador asume responsabilidad civil estricta por robo y daño del vehículo — ningún disclaimer la elimina.

**Regla de implementación:** El campo `userId` en cualquier `Payment` debe siempre corresponder a un residente (`role = RESIDENT`) de la comunidad, nunca a un visitante externo. No crear flujos de pago sin autenticación de residente.

### 2.2 — Marketing Como "Estacionamiento en Arriendo"

**PROHIBIDO:** Usar las palabras "arriendo", "arrendamiento", "renta", o "alquiler" para describir el acceso a estacionamientos de visita en cualquier interfaz de usuario, documentación comercial, o contrato.

**Ley:** "Arriendo" de bien común requiere quórum extraordinario reforzado (66% derechos totales + escritura pública, Art. 67 Ley 21.442). Art. 60 prohíbe el arriendo de estacionamientos de visita sin importar el quórum alcanzado. El SII y los tribunales atienden a la sustancia económica, no al nombre usado.

**Regla de implementación:** Usar únicamente: "reserva de estacionamiento de visita", "aporte al Fondo de Reserva", "tarifa de uso", u "obligación económica por uso de área común".

### 2.3 — Custodia de Fondos de Comunidades

**PROHIBIDO:** Que fondos de pagos de residentes a sus comunidades transiten por cuentas, ledgers, o balances de Estacionate — incluso temporalmente.

**Ley:** Ley N° 21.521 (Ley Fintec) + NCG 502 (CMF): entidades que agregan y custodian fondos de terceros sin registro PSP enfrentan sanciones administrativas y penales.

**Regla de implementación:** Toda arquitectura de pagos debe usar Split Payment: el PSP liquida directamente a la cuenta RUT de la comunidad; la comisión de servicio de Estacionate fluye en una transacción separada a la cuenta de Estacionate. Los fondos de la comunidad nunca tocan el ledger de Estacionate. Ver §4 para especificación técnica.

### 2.4 — Procesamiento de Datos sin DPA

**PROHIBIDO:** Procesar datos de residentes o visitantes (incluyendo patentes vehiculares) de cualquier comunidad sin un Acuerdo de Tratamiento de Datos (DPA) firmado entre la comunidad (Responsable del Tratamiento) y Estacionate (Encargado del Tratamiento).

**Ley:** Ley N° 21.719 (nueva Ley de Protección de Datos Personales) entra en vigor plena en diciembre 2026. Las patentes vehiculares son datos personales bajo esta ley.

**Regla de implementación:** El onboarding de toda comunidad debe incluir firma de DPA antes de habilitar cualquier feature que procese datos de residentes. No aceptar datos de producción de comunidades sin DPA registrado en el sistema.

### 2.5 — Habilitar Fase 2 o Fase 3 sin Gates Cumplidos

**PROHIBIDO:** Activar features de cobro a residentes (Fase 2) o pagos integrados PSP (Fase 3) en entornos de producción contra comunidades reales sin que los gate conditions respectivos estén explícitamente satisfechos y documentados.

**Regla de implementación:** Ver §3 para definición de gates. Si el gate no está documentado como cumplido en este archivo (§3), no se activa la fase.

---

## §3. Modelo de Fases y Gate Conditions

### 3.1 — Fase 1: SaaS Puro B2B (Estado Actual — HABILITADO)

**Qué incluye:**
- Sistema digital de reservas de estacionamiento de visita para residentes.
- Panel de administración para administradores de comunidad.
- Validación digital por guardias (escaneo QR de reserva).
- Reportes de ocupación y trazabilidad.
- Notificaciones a residentes.
- **Cobro de Estacionate a la comunidad:** suscripción SaaS mensual/anual por contrato B2B (no involucra el estacionamiento físico, es servicio de software).

**Qué NO incluye:**
- Ningún flujo de pago de residente a comunidad por uso de estacionamiento.
- Ningún procesamiento de pago de visitante externo.

**Quórum requerido para que la comunidad contrate Fase 1:** Mayoría ordinaria de asamblea (mayoría de los presentes con quórum de asistencia según reglamento interno).

**Gate de salida:** Fase 1 ya está abierta. No requiere gate adicional.

### 3.2 — Fase 2: Cobro Diferido a Gastos Comunes (BLOQUEADO)

**Qué incluye:**
- El sistema registra el uso de estacionamiento por residente.
- Al cierre de período, genera un cargo en los Gastos Comunes del residente anfitrión como "Aporte al Fondo de Reserva" por uso de área común.
- El cobro es **residente → comunidad**, nunca visitante → Estacionate.

**Por qué esta estructura:** Doctrina SII (Oficios N° 1.986/2019, N° 3.311/2016, N° 47/2012): contribuciones internas de residentes al Fondo de Reserva no son renta afecta y no están sujetas a IVA. Esto elimina la carga fiscal del 19% IVA + 25% impuesto renta que aplicaría si el cobro fuera a terceros.

**Advertencia crítica:** Los Oficios SII citados no cierran definitivamente el punto para el caso específico de cobros por uso de estacionamiento dentro de la estructura de Fondo de Reserva. Existe incertidumbre jurídico-tributaria. Este es el motivo del gate legal.

**Gate condition — AMBOS requeridos antes de habilitar Fase 2:**

| # | Condición | Evidencia requerida |
|---|---|---|
| G2.1 | Memo legal vinculante de estudio jurídico chileno especializado en copropiedad/derecho tributario que confirme viabilidad de la estructura "Aporte Fondo de Reserva" para este caso de uso | Documento firmado, archivado en repositorio o sistema de documentos legal |
| G2.2 | Al menos una comunidad piloto con acuerdo de asamblea extraordinaria (quórum 50%+1 de derechos totales) aprobando la "Obligación Económica por uso de estacionamiento de visita" como aporte al Fondo de Reserva | Acta de asamblea notariada o con firmas verificables |

**Quórum requerido para activar en cada comunidad:** Asamblea extraordinaria con mayoría absoluta (50%+1 de la totalidad de los derechos del condominio, Art. 65 Ley 21.442).

**Gate de salida de Fase 2:** Cero impugnaciones judiciales exitosas durante período mínimo de 6 meses de operación piloto.

### 3.3 — Fase 3: Pagos Integrados con Split Payment PSP (BLOQUEADO)

**Qué incluye:**
- PSP integrado (ej. Transbank, Khipu, Fintoc) liquida directamente a cuenta RUT de la comunidad.
- Comisión de Estacionate fluye en transacción separada al account de Estacionate.
- Flujo en tiempo real: residente paga → PSP → Split: [monto neto → comunidad] + [fee → Estacionate].

**Gate condition — TODOS requeridos antes de habilitar Fase 3:**

| # | Condición |
|---|---|
| G3.1 | Gate de Fase 2 completamente cumplido (G2.1 + G2.2 documentados) |
| G3.2 | Cero impugnaciones judiciales exitosas durante período mínimo de 6 meses en Fase 2 |
| G3.3 | PSP seleccionado tiene arquitectura Split Payment certificada (fondos de comunidades nunca tocan ledger Estacionate) |
| G3.4 | Evaluación legal sobre necesidad de registro ante CMF bajo NCG 502 completada y documentada |

---

## §4. Arquitectura de Pagos (Especificación Técnica para Fase 3)

Esta sección define los **únicos patrones aceptables** para implementar pagos en Fase 3. Todo código que se aparte de estos patrones viola §2.3.

### 4.1 — Split Payment (Única Arquitectura Permitida)

```
Residente (anfitrión) ──paga──▶ PSP
                                  │
                    ┌─────────────┴────────────────┐
                    ▼                              ▼
         Cuenta RUT comunidad          Cuenta Estacionate
         (monto neto del cobro)        (fee de servicio)
```

**Invariantes:**
- El PSP, no Estacionate, ejecuta el split. Estacionate nunca recibe el monto total y reenvía.
- `Payout.communityAccountId` apunta a la cuenta RUT registrada de la comunidad.
- `Payment.payerId` siempre es un `userId` con `role = RESIDENT`. Nunca nulo, nunca visitante.
- Estacionate solo persiste el `Payment` como registro — no como custodio de fondos.

### 4.2 — Campos Prohibidos en Modelos Prisma

Nunca agregar a los modelos `Payment`, `Payout`, o cualquier modelo de facturación:
- `visitorId` como pagador.
- `heldBalance` o similar (implicaría custodia).
- `commissionFromCommunityFunds` (Estacionate no puede tomar comisión de fondos comunitarios directamente).

### 4.3 — Webhook y Reconciliación

- `backend/src/api/payments/webhook.ts`: debe verificar que el evento PSP confirme liquidación directa a cuenta de comunidad antes de marcar `Payment.status = PAID`.
- `backend/src/api/cron/reconcile.ts`: debe comparar el balance en cuenta de comunidad (vía API PSP) contra los `Payout` registrados — nunca contra un balance interno de Estacionate.

---

## §5. Matriz de Quórum por Tipo de Decisión

| Decisión | Tipo de asamblea | Quórum | Restricción legal |
|---|---|---|---|
| Contratar SaaS Estacionate (Fase 1) | Ordinaria | Mayoría de presentes | Ninguna |
| Aprobar "Obligación Económica" por uso de estacionamiento (Fase 2) | Extraordinaria | 50%+1 de **totalidad** de derechos | Art. 65 Ley 21.442 |
| Modificar Reglamento de Copropiedad (reglas de estacionamiento) | Extraordinaria | 50%+1 de **totalidad** de derechos | Art. 65 Ley 21.442 |
| Arrendar bien común (ej. sala eventos) | Extraordinaria reforzada | 66% de **totalidad** + escritura pública | Art. 67 Ley 21.442 |
| "Arrendar" estacionamiento de visita | **PROHIBIDO** | N/A | Art. 60 Ley 21.442 — inalienable |

**Consecuencia para el producto:** El frontend nunca debe presentar a administradores opciones que impliquen arrendamiento de estacionamientos de visita. La UI debe usar vocabulario de "reserva" y "tarifa de uso", no "arriendo".

---

## §6. Privacidad de Datos y Preparación Ley N° 21.719

### 6.1 — Patentes como Datos Personales

Las patentes vehiculares son datos personales bajo Ley N° 21.719. Requieren:
- Base legal para tratamiento (consentimiento o interés legítimo documentado).
- Período de retención definido y cumplido.
- Mecanismo de eliminación a solicitud del residente.

### 6.2 — DPA Obligatorio

Antes de onboarding de cualquier comunidad, firmar un Acuerdo de Tratamiento de Datos que establezca:
- Comunidad = Responsable del Tratamiento.
- Estacionate = Encargado del Tratamiento.
- Finalidades de tratamiento (gestión de reservas, control de acceso).
- Período de retención máximo de datos de visitas.
- Procedimiento de DSAR (acceso, rectificación, eliminación).

### 6.3 — Retención de Datos de Visitas

**Máximo 24 meses** para datos de reservas y patentes de visitantes, salvo que un reglamento interno de la comunidad establezca un período menor. Implementar purga automática.

### 6.4 — Solicitudes DSAR

El sistema debe soportar exportación completa de datos de un residente y eliminación de sus datos históricos. No existe actualmente un endpoint `/api/users/:id/data-export` ni `/api/users/:id/delete-data` — estos son requerimientos de Fase 1 avanzada antes de diciembre 2026.

### 6.5 — Deadline Regulatorio

Ley N° 21.719 entra en vigor plena en **diciembre 2026**. Toda comunidad onboardeada antes de esa fecha debe tener DPA firmado y los mecanismos DSAR implementados antes de esa fecha.

---

## §7. Marco Regulatorio Aplicable

| Ley / Norma | Materia | Impacto en Estacionate |
|---|---|---|
| Ley N° 21.442 (Copropiedad Inmobiliaria) | Naturaleza jurídica del estacionamiento de visita; quórum de asambleas | Define qué puede y no puede cobrarse; qué quórum se necesita |
| SII Oficios N° 1.986/2019, N° 3.311/2016, N° 47/2012 | Tributación de contribuciones a Fondo de Reserva | Estructura "Aporte Fondo de Reserva" puede ser no-gravada — requiere confirmación por memo legal |
| Ley N° 20.967 (Estacionamientos) | Responsabilidad civil por vehículos en estacionamientos pagados | Cobro a terceros visitantes activa responsabilidad estricta — prohibición absoluta §2.1 |
| Ley N° 21.719 (Protección de Datos) | Datos personales, DSAR, retención | Patentes son datos personales; DPA obligatorio |
| Ley N° 21.521 + NCG 502 CMF (Fintec) | Custodia y agregación de fondos | Sin registro PSP, no se pueden custodiar fondos de comunidades |
| Ley N° 19.496 (Consumidores) | Protección al consumidor | Cobrar a visitantes haría a Estacionate "proveedor" bajo esta ley, con obligaciones adicionales |

---

## §8. Archivos que Requieren Consultar Este Documento

Todo agente o colaborador que toque cualquiera de los siguientes archivos **debe leer este documento completo antes de hacer cambios** y ejecutar el checklist de `documentation/task-recipes/monetization-change.md`:

**Modelos de datos:**
- `backend/prisma/schema.prisma` — específicamente modelos `Payment`, `Payout`, `PricingRule`, `SalesRepCommission`, o cualquier modelo nuevo de billing/cobro

**Servicios y adapters:**
- `backend/src/services/PaymentService.ts`
- `backend/src/services/payment/**`

**API de pagos:**
- `backend/src/api/payments/**`
- `backend/src/api/cron/reconcile.ts`

**Frontend de cobros/precios:**
- Cualquier componente o página que muestre precios, montos de cobro, o flujos de pago a residentes
- Cualquier texto o copy de UI relacionado con "arriendo", "tarifa", "cobro", o vocabulario comercial de estacionamiento

**Contratos y configuración comercial:**
- Cualquier archivo de configuración de precios, planes SaaS, o comisiones

**Cualquier feature nueva** que introduzca:
- Procesamiento de pagos de cualquier tipo
- Integración con PSP (Transbank, MercadoPago, Khipu, Fintoc, u otro)
- Cobros periódicos o facturación recurrente
- Modelos de datos para transacciones económicas

---

## §9. Cómo Actualizar Este Documento

Este documento solo puede actualizarse cuando **todos** los siguientes pasos estén completos:

1. **Motivación documentada:** El PR incluye justificación explícita de por qué el guardrail debe cambiar.
2. **Revisión legal externa:** Si el cambio afecta §2 (prohibiciones), §3 (fases y gates), o §4 (arquitectura de pagos), requiere revisión de un abogado especialista en derecho chileno de copropiedad o derecho tributario.
3. **Actualización de ADR:** Si el cambio modifica una decisión arquitectónica, debe actualizarse `documentation/adr/0006-legal-commercial-monetization-architecture.md`.
4. **Aprobación explícita del responsable legal/CTO:** No puede ser un cambio unilateral de un agente autónomo.

**Los agentes IA no pueden modificar §2 ni §3 de forma autónoma.** Si un agente identifica una inconsistencia o una restricción desactualizada, debe flagearla al usuario y esperar instrucción explícita.

---

## §10. Historial de Versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-04-27 | Documento inicial — basado en análisis jurídico de Ley 21.442, doctrina SII, Ley 20.967, Ley 21.521, NCG 502 CMF, y Ley 21.719 |
