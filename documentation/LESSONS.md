# Lecciones Aprendidas Y Errores Comunes

> **Instrucción:** lee este archivo antes de escribir código. Revisa si tu tarea cae en una advertencia conocida.

## 1. Manejo De Fechas

- **Error:** usar `new Date()` directamente para cálculos de zona horaria.
- **Corrección:** usar siempre `date-fns` y manejar explícitamente la zona horaria de Chile (UTC-3/UTC-4).

## 2. Base De Datos

- **Error:** consultar `Booking` sin incluir la relación `include: { ParkingSpot: true }`.
- **Corrección:** el frontend siempre espera el número de estacionamiento, así que incluye siempre la relación.

## 3. Tailwind

- **Error:** usar valores arbitrarios como `w-[350px]`.
- **Corrección:** ajustarse a los tokens del sistema de diseño, como `w-full max-w-sm`.

## 4. Copy Comercial Y Legal

- **Error:** describir Estacionate como marketplace o usar lenguaje de monetización de estacionamientos como pitch activo del producto.
- **Corrección:** la Fase 1 es SaaS B2B para orden, reglas, validación de conserjería, trazabilidad y reportes operativos. Pagos, payouts, PSP y cobros a residentes/comunidades son demo/simulador o futuro bloqueado hasta cumplir los gates de `LEGAL_COMMERCIAL_GUARDRAILS.md`.

## 5. Idioma De Documentación

- **Error:** crear o actualizar documentación en inglés.
- **Corrección:** mantener toda documentación en español neutro, chileno sin modismos. Conservar sin traducir comandos, rutas, APIs, identificadores de código, nombres de librerías y etiquetas que sean contratos técnicos.
