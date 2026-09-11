# HRMS — Human Resource Management System

A **production-ready, scalable, multi-company HRMS** built with a modular,
microservices-oriented architecture. The UI follows the **Frappe/ERPNext**
style with a role-based, collapsible module sidebar (Employee, Recruitment,
Attendance, Leave, Payroll, Expense, Assets, etc.).

> This is a solo-development project. The full system is built first, then
> other developers will contribute afterward. Code should be clean, documented,
> and structured for a growing team.

## Tech Stack

| Layer       | Technology                                             |
| ----------- | ------------------------------------------------------ |
| Frontend    | React.js + TypeScript + Vite                           |
| Backend     | Node.js + Express.js + TypeScript                      |
| Database    | PostgreSQL                                             |
| ORM         | Prisma                                                 |
| Auth        | JWT + bcrypt (refresh tokens, 2FA-ready)               |
| Validation  | Zod                                                    |
| Styling     | Tailwind CSS                                           |
| Charts      | Recharts                                               |
| Container   | Docker / Docker Compose                                |
| Testing     | Jest + Supertest                                       |
| API Docs    | Swagger / OpenAPI                                      |
| Versioning  | Git / GitHub                                           |

## Monorepo Layout

```
hrms/
├── apps/
│   ├── server/          # Express API (all microservices)
│   └── web/             # React frontend
├── docker/              # Dockerfiles, compose files per environment
├── docs/
│   ├── architecture/    # System architecture, service boundaries
│   ├── database/        # ERD, migrations strategy
│   ├── rbac/            # Roles, permissions matrix
│   ├── api/             # API specification
│   └── deployment/      # Deploy, env, troubleshooting
├── docker-compose.yml   # Root compose (infra + apps)
├── Makefile
└── README.md
```

## Quick Start (Local)

See [docs/deployment/setup.md](docs/deployment/setup.md) for full details.

```bash
# 1. Install root deps and each app
npm install
cd apps/server && npm install
cd ../web && npm install

# 2. Run infrastructure (Postgres, Redis, MinIO, RabbitMQ)
docker compose up -d postgres redis minio rabbitmq

# 3. Run migrations & seed
cd apps/server
npx prisma migrate dev
npx prisma db seed

# 4. Start dev servers
npm run dev        # server (in apps/server)
npm run dev        # web (in apps/web)
```

## Documentation Index

- **Architecture:** [docs/architecture/overview.md](docs/architecture/overview.md)
- **Service boundaries:** [docs/architecture/services.md](docs/architecture/services.md)
- **Database ERD:** [docs/database/erd.md](docs/database/erd.md)
- **RBAC matrix:** [docs/rbac/permission-matrix.md](docs/rbac/permission-matrix.md)
- **API spec:** [docs/api/openapi.md](docs/api/openapi.md)
- **Project structure:** [docs/development/project-structure.md](docs/development/project-structure.md)
- **Roadmap:** [docs/development/roadmap.md](docs/development/roadmap.md)
- **Setup/deploy:** [docs/deployment/setup.md](docs/deployment/setup.md)

## Module Status

| Module            | Backend API | RBAC | Frontend | Tests | Docs |
| ----------------- | :---------: | :--: | :------: | :---: | :--: |
| Auth & RBAC       | ✅          | ✅   | ✅       | ✅    | ✅   |
| Organization      | ✅          | ✅   | ✅       | —     | ✅   |
| Employees         | ✅          | ✅   | ✅       | via integration | ✅ |
| Leave             | ✅          | ✅   | ✅       | —     | ✅   |
| Attendance        | ✅          | ✅   | ✅       | —     | ✅   |
| Payroll           | ✅          | ✅   | roadmap   | —     | ✅   |
| Expense           | ✅          | ✅   | roadmap   | —     | ✅   |
| Assets            | ✅          | ✅   | roadmap   | —     | ✅   |
| Recruitment / ATS | ✅          | ✅   | roadmap   | —     | ✅   |
| Notifications     | ✅          | ✅   | roadmap   | —     | ✅   |
| Reports           | ✅          | ✅   | roadmap   | —     | ✅   |

> Frontend is implemented for core modules (Dashboard, Employees, Leave,
> Attendance, Organization, Auth). Remaining module UIs are tracked under
> **Phase 4** in the roadmap.
