# Backend Commit File

Registro de todos los cambios realizados en el backend.

---

## [2026-05-19 22:30] - [SCHEMA PRISMA]

**Acción**: Añadidos campos de verificación de email al modelo User
**Archivos afectados**:
- `prisma/schema.prisma` - Añadidos `emailVerified Boolean @default(false)` y `emailVerificationToken String? @unique` al modelo User

**Detalles**:
`emailVerificationToken` es un UUID aleatorio largo, por lo que se guarda en claro (no hasheado) y se marca como `@unique` para poder buscar el usuario por ese token. `emailVerified` arranca en false en cada registro.

---

## [2026-05-19 22:30] - [MIGRACIÓN]

**Acción**: Creada migración manual `add_email_verification`
**Archivos afectados**:
- `prisma/migrations/20260519223045_add_email_verification/migration.sql` - SQL que añade las columnas `emailVerified` y `emailVerificationToken` y crea el índice único

**Detalles**:
La migración se escribió manualmente porque las migraciones se ejecutan en un servidor remoto. NO se ejecutó `npx prisma migrate`. Pasos manuales pendientes: aplicar la migración en el servidor remoto con `npx prisma migrate deploy` y regenerar Prisma Client.

**Comandos ejecutados** (pendientes, a ejecutar por el equipo en remoto):
```bash
npx prisma migrate deploy
npx prisma generate
```

---

## [2026-05-19 22:30] - [NUEVO ARCHIVO]

**Acción**: Añadida función `sendVerificationEmail` al servicio de email
**Archivos afectados**:
- `src/shared/email/email.service.ts` - Nueva interfaz `VerificationEmailOpts` y función `sendVerificationEmail`

**Detalles**:
Plantilla HTML con fondo oscuro y branding WealthGift, botón "Verify my email" que apunta a la `verificationUrl` completa. Reutiliza el helper `send()` existente.

---

## [2026-05-19 22:30] - [MODIFICACIÓN]

**Acción**: Flujo de verificación de email en el módulo auth
**Archivos afectados**:
- `src/modules/auth/auth.types.ts` - Añadida interfaz `RegisterResponse { message: string }`
- `src/modules/auth/auth.service.ts` - `register()` ahora crea el usuario sin verificar, genera token UUID, envía email y devuelve `RegisterResponse` (sin JWT); `login()` lanza `ForbiddenError` 403 si el email no está verificado; nuevas funciones `verifyEmail(token)` y `resendVerification(email)`
- `src/modules/auth/auth.controller.ts` - Nuevos handlers `verifyEmailHandler` (lee `token` de query param) y `resendVerificationHandler`
- `src/modules/auth/auth.routes.ts` - Nuevas rutas `GET /verify-email` (sin auth) y `POST /resend-verification` (validada con zod)

**Detalles**:
Se reutilizó la clase `ForbiddenError` ya existente en `src/shared/errors/http-errors.ts` (no fue necesario crearla). El endpoint `resend-verification` no revela si el email existe: devuelve siempre el mismo mensaje. El token de verificación se regenera en cada reenvío. La ruta `verify-email` usa query param porque el middleware `validate` sólo valida `req.body`; la validación del token se hace dentro del handler/servicio.

---

## [2026-06-01 15:42] - [MODIFICACIÓN]

**Acción**: Nuevo endpoint de historial consolidado del portafolio del destinatario
**Archivos afectados**:
- `src/modules/recipient/recipient.service.ts` - Añadida función `getConsolidatedPortfolioHistory(userEmail, period)`
- `src/modules/recipient/recipient.controller.ts` - Añadido `getConsolidatedHistoryHandler`
- `src/modules/recipient/recipient.routes.ts` - Añadida ruta `GET /portfolio/consolidated/history`

**Detalles**:
Nuevo endpoint `GET /api/recipient/portfolio/consolidated/history?period=1M` que devuelve `{ period, data: [{ date, value }], totalInvested, totalCurrentValue }`. La serie `data` es el historial del portafolio escalado a dólares: para cada punto de la línea de tiempo (tomada del primer símbolo con historial) se suma, por cada posición activa, `(precio[i] / últimoPrecio) * totalCurrentValue` de esa posición. Sólo se consideran posiciones activas (donde NO todos los regalos están redimidos). Los precios se obtienen en paralelo vía `fetchPriceHistory` con captura de errores por símbolo. La ruta se registró ANTES de `/portfolio/consolidated` para evitar conflictos de matching. `period` se valida contra `['1D','1W','1M','1Y','ALL']` con default `1M`. Valores redondeados a 2 decimales.

---
