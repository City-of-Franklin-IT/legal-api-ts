# Legal API

REST API for managing legal documents and case matters (`city-law`), and for the Traffic Citation Portal (`traffic-citation`).

![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Sequelize](https://img.shields.io/badge/Sequelize-6.37-52B0E7?logo=sequelize)

## Overview

This API provides CRUD operations for legal case management, including matters, documents, notes, and related case references. It connects to a SQL Server database and uses Azure Entra ID for authentication.

## Features

- Matter retrieval with filtering by module and search terms
- Document download (individual and batch zip)
- Notes and status tracking per matter
- Related matter cross-references
- Azure Entra ID authentication
- Rate limiting and security headers
- Traffic Citation Portal: public requests with proof uploads, and a staff review queue (see [Traffic Citation module](#traffic-citation-module))

## Prerequisites

- Node.js 18+
- npm
- SQL Server database access

## Installation

```bash
git clone <repository-url>
cd legal-api-ts
npm install
cp src/config/config.env.example src/config/config.env
# Edit config.env with your settings
```

## Configuration

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (`development` or `production`) |
| `HOST` | Server host URL |
| `PORT` | Server port |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `CITY_LAW_DB_HOST` | SQL Server hostname |
| `CITY_LAW_DB_DATABASE` | Database name |
| `BASE_URL` | API base path (e.g., `/api/v2/legal`) |
| `TRAFFIC_CITATION_DB_HOST` | SQL Server hostname for the traffic citation database |
| `TRAFFIC_CITATION_DB_DATABASE` | Database name (`court_traffic_citation`) |
| `TRAFFIC_CITATION_TOKEN_SECRET` | Secret that signs the defendant's short-lived token (random value, different in each environment) |
| `TRAFFIC_CITATION_TOKEN_TTL` | Defendant token lifetime (default `20m`) |
| `TRAFFIC_CITATION_MAX_UPLOAD_BYTES` | Largest proof file accepted (default 10 MB) |
| `ENTRA_URL` | Azure Entra ID validation endpoint |

Example `.env`:
```
NODE_ENV=development
HOST=https://localhost
PORT=5003
DB_USERNAME=api
DB_PASSWORD=your_password
CITY_LAW_DB_HOST=localhost
CITY_LAW_DB_DATABASE=CityLaw
BASE_URL=/api/v2/legal
ENTRA_URL=http://localhost/api/v1/entra/validate
```

## Usage

```bash
# Development with auto-reload
npm run dev

# Production
npm run build
npm start
```

## Project Structure

```
src/
├── config/        # Database and environment configuration
├── controllers/   # Request handlers and business logic
├── middleware/    # Auth, error handling, security
├── models/        # Sequelize ORM models
├── routes/        # Express route definitions
└── utils/         # Shared utilities
```

## API Routes

Base URL: `/api/v2/legal/city-law`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/matter` | Get all matters (supports `module` and `searchValue` query params) |
| GET | `/matter/:matterId` | Get single matter with related data |
| GET | `/document/:docId` | Download a document |
| GET | `/document/zip/:matterId` | Download all documents for a matter as zip |

All routes require Azure Entra ID authentication (bypassed in development mode).

## Traffic Citation module

Serves the Traffic Citation Portal (frontend repo: `citation-portal-vite-ts`). Own database, `court_traffic_citation`.

Base URL: `/api/v2/legal/traffic-citation`

**Public, no token** (rate limited)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/public/request` | Create a request with its offenses |
| POST | `/public/request/:uuid/verify` | Confirm email and phone, returns a 20-minute token for that request |

**Public, requester token** (`Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/me` | The defendant's own request: offenses with outcomes, amounts and the More info note, their files and messages |
| GET, POST | `/public/correspondence` | Read or send messages |
| POST | `/public/offense/:uuid/attachment` | Upload the proof file (one per offense; a second only after the court asks for more info) |
| GET | `/public/attachment` | List the defendant's proof files |
| GET | `/public/attachment/:uuid/download` | Download one |

**Staff** (Entra token with the `citation.admin` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/request` | Queue, with derived status and duplicate flags (`searchValue`, `requestType`, `status`) |
| GET | `/request/:uuid` | One request with offenses and decision history, messages, file list, notifications and possible duplicates |
| PUT | `/request/:uuid/due-date` | Set the payable-by date |
| POST | `/request/:uuid/correspondence` | Send a message to the defendant |
| POST | `/request/:uuid/notification` | Record the answer to "Ready to notify defendant?" |
| POST | `/offense/:uuid/decision` | Record a decision (multipart when the court's driving school letter is attached) |
| GET | `/attachment/:uuid/download` | Download a proof file or letter |

Uploads accept PDF, JPG, PNG and HEIC/HEIF, checked by file contents. Status is derived from offense outcomes, not stored.

**Database scripts** live in the frontend repo, not here:

| File (in `citation-portal-vite-ts`) | Use |
|---|---|
| `docs/SCHEMA.md` | Schema design |
| `docs/sql/create-traffic-citation-db.sql` | Creates the whole database (fresh install) |
| `docs/sql/add-notification-table.sql` | Adds the `notification` table to a database made before it existed |
| `docs/sql/alter-datetime-to-datetime2.sql` | Converts older audit columns to `DATETIME2` |

## Development

No linting or testing is currently configured.

## Deployment

```bash
npm run deploy
```

This builds the project, syncs to the production server via rsync, and restarts the PM2 process.
