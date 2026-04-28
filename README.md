# Estacionate MVP

Estacionate es una plataforma SaaS para comunidades residenciales chilenas y administradores de edificios que permite gestionar estacionamientos de visita con reglas claras, reservas, validación de conserjería, trazabilidad y reportes operativos.

La fase de producto habilitada actualmente es **Fase 1: SaaS B2B sin pagos integrados de residentes ni comunidades**. El código relacionado con pagos, payouts y PSP existe solo como infraestructura demo/simulador y no debe usarse con comunidades reales hasta cumplir los controles legales/comerciales definidos en `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`.

## Posicionamiento Del Producto

Estacionate no está posicionado actualmente como marketplace y no habilita pagos directos de visitantes por estacionamientos de visita.

El MVP se enfoca en:

- reducir disputas relacionadas con estacionamientos;
- entregar trazabilidad a administradores y comités;
- ayudar a los equipos de conserjería a validar reservas rápidamente;
- crear registros auditables de uso de estacionamientos de visita;
- permitir monetización futura más segura solo si se cumplen controles legales, tributarios, de asamblea y PSP.

Los ingresos de la Fase 1 se limitan a un contrato SaaS B2B mensual o anual con la comunidad o la administradora del edificio. En la fase de producto habilitada no existe cobro directo a visitantes, flujo de pago residente-comunidad dentro de la plataforma, flujo de payout ni custodia de fondos comunitarios por parte de Estacionate.

## Stack Técnico

- **Frontend:** React, Vite, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, TypeScript, Prisma (PostgreSQL)
- **Infraestructura:** Redis (colas/caché), Docker
- **Pruebas:** Playwright (E2E), Vitest (unitarias)

## Prerrequisitos

- Node.js 24.15.0 LTS
- `nvm` recomendado; este repositorio incluye `.nvmrc`, por lo que `nvm use` selecciona el runtime fijado
- Docker y Docker Compose para PostgreSQL/Redis local

## Inicio

### Preparación Rápida

Para un entorno local limpio, ejecuta:

```bash
npm run bootstrap
```

Esto instala dependencias, crea archivos `.env` locales cuando falten, inicia PostgreSQL y Redis, aplica migraciones Prisma y carga la base de datos con datos demo. Luego inicia frontend y backend juntos.

Para aprovisionar todo sin levantar los servidores de desarrollo:

```bash
npm run bootstrap -- --no-start
```

### Configuración Manual

#### 1. Instalación

```bash
nvm use
npm run install:all
```

#### 2. Configuración De Entorno

Crea archivos de entorno locales desde los ejemplos:

```bash
cp backend/.env.local.example backend/.env
cp frontend/.env.example frontend/.env
```

**Variables requeridas del backend:**

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PORT` (valor por defecto: 3000)

Para los valores locales por defecto de infraestructura, revisa `docker-compose.yml` y `documentation/INFRASTRUCTURE.md`.

#### 3. Ejecución Del Proyecto

Inicia PostgreSQL y Redis:

```bash
docker compose up -d postgres redis
```

Prepara la base de datos:

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
```

Inicia backend y frontend juntos:

```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Pruebas

### Pruebas E2E (Playwright)

Ejecuta pruebas end-to-end completas para los flujos críticos de reserva de visitas.

```bash
cd frontend
npm run test:e2e
```

Para ver el reporte:

```bash
npx playwright show-report
```

### Pruebas Unitarias

```bash
npm run test
```

### Validación Completa

```bash
npm run check:all
```

Si PostgreSQL/Redis locales podrían no estar corriendo todavía, usa:

```bash
npm run check:local
```

## Estructura Del Proyecto

- `frontend/`: aplicación React y pruebas E2E (`/e2e`)
- `backend/`: API Express, esquema Prisma y lógica de negocio
- `documentation/`: documentación detallada de arquitectura y producto
- `documentation/commercial/`: materiales comerciales activos de Fase 1
- `documentation/archive/`: documentación histórica que no es fuente vigente
- `documentation/CODEMAP.md`: mapa de archivos y flujos para agentes/contribuyentes
- `documentation/OWNERSHIP.md`: guía de propiedad y límites de edición
- `documentation/TASKS.md`: puntos de entrada por tarea y pistas de validación
- `documentation/VALIDATION.md`: guía de comandos de validación
- `documentation/adr/`: registros de decisión de arquitectura
- `AGENTS.md`: guía de inicio rápido para agentes y nuevos contribuyentes
