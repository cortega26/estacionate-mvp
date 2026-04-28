# ADR 0006: Arquitectura Legal-Comercial de Monetización

**Estado:** Aceptado  
**Fecha:** 2026-04-27  
**Fuente de verdad:** `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`

---

## Contexto

Estacionate es una plataforma SaaS para gestión de estacionamientos de visita en condominios chilenos. La pregunta central de monetización es: ¿puede la plataforma cobrar por el uso del espacio físico, y si es así, cómo?

El análisis jurídico de la normativa chilena aplicable revela que la respuesta no es técnica sino legal, y que las restricciones son específicas y no triviales:

- **Ley N° 21.442 (Copropiedad Inmobiliaria), Art. 60:** Los estacionamientos de visita son propiedad común inalienable. No pueden venderse ni asignarse en uso exclusivo.
- **Ley N° 20.967 (Estacionamientos):** El cobro directo a un tercero visitante convierte al cobrador en "establecimiento de estacionamiento pagado" con responsabilidad civil estricta por robo y daño — sin posibilidad de disclaimer.
- **Doctrina SII (Oficios N° 1.986/2019, N° 3.311/2016, N° 47/2012):** Contribuciones internas de residentes al Fondo de Reserva no son renta afecta ni sujetas a IVA. Cobrar a terceros externos activa 19% IVA + 25% impuesto renta.
- **Ley N° 21.521 + NCG 502 CMF:** Custodia de fondos de terceros sin registro PSP expone a sanciones regulatorias.
- **Ley N° 21.719:** Patentes vehiculares son datos personales; se requiere DPA entre comunidad y Estacionate.

El repositorio ya contiene infraestructura de pagos (PaymentService, MercadoPagoAdapter, reconcile cron, modelos Prisma Payment/Payout/PricingRule) que no ha sido habilitada bajo un marco legal válido. Esta infraestructura existe como código de demo/simulador.

---

## Decisión

Adoptamos un **modelo de tres fases con gate conditions explícitas** que progresa únicamente cuando las condiciones legales y de mercado están satisfechas y documentadas.

### Fase 1 — SaaS Puro B2B (Habilitado)

Estacionate cobra a las comunidades una suscripción SaaS (software como servicio). No procesa pagos de residentes a comunidades por uso del espacio físico. El código de pagos existente permanece como infraestructura de demo/simulador, no activo contra comunidades reales.

### Fase 2 — Cobro Diferido como Obligación Económica (Bloqueado por gate G2.1 + G2.2)

Los residentes anfitriones son cobrados por sus comunidades como "Aporte al Fondo de Reserva" integrado en Gastos Comunes. El cobro es **residente → comunidad**, nunca visitante → Estacionate. Esta estructura se apoya en la doctrina SII de no-gravabilidad de aportes internos al Fondo de Reserva, sujeta a confirmación por memo legal vinculante.

**Gate G2.1:** Memo legal de estudio jurídico chileno especializado confirmando viabilidad tributaria y de copropiedad.  
**Gate G2.2:** Al menos una comunidad piloto con acta de asamblea extraordinaria (50%+1 de derechos totales) aprobando la obligación económica.

### Fase 3 — Pagos Integrados con Split Payment (Bloqueado por gates de Fase 2 + G3.3 + G3.4)

PSP certifica Split Payment: los fondos de la comunidad se liquidan directamente a la cuenta RUT de la comunidad; el fee de Estacionate fluye en transacción separada. Los fondos comunitarios nunca tocan el ledger de Estacionate.

---

## Consecuencias

### Positivas

- Elimina exposición fiscal (IVA + renta) mientras no se confirme tributariamente.
- Elimina responsabilidad civil por daño/robo de vehículos (Ley 20.967) al no cobrar a visitantes externos.
- Elimina riesgo regulatorio CMF/Fintec (no hay custodia de fondos en Fase 1).
- La progresión de fases está gobernada por evidencia legal real, no por optimismo comercial.

### Restricciones que este ADR impone

- El código de PaymentService, MercadoPagoAdapter, reconcile cron y modelos Payment/Payout no puede activarse contra comunidades reales hasta que Gate G2.1 + G2.2 estén documentados.
- Ningún cambio a los archivos listados en §8 de `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` puede hacerse sin ejecutar el checklist de `documentation/task-recipes/monetization-change.md`.
- La palabra "arriendo" está prohibida en toda la UX, contratos, y documentación comercial de Estacionate.

### Alternativas descartadas

| Alternativa                                                   | Por qué se descartó                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cobrar directamente a visitantes                              | Activa responsabilidad civil estricta (Ley 20.967) + IVA + renta + Ley del Consumidor                               |
| Custodiar fondos de comunidades en Estacionate y redistribuir | Requiere registro PSP bajo NCG 502 CMF; riesgo regulatorio desproporcionado para MVP                                |
| Usar "arriendo" como marco jurídico                           | Art. 60 Ley 21.442 prohíbe arriendo de estacionamientos de visita; además requeriría quórum 66% + escritura pública |
| Avanzar a Fase 2 sin memo legal                               | Expone a impugnaciones judiciales de copropietarios; riesgo de nulidad de todos los cobros realizados               |

---

## Referencias

- `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` — fuente de verdad completa con §2 prohibiciones, §3 gates, §4 arquitectura técnica, §5 quórum, §6 privacidad
- `documentation/ROADMAP_SAAS_INDUSTRY_GRADE.md` — decisión estratégica N°2 ya alineada: "posicionar como proveedor SaaS/intermediario tecnológico; evitar custodiar fondos"
- `backend/src/services/PaymentService.ts` — infraestructura existente clasificada como demo/simulador
- `backend/prisma/schema.prisma` — modelos Payment, Payout, PricingRule requieren gate antes de producción real
