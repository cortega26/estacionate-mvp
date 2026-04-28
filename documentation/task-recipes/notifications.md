# Receta De Notificaciones

Usa esta receta para cambios de email, SMS, webhooks y notificaciones a usuarios.

## Comienza Con

- `backend/src/services`
- `backend/src/lib`
- `backend/src/api`
- `backend/tests`
- `backend/.env.example`
- `documentation/TECH_SPEC.md`

## Notas De Implementación

- Valida todas las entradas de notificación antes de enviar.
- Mantén adaptadores de proveedores aislados de servicios de dominio.
- Mockea proveedores externos en pruebas.
- Asegura que reintentos y handlers de webhook sean idempotentes.
- Nunca registres secretos, tokens ni payloads completos con información personal identificable.

## Validar Con

```bash
cd backend && npm test -- notification webhook
cd backend && npm run lint && npm run build
```

Si el cambio afecta estado de notificaciones visible para usuarios, ejecuta también las pruebas frontend relevantes para el flujo afectado.
