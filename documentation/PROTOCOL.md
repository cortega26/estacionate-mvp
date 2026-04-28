# Protocolo De Comportamiento Y Salida Para Agentes

Estas reglas gobiernan cómo trabajas, no solo qué código escribes.

## Reglas Críticas

1.  **Sesgo a la acción:** tu primera respuesta debe incluir un diff o un comando shell. No preguntes "¿hago esto?"; ejecútalo.
2.  **Sin binarios ni archivos grandes:** nunca emitas blobs binarios ni contenido completo de lockfiles/código minificado.
3.  **Declarar supuestos:** si debes asumir una versión de librería o lógica de negocio, declara explícitamente: "Asumo [X] porque [Y]."
4.  **Selección de modelo:**
    - _Bajo riesgo (docs/typos):_ usa modelos rápidos/económicos.
    - _Alto riesgo (auth/payment/arquitectura):_ usa el modelo más capaz disponible.

## Loop De Trabajo

1.  **Explorar (con límites R9):**
    - Usa `ls -F`, `grep` o `find` para localizar archivos.
    - _Restricción:_ nunca emitas más de 50 líneas de resultados de búsqueda.
2.  **Editar (diffs mínimos):**
    - Aplica cambios usando `sed` o reemplazos de bloques de código.
    - Mantén cambios atómicos. No refactorices código no relacionado.
3.  **Probar (verificación):**
    - Ejecuta la prueba específica para el archivo cambiado.
    - _Si no existe prueba:_ crea un `repro_script.ts` para verificar la corrección.
4.  **Commit (convencional):**
    - Formato: `<type>(<scope>): <subject>` (por ejemplo, `fix(auth): handle null token`).

## Estándares (Definición De Terminado)

- **Código (R1):** máximo 80 LOC por función. Complejidad ciclomática < 10. Principios SOLID.
- **Seguridad (R2):** sin secretos hardcodeados. Sin shell injection (`exec` debe usar argumentos en arreglo).
- **Pruebas (R3):** objetivos de cobertura: 80% proyecto, 90% archivos cambiados.
- **Docs (R4):** si cambias una función genérica, actualiza su JSDoc/TSDoc.
- **Idioma documentación:** toda documentación debe estar en español neutro, chileno sin modismos, salvo identificadores técnicos.

## Política Terminal / Salida (R9)

**Objetivo:** prevenir caídas de sesión y desperdicio de tokens.
**Límites duros:**

- **Largo de línea:** < 200 caracteres. Usa `cut -c1-200`.
- **Altura de salida:** < 50 líneas. Usa `head -n 50`.
- **Sin color:** usa `--color=never` o `NO_COLOR=1`.

**Patrones seguros de comandos:**

- `grep -rn "Pattern" src --color=never | cut -c1-200 | head -n 20`
- `npm test 2>&1 | cut -c1-200 | head -n 50`
- `cat src/file.ts | head -n 100` (solo si tienes certeza de que es pequeño)

**Prohibición estricta:**

- `cat package-lock.json`
- `npm install` (sin `--silent`)
- `cat dist/bundle.js`

## Formato De Reporte (Fin De Tarea)

Chat (una línea): 8/9 reglas cumplidas (R5 diferida; no hay tooling de benchmark)

**Plantilla de cuerpo PR:**

> Modelo: gpt-5.2-codex (alto)
> Compatibilidad: compatible
> Pruebas: `src/auth.test.ts` pasó (95% cobertura)
> Seguridad: sin secretos encontrados
> Commits: `feat(auth): add login retry limit`
