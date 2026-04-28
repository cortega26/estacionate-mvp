# Auditoría A1: Hallazgos De Lógica De Negocio Y Salud De Código

## 1. Resumen Ejecutivo

**Puntaje:** B-

La lógica de negocio central es relativamente limpia, pero le falta robustez en flujos financieros críticos. En particular, el cálculo de comisiones no es idempotente, lo que expone a riesgo de pagos duplicados. El manejo de errores en servicios es mínimo y suele depender del caller o de handlers globales sin tipos de error específicos.

## 2. Hallazgos

### 2.1 Integridad Financiera (Crítica)

- **[S1] Falla de idempotencia en cálculo de comisión**
  - **Ubicación:** `backend/src/services/SalesService.ts:10` (`calculateCommission`)
  - **Problema:** la función no revisa si ya existe un registro `Commission` para el `Payout` dado.
  - **Impacto:** si `calculateCommission` se dispara dos veces (por ejemplo, retry logic o race condition), el sales rep recibirá comisión duplicada.
  - **Corrección:**
    ```typescript
    const existing = await prisma.salesRepCommission.findFirst({ where: { payoutId: payout.id } });
    if (existing) return existing;
    ```

### 2.2 Manejo De Errores

- **[S2] Manejo de error genérico**
  - **Ubicación:** `backend/src/services/auth.ts:29`
  - **Problema:** el bloque `catch` genérico de `verifyToken` retorna `null` ante cualquier error (expirado, malformado, firma distinta).
  - **Impacto:** dificulta depurar por qué se rechazan tokens.
  - **Corrección:** diferenciar `TokenExpiredError` versus `JsonWebTokenError`.

### 2.3 Manejo De Estado

- **[S2] Límites transaccionales faltantes**
  - **Ubicación:** `SalesService.ts`
  - **Problema:** la creación de comisión está separada de actualizaciones de payout. Si una falla, los datos pueden quedar inconsistentes.
  - **Recomendación:** usar `prisma.$transaction` al enlazar registros financieros.

## 3. Recomendaciones

1. **Corregir idempotencia:** parchear de inmediato `SalesService.ts` para prevenir comisiones duplicadas.
2. **Transacciones:** envolver mutaciones DB relacionadas en transacciones.
