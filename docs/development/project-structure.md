# Repository / Project Structure

```
hrms/
├── .github/workflows/ci.yml       # CI: server tests + web build
├── apps/
│   ├── server/                    # Express API (TypeScript, Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Full data model (namespaced per service)
│   │   │   ├── migrations/        # Committed Prisma migrations
│   │   │   └── seed.ts            # Permissions, roles, super admin, sample data
│   │   ├── src/
│   │   │   ├── config/            # env config
│   │   │   ├── lib/               # prisma client, jwt, logger
│   │   │   ├── middleware/        # auth, rbac, rate-limit, audit, error
│   │   │   ├── modules/           # feature modules (see below)
│   │   │   ├── utils/             # http helpers, zod validation wrapper
│   │   │   ├── app.ts             # Express app assembly + swagger
│   │   │   └── server.ts          # entry point
│   │   ├── tests/                 # unit + integration tests
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   └── web/                       # React SPA (TypeScript, Vite, Tailwind)
│       └── src/
│           ├── api/client.ts      # axios + JWT refresh interceptor
│           ├── auth/              # AuthContext, guards (permission gating)
│           ├── components/
│           │   ├── layout/        # AppLayout, Sidebar (Frappe-style, role-based)
│           │   └── ui/            # Card, Badge, Pagination, Spinner, Placeholder
│           ├── pages/             # Dashboard, Employees, Leave, Attendance, Org, ...
│           ├── App.tsx            # routing + provider wiring
│           └── index.css          # tailwind + component classes
├── docker/
│   ├── dev/                       # server.Dockerfile, web.Dockerfile
│   ├── nginx/nginx.conf           # reverse proxy config
│   └── monitoring/                # prometheus.yml
├── docs/
│   ├── architecture/overview.md   # system architecture
│   ├── architecture/services.md   # service boundaries & ownership
│   ├── database/erd.md            # ERD + conventions
│   ├── rbac/permission-matrix.md  # role -> permission matrix
│   ├── api/openapi.md             # API spec, envelopes, codes
│   ├── deployment/setup.md        # setup, env, deploy, troubleshooting
│   └── development/               # roadmap, structure
├── docker-compose.yml             # infra + optional full stack
├── Makefile
├── package.json                   # workspaces root
└── README.md
```

## Server module layout (modular monolith)

Each module under `apps/server/src/modules/<name>/` follows the same pattern:

```
<name>/
├── <name>.validation.ts   # Zod schemas
├── <name>.service.ts      # business logic (data access via Prisma)
├── <name>.controller.ts   # HTTP controllers
└── <name>.routes.ts       # Router with RBAC + validation middleware
```

This layout keeps clean service boundaries in code while remaining a single
deployable. Modules can be extracted to standalone services later without
architecture change.