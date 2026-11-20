# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development with auto-reload (nodemon + tsconfig-paths)
npm run build    # Compile TypeScript and resolve path aliases (tsc && tsc-alias)
npm start        # Run compiled production app (npx tsx dist/app.js)
npm run deploy   # Deploy to production server via rsync + PM2 restart
```

No linting or testing is currently configured.

## Architecture

This is a modular Express.js REST API for managing legal documents and case matters, using TypeScript with Sequelize ORM connecting to SQL Server.

### Structure

- **Domain-driven organization**: Code is organized by domain (e.g., `city-law`) under models/, controllers/, and routes/
- **Path aliases**: Use `@/` prefix for imports (configured in tsconfig.json, resolved by tsc-alias in build)
- **Base URL**: `/api/v2/legal` with sub-routes for each domain

### Key Patterns

**Request/Response Flow:**
```
Routes → Auth Middleware → Async Wrapper → Controller → Model → Response
```

**Async Wrapper**: All controller functions are wrapped with `asyncHandler` from `@/middleware/async` to catch promise rejections and pass to error handler.

**Error Handling**: Use `ErrorResponse` class from `@/utils/errorResponse` with statusCode property. Global error handler in `@/middleware/errorHandler` handles Sequelize validation errors.

**Response Format:**
```typescript
{ success: boolean, data?: any, error?: any, msg?: string }
```

**Authentication**: Azure Entra ID via middleware. Development mode bypasses auth with test user (see `@/middleware/auth/entra.ts`).

### Traffic Citation module

`traffic-citation` (own database `court_traffic_citation`, see `TRAFFIC_CITATION_*` env vars; design in the `citation-portal-vite-ts` repo, `docs/SCHEMA.md`) serves the Traffic Citation Portal. Three auth tiers:

- **Public, open** (`/public/request`, `/public/request/:uuid/verify`): create a request, or confirm email + phone to get a token. Rate limited per IP; verify is also limited per request.
- **Public, token** (`/public/*`): a stateless requester token (`@/utils/requesterToken`, `@/middleware/auth/requesterToken`, 20 min) scoped to that one request: read it, upload proof to one of its offenses, send a message.
- **Staff** (`/request`, `/offense`, `/attachment`): Entra plus the `citation.admin` role (`@/utils/requireRole`).

Offenses hold the current outcome; `approval` is an append-only decision history. Status is derived from offense outcomes, not stored. Uploads (`@/middleware/upload`) accept PDF, JPG, PNG and HEIC/HEIF by file contents only, and are stored as VARBINARY (the `attachment` column is excluded by the model's default scope). A driving school decision (`POST /offense/:uuid/decision`) may be multipart with the court's letter in field `attachment`; the letter is stored with `isInternal = true` in the same transaction as the decision, the defendant never sees it, and it does not count toward their one proof file. Times are `DATETIME2` stored as UTC (`timezone: "+00:00"`); the module's index patches Sequelize's SQL Server `date` parser so a `DATE` reads back as the same calendar day.

### Models

Located in `src/models/city-law/`. Matter is the central model with hasMany relationships to Documents, Notes, RelatedMatters, and hasOne to StatusNote.

- Model interfaces defined in `types.ts` files
- Models use factory pattern, receiving sequelize instance
- All exported from domain index.ts files

### Database

SQL Server via Sequelize with tedious driver. Configuration in `src/config/config.ts` with separate dev/production settings.

## Documentation

When creating README.md files, use the template at `/opt/claude-standards/README_TEMPLATE.md` as a guide.
