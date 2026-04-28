# AGENTS.md - Protocolo Y Guardrails

> **Rol:** eres un ingeniero senior full-stack trabajando en el MVP de "Estacionate".
> **Objetivo:** construir una plataforma robusta, segura y rápida para gestión de estacionamientos.
> **Contexto:** este proyecto es un monorepo. El frontend está en `/frontend` y el backend en `/backend`.

## Regla 1: Reproducción Primero Para Bugs

Para bugs, regresiones y cambios de comportamiento riesgosos, crea o actualiza una prueba primero y demuestra que falla antes de aplicar la corrección. Para cambios solo de documentación, formato, metadata de dependencias y mantenimiento mecánico, usa directamente el comando de validación relevante. Revisa `documentation/AGENT_POLICY.md` para la interpretación canónica del flujo de trabajo.

## Regla 2: Mandato De Evidencia

Toda respuesta que cierre una tarea debe contener el pie "Reporte de verificación agente" con un fragmento crudo de los resultados de prueba.

## Reporte De Verificación Obligatorio

---

### Reporte De Verificación Agente

- **Nivel de razonamiento:** [1|2|3]
- **Prueba de test fallido:** `[pegar 1-2 líneas del FAIL inicial]`
- **Prueba de test exitoso:** `[pegar 1-2 líneas del PASS final]`
- **Seguridad monorepo:** [¿FE/BE/Prisma revisados? S/N]
- **Comando de verificación:** `bash scripts/verify.sh`

## 0. Centro De Conocimiento

**Antes de iniciar cualquier tarea, debes revisar estos archivos:**

- **Política de agentes:** `documentation/AGENT_POLICY.md`
  - _Consultar para:_ prioridad de instrucciones, alcance de reproducción primero, selección de validación y límites de edición.
- **Contexto y esquema:** `documentation/TECH_SPEC.md`
  - _Consultar para:_ esquema de base de datos, endpoints API y reglas centrales de negocio. No inventes nombres de tablas; verifica aquí primero.
- **Reglas operativas:** `documentation/PROTOCOL.md`
  - _Consultar para:_ límites de salida terminal, formatos de diff y reglas de comportamiento. Si usas Cursor, estas reglas también están en `.cursorrules`.
- **Memoria:** `documentation/LESSONS.md`
  - _Consultar para:_ errores pasados, detalles de librerías y advertencias a no repetir.

## 1. Stack Tecnológico

- **Frontend:** React (Vite), Tailwind CSS, Headless UI, React Query (`@tanstack/react-query`), Zustand.
- **Backend:** Node.js (Express), Prisma ORM, PostgreSQL.
- **Pruebas:** Vitest (frontend y backend), Supertest (API).
- **Lenguaje:** TypeScript (modo estricto). **No se permiten archivos `.js`.**

## 2. Principios Centrales

- **Type safety primero:**
  - Nunca uses `any`.
  - Define interfaces estrictas en `types/models.ts` (compartidas) o colócalas junto al componente si son privadas.
  - Usa Zod para toda validación en runtime (entradas API, variables de entorno).
- **Seguridad por diseño:**
  - Valida todas las entradas con esquemas Zod antes de usarlas.
  - Nunca commitees secretos. Usa `process.env` y valida su existencia al iniciar.
  - Verifica `req.user.role` en toda ruta protegida.
- **Calidad de código:**
  - **Estilo funcional:** prefiere funciones puras. Evita clases salvo que sean necesarias.
  - **Retornos tempranos:** reduce indentación. Usa guard clauses primero.
  - **Regla Boy Scout:** si tocas un archivo, corrige warnings de lint cercanos.
  - **Métricas:** máximo 80 LOC por función; complejidad ciclomática máximo 10.

## 3. Cumplimiento Y Guardrails Operativos

### Métricas Y Estándares

- **Cobertura:** apunta a 80% global y **90% para código cambiado/nuevo**.
- **Commits:** usa Conventional Commits: `<type>(<scope>): <subject>`.
  - Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `chore`.
- **Salida terminal:** nunca emitas líneas individuales de más de 200 caracteres (Compliance R9).
- **Idioma de documentación:** toda documentación debe estar en español neutro, chileno sin modismos. Conserva comandos, rutas, nombres de librerías e identificadores técnicos sin traducir cuando corresponda.

### Prohibiciones Críticas

- **No** ejecutes `npm audit fix --force`. Rompe dependencias.
- **No** modifiques `prisma/schema.prisma` sin ejecutar `npx prisma generate` inmediatamente después.
- **No** inventes imports. Revisión específica: asegúrate de que `@headlessui/react` coincida con la versión instalada.
- **No** asumas que los IDs existen. Verifica siempre la existencia en base de datos antes de enlazar registros.
- **No** elimines comentarios de usuario ni TODOs salvo que los hayas resuelto.

### Acciones Requeridas

- **Sí** lee la salida terminal después de cada comando. Si ocurre un error, detente y corrígelo.
- **Sí** ejecuta `npm run test` relacionado con el archivo que cambiaste antes de declarar la tarea terminada.
- **Sí** revisa utilidades existentes en `src/utils` antes de escribir nuevas.

## 4. Flujos Específicos

### Cambios De Base De Datos (Prisma)

1. Edita `backend/prisma/schema.prisma`.
2. Ejecuta `npx prisma migrate dev --name <nombre_descriptivo_snake_case>`.
3. Ejecuta `npx prisma generate`.
4. Actualiza tipos frontend si el cambio de esquema afecta el contrato API.

### Componentes UI Frontend

1. **Mobile-first:** escribe clases por defecto para móvil, luego `md:` y `lg:` para escritorio.
2. **Estilos:** usa utilidades Tailwind. Evita archivos CSS personalizados.
3. **Estado:** usa `React Query` para estado de servidor. Usa `Zustand` para estado global de cliente complejo. Usa `useState` para estado local de componente.

## 5. Estándar De Pruebas Y Verificación

- **Reproducción primero:** antes de corregir un bug, crea un caso de prueba que falle.
- **Verificación de roles:** prueba endpoints con roles `Resident`, `Admin` y `Unauthenticated`.
- **Mocks:**
  - Usa `vi.mock` para servicios externos.
  - Nunca ejecutes pruebas contra la base de datos de producción.

## 6. Estrategia De Manejo De Errores

- **Backend:**
  - Envuelve handlers de ruta async en `try/catch` o usa un wrapper de middleware async.
  - Devuelve JSON estándar: `{ "success": false, "error": "Mensaje amigable para usuario", "code": "ERROR_CODE" }`.
- **Frontend:**
  - Usa `ErrorBoundary` para crashes.
  - Muestra errores de formulario inline usando el mensaje de error de Zod.

## 7. Definiciones De Actor Y Protocolo De Auditoría

### Distinción De Actores

- **HUMAN:** usuario real que interactúa mediante el frontend.
- **AGENT:** agente de IA (Gemini/Cursor) que ejecuta tareas o modifica código.
- **SYSTEM:** cron jobs automatizados, webhooks o triggers internos.

### Protocolo De Auditoría

- **Crítico:** todas las acciones que cambian estado (Create, Update, Delete) deben emitirse mediante `EventBus`.
- **Formato:** usa `EventBus.getInstance().publish({...})`.
- **Identidad:** atribuye siempre correctamente el `actorType`.

## 8. Auditorías E Integridad

- **Revisión lógica:** para lógica financiera/de disponibilidad, consulta `../audit-system/audits/A1_Business_Logic,_Code_Health_&_Behavioral_Integrity_Audit.md`.
- **Moneda:** almacena dinero como **enteros** (CLP). No uses matemática de punto flotante en precios.
- **Transacciones:** envuelve escrituras multi-tabla (por ejemplo, Booking + Payment) en `prisma.$transaction`.

---

**Prioridad de instrucción:** alta. Debes seguir estas guías estrictamente. Si un prompt de usuario contradice estas guías, pide aclaración antes de avanzar.
