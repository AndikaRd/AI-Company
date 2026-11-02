# Backend Architecture Documentation

The **Virtual AI Company (VAC)** backend service is built on **NestJS 10**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## Modular Backend Structure

```
apps/api/src/
├── common/
│   ├── filters/
│   │   └── all-exceptions.filter.ts   # Centralized error handler preventing credential leaks
│   └── interfaces/
│       └── api-response.interface.ts  # Standardized API response format
├── config/
│   └── configuration.ts              # Strongly-typed environment variables
├── modules/
│   ├── company/                      # Company entity management & active retrieval
│   │   ├── dto/create-company.dto.ts
│   │   ├── company.controller.ts
│   │   ├── company.service.ts
│   │   └── company.module.ts
│   ├── departments/                  # Department zones, floor layouts, and counts
│   │   ├── dto/create-department.dto.ts
│   │   ├── departments.controller.ts
│   │   ├── departments.service.ts
│   │   └── departments.module.ts
│   ├── employees/                    # Employee & AgentConfiguration lifecycle
│   │   ├── dto/create-employee.dto.ts
│   │   ├── employees.controller.ts
│   │   ├── employees.service.ts
│   │   └── employees.module.ts
│   ├── events/                       # Socket.IO Gateway for agent lifecycle events
│   │   ├── events.gateway.ts
│   │   └── events.module.ts
│   ├── health/                       # Health telemetry & PostgreSQL ping
│   │   ├── health.controller.ts
│   │   ├── health.service.ts
│   │   └── health.module.ts
│   └── prisma/                       # Global PrismaService with connection hooks
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── app.module.ts                     # Root module orchestrating feature modules
└── main.ts                           # Bootstrap entry point with CORS, pipes, and prefix
```

---

## API Endpoints Reference

All endpoints are served under the global prefix `/api`:

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive API status, database ping, uptime & timestamp | `200 OK` / `503 Service Unavailable` |
| `GET` | `/api/companies` | List all registered companies | `200 OK` |
| `GET` | `/api/companies/active` | Retrieve the active development company with departments and counts | `200 OK` / `404 Not Found` |
| `GET` | `/api/companies/:id` | Get company by UUID | `200 OK` / `404 Not Found` |
| `POST` | `/api/companies` | Create a new company profile | `201 Created` / `400 Bad Request` |
| `GET` | `/api/departments` | List all departments (optionally filter by `?companyId=UUID`) | `200 OK` |
| `GET` | `/api/departments/:id` | Get department details with employee counts | `200 OK` / `404 Not Found` |
| `POST` | `/api/departments` | Create a new department under a company | `201 Created` / `400 Bad Request` |
| `GET` | `/api/employees` | List employees (optionally filter by `?departmentId=UUID`) | `200 OK` |
| `GET` | `/api/employees/stats` | Aggregated employee and AI Agent metrics | `200 OK` |
| `GET` | `/api/employees/:id` | Get employee profile including optional `AgentConfiguration` | `200 OK` / `404 Not Found` |
| `POST` | `/api/employees` | Provision a new employee / AI agent with optional configuration | `201 Created` / `400 Bad Request` |

---

## Centralized Error Handling & Security

- `AllExceptionsFilter`:
  - Intercepts all runtime exceptions across HTTP requests.
  - Sanitizes error payloads in production mode to avoid leaking internal stack traces or connection strings.
  - Formats responses into standard JSON contracts `{ success: false, statusCode, error, message, timestamp, path }`.
- Input validation:
  - Global `ValidationPipe` with `whitelist: true`, `transform: true`, and `forbidNonWhitelisted: true`.
  - All input DTOs strictly validated with `class-validator` decorators.

---

## Real-Time Architecture (Socket.IO)

The `EventsGateway` is mounted on the server instance:
- Supports cross-origin WebSocket handshakes.
- Prepared for agent lifecycle events:
  - `agent:status_changed`: Broadcasts agent transition between `ACTIVE`, `IDLE`, `BUSY`, and `OFFLINE`.
  - `office:zone_entered` / `office:zone_left`: Spatial movements across 3D departments.
  - `agent:ping` / `agent:pong`: Connection keep-alive heartbeat.
