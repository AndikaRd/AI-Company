# Virtual AI Company (VAC)

> An enterprise-grade platform where AI employees collaborate inside an interactive isometric 3D virtual office.

---

## Architecture Highlights

- **Interactive 3D Virtual Headquarters**: Built with Three.js, React Three Fiber (R3F), and `@react-three/drei`. Features isometric perspective projection, 3-axis orbital interaction (pan, rotate, zoom), dynamic shadow mapping, and dedicated `CharacterAnchor` mount points ready for rigged GLB character models.
- **Enterprise Management Dashboard**: Real-time telemetry monitoring, live PostgreSQL database connectivity verification, active company profile, and seeded department overview.
- **Modular NestJS Backend**: Global `/api` prefix, centralized error handling via `AllExceptionsFilter`, strict DTO validation with `class-validator`, and pre-configured Socket.IO event gateway for upcoming real-time agent communications.
- **PostgreSQL & Prisma ORM**: Relational schema supporting Companies, Departments, Employees, and 1-to-1 optional `AgentConfiguration` records with UUID primary keys and cascading integrity.
- **Strict Monorepo**: Managed with `pnpm workspace` featuring shared packages for domain types (`@vac/shared`) and runtime schema validators (`@vac/validators`).

---

## Monorepo Layout

```
virtual-ai-company/
├── apps/
│   ├── web/               # React 18, Vite, Three.js, R3F, TailwindCSS, Zustand
│   └── api/               # NestJS 10, Prisma ORM, Socket.IO, REST API
├── packages/
│   ├── shared/            # Shared interfaces, constants, socket events
│   └── validators/        # Zod validation schemas
├── infrastructure/        # Dockerfiles & PostgreSQL init script
├── docs/                  # Architecture & database design documentation
├── .env.example           # Environment variables template
├── docker-compose.yml     # PostgreSQL service definition
├── package.json           # Workspace root commands
└── pnpm-workspace.yaml    # Workspace packages config
```

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher (Tested on `v24.18.0`)
- **pnpm**: `v10.0.0` or higher (Tested on `v12.16.1`)
- **PostgreSQL**: `15+` (Tested on `18.6-x64`)

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
# Install dependencies across all workspace projects
pnpm install
```

### 2. Configure Environment Variables

Create `.env` inside `apps/api/.env` (or copy from `.env.example`):

```bash
# apps/api/.env
PORT=3000
NODE_ENV=development
API_PREFIX=/api
CORS_ORIGIN=http://localhost:5173

# Adjust database credentials as needed
DATABASE_URL="postgresql://postgres:Admin%402026%40@localhost:5432/virtual_ai_company?schema=public"
```

Create `.env` inside `apps/web/.env`:

```bash
# apps/web/.env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### 3. Database Migration & Seeding

```bash
# Generate Prisma Client
pnpm db:generate

# Apply database migration
pnpm db:migrate

# Seed development company and 8 foundational departments
pnpm db:seed
```

### 4. Running the Development Servers

```bash
# Run both Backend API and Frontend Web concurrently
pnpm dev

# Or run services independently:
pnpm dev:api   # Starts NestJS on http://localhost:3000/api
pnpm dev:web   # Starts Vite on http://localhost:5173
```

---

## Production Build

```bash
# Cleanly builds all shared packages, API service, and Web frontend
pnpm build
```

---

## API Health Check

Verify backend and database connectivity:

```bash
curl http://localhost:3000/api/health
```

Example response:
```json
{
  "status": "ok",
  "timestamp": "2026-11-02T03:45:59.524Z",
  "uptime": 45,
  "environment": "development",
  "database": {
    "status": "connected",
    "latencyMs": 12
  },
  "version": "0.1.0"
}
```

---

## 3D Spatial Virtual Office Controls

- **Orbit / Rotate**: `Left Click + Drag`
- **Pan Floor Plane**: `Right Click + Drag` or `Middle Click`
- **Zoom In / Out**: `Mouse Scroll Wheel` or `Pinch`
- **Camera Presets**: Click on HUD controls (`Isometric Default`, `Top Down Blueprint`, `Tech Hub`, `Executive Wing`)
- **Inspect Department**: Click on any 3D floating tag or floor zone to open the Department Inspector card.

---

## Documentation Links

- [System Architecture Overview](file:///docs/architecture/system-overview.md)
- [Frontend Architecture](file:///docs/architecture/frontend-architecture.md)
- [Backend Architecture](file:///docs/architecture/backend-architecture.md)
- [Database Design & ERD](file:///docs/database/database-design.md)

