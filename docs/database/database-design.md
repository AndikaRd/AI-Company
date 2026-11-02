# Database Architecture & Entity-Relationship Design

The **Virtual AI Company (VAC)** database is built on **PostgreSQL** and managed using **Prisma ORM**.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    COMPANIES ||--o{ DEPARTMENTS : "contains"
    DEPARTMENTS ||--o{ EMPLOYEES : "employs"
    EMPLOYEES ||--o| AGENT_CONFIGURATIONS : "configured by"

    COMPANIES {
        uuid id PK
        string name
        string slug UK
        string description
        string industry
        string website
        enum status
        datetime createdAt
        datetime updatedAt
    }

    DEPARTMENTS {
        uuid id PK
        string name
        string slug
        string description
        string floor_zone
        string color
        uuid company_id FK
        datetime createdAt
        datetime updatedAt
    }

    EMPLOYEES {
        uuid id PK
        string first_name
        string last_name
        string role
        string email UK
        string avatar_url
        boolean is_ai_agent
        enum status
        uuid department_id FK
        datetime createdAt
        datetime updatedAt
    }

    AGENT_CONFIGURATIONS {
        uuid id PK
        uuid employee_id FK,UK
        string model_name
        text system_prompt
        float temperature
        int max_tokens
        json tools_enabled
        enum memory_retention
        datetime createdAt
        datetime updatedAt
    }
```

---

## Database Schema Models

### 1. `Company` (Table: `companies`)
Represents an enterprise organization.
- `id` (UUID, Primary Key, auto-generated)
- `name` (String): Corporate entity name.
- `slug` (String, Unique): URL/Routing slug (e.g., `nexus-ai-dynamics`).
- `description` (String, Optional): Corporate mission overview.
- `industry` (String, Optional): Industry categorization.
- `website` (String, Optional): External URL.
- `status` (Enum: `ACTIVE`, `SUSPENDED`, `ARCHIVED`): Default `ACTIVE`.
- `createdAt` / `updatedAt`: Timestamps.

### 2. `Department` (Table: `departments`)
Represents a functional department / office zone within a company.
- `id` (UUID, Primary Key)
- `name` (String): Department name.
- `slug` (String): Department slug within company scope.
- `description` (String, Optional): Operational responsibility.
- `floorZone` (String, Optional): 3D spatial zone code (e.g., `ZONE_TECH`, `ZONE_ENG`).
- `color` (String, Optional): Hex color accent for UI badges and 3D floor markers (e.g. `#3b82f6`).
- `companyId` (UUID, Foreign Key -> `companies.id`, with `ON DELETE CASCADE`).
- **Constraints**:
  - `@@unique([companyId, slug])`: Slugs are unique per company.
  - `@@index([companyId])`: Fast relational lookups.

### 3. `Employee` (Table: `employees`)
Represents a human or AI synthetic agent employed by a department.
- `id` (UUID, Primary Key)
- `firstName` / `lastName` (String): Personnel identification.
- `role` (String): Assigned corporate role / job title.
- `email` (String, Unique): Work email address.
- `avatarUrl` (String, Optional): Avatar asset or GLB skin reference.
- `isAiAgent` (Boolean): Defaults to `true`.
- `status` (Enum: `ACTIVE`, `IDLE`, `BUSY`, `OFFLINE`): Defaults to `ACTIVE`.
- `departmentId` (UUID, Foreign Key -> `departments.id`, with `ON DELETE CASCADE`).
- **Constraints**:
  - `@@index([departmentId])`
  - `@@index([status])`

### 4. `AgentConfiguration` (Table: `agent_configurations`)
Optional 1-to-1 extension configuring LLM parameters for synthetic AI employees.
- `id` (UUID, Primary Key)
- `employeeId` (UUID, Unique Foreign Key -> `employees.id`, with `ON DELETE CASCADE`).
- `modelName` (String): LLM model identifier (default: `gpt-4o`).
- `systemPrompt` (Text, Optional): Agent behavioral prompt / system instructions.
- `temperature` (Float): Inference sampling temperature (default: `0.7`).
- `maxTokens` (Int): Context response limit (default: `2048`).
- `toolsEnabled` (JSON, Optional): List or object defining allowed tools/APIs.
- `memoryRetention` (Enum: `SESSION`, `LONG_TERM`): Memory scope.

---

## Seed Data Specification

The database seed (`apps/api/prisma/seed.ts`) idempotently registers:
1. **Company**: `Nexus AI Dynamics` (`nexus-ai-dynamics`).
2. **Departments (8)**:
   - Technology (`ZONE_TECH`, `#3b82f6`)
   - Engineering (`ZONE_ENG`, `#10b981`)
   - Research (`ZONE_RESEARCH`, `#8b5cf6`)
   - Business Analysis (`ZONE_BA`, `#f59e0b`)
   - Creative (`ZONE_CREATIVE`, `#ec4899`)
   - Operations (`ZONE_OPS`, `#06b6d4`)
   - Quality Assurance (`ZONE_QA`, `#ef4444`)
   - Administration (`ZONE_ADMIN`, `#6366f1`)
3. **Employees**: 0 seeded records (Zero fake executions or mock activity per Sprint 1 engineering requirements).

