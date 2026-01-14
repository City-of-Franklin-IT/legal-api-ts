# Legal API

REST API for managing legal documents and case matters.

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
| `BASE_URL` | API base path (e.g., `/api/v1/legal`) |
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
BASE_URL=/api/v1/legal
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

Base URL: `/api/v1/legal/city-law`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/matter` | Get all matters (supports `module` and `searchValue` query params) |
| GET | `/matter/:matterId` | Get single matter with related data |
| GET | `/document/:docId` | Download a document |
| GET | `/document/zip/:matterId` | Download all documents for a matter as zip |

All routes require Azure Entra ID authentication (bypassed in development mode).

## Development

No linting or testing is currently configured.

## Deployment

```bash
npm run deploy
```

This builds the project, syncs to the production server via rsync, and restarts the PM2 process.
