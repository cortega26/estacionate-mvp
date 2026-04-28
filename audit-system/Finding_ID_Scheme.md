# Esquema De ID De Hallazgos

## Propósito

Entregar un **identificador estable, único y trazable** para cada hallazgo de auditoría en todas las auditorías.

Este esquema permite:

- Deduplicación entre auditorías
- Seguimiento histórico
- Reportes parseables por máquina
- Contexto legible para personas

## Formato

```text
A{AuditID}-S{Severity}-{Sequence}
```

### Ejemplo

```text
A2-S1-004
```

| Componente | Significado                                    |
| ---------- | ---------------------------------------------- |
| `A2`       | ID de auditoría (seguridad)                    |
| `S1`       | Severidad                                      |
| `004`      | Número secuencial, estable dentro de auditoría |

## Mapeo De Severidad

| Código | Significado             |
| ------ | ----------------------- |
| S0     | Crítico / bloquea envío |
| S1     | Alto                    |
| S2     | Medio                   |
| S3     | Bajo                    |

## Reglas

- Los números de secuencia **deben ser estables** una vez asignados.
- Los hallazgos eliminados **nunca se reutilizan**.
- Los hallazgos delegados **no reciben IDs**.
- Los IDs son inmutables entre reejecuciones.

## Uso Válido

- Nombres de archivo
- Tickets Jira
- Exportaciones CSV
- Deduplicación del orquestador
