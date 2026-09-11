# Setup, Deployment & Environment

## Local Development

### Prerequisites
- Node.js 20+ (project uses v24)
- npm
- Docker + Docker Compose (for infra services)
- PostgreSQL (or use the Docker service)

### 1. Install dependencies

```bash
npm install
cd apps/server && npm install
cd ../web && npm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis minio rabbitmq
```

### 3. Configure environment

Copy env examples:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Default `.env` (development) values work out of the box with the Docker infra
(see `docker-compose.yml` credentials).

### 4. Migrate & seed

```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
```

Seed creates: super admin, a default company, default roles/permissions, and
sample employees.

### 5. Run

```bash
# Terminal 1 — API (port 4000)
cd apps/server && npm run dev

# Terminal 2 — Web (port 5173)
cd apps/web && npm run dev
```

## Full stack (Docker)

```bash
# Build and run everything (infra + api + web) behind nginx
docker compose --profile full up --build
```

- Web: http://localhost (nginx) or :5173 (dev)
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/v1/docs
- MinIO console: http://localhost:9001
- RabbitMQ mgmt: http://localhost:15672
- Grafana: http://localhost:3001 (with monitoring profile)

## Environment Variables

### Server (`apps/server/.env`)
| Variable            | Description                          |
| ------------------- | ------------------------------------ |
| DATABASE_URL        | Postgres connection string           |
| JWT_ACCESS_SECRET   | Access token signing secret          |
| JWT_REFRESH_SECRET  | Refresh token signing secret         |
| JWT_ACCESS_EXPIRES  | e.g. `15m`                           |
| JWT_REFRESH_EXPIRES | e.g. `7d`                            |
| REDIS_URL           | Redis URL (`redis://localhost:6379`) |
| MINIO_*             | MinIO endpoint, access key, secret   |
| RABBITMQ_URL        | AMQP URL                             |
| NODE_ENV            | development/production/test          |
| CORS_ORIGIN         | Allowed web origin(s)                |
| PORT                | API port (default 4000)              |

### Web (`apps/web/.env`)
| Variable        | Description              |
| --------------- | ------------------------ |
| VITE_API_URL    | API base URL             |

## Deployments (Dev / Staging / Prod)

Configuration split by environment via docker compose env files:

```
docker/
├── dev/
│   ├── server.env.example
│   ├── web.env.example
│   └── server.Dockerfile
├── staging/
├── prod/
├── nginx/nginx.conf
└── monitoring/
    ├── prometheus.yml
    └── grafana-datasource.yml
```

- **Dev:** hot-reload, local volumes, verbose logs.
- **Staging:** built images, full profile, test data.
- **Prod:** locked versions, secrets via env/secret manager, read replicas,
  PgBouncer pooling, TLS termination at nginx, replicas behind load balancer.

## CI/CD

A `.github/workflows/ci.yml` runs on push/PR:
1. Install deps
2. Lint + typecheck
3. Unit + integration + API tests (against a Postgres test instance)
4. Build images
5. (Tagged release) apply migrations, deploy

## Health Checks

- `GET /health` → `{ status: "ok" }` for liveness.
- `GET /health/readiness` → checks DB, Redis, MinIO connectivity.

## Monitoring & Logging

- JSON structured logs.
- Prometheus metrics endpoint (`/metrics`).
- Grafana dashboards.
- OpenTelemetry traces (tracer configured; sampling configurable).

## Backup & Recovery

- **Postgres:** daily `pg_dump` to object storage; point-in-time via WAL
  archiving (prod).
- **MinIO:** versioned buckets (retention policy).
- **Redis:** AOF persistence enabled (non-critical cache; can rebuild).
- Restore procedure documented per environment.

## Troubleshooting

| Issue                          | Fix                                            |
| ------------------------------ | ---------------------------------------------- |
| `ECONNREFUSED` to Postgres     | Ensure `docker compose up -d postgres` running |
| Prisma `Cannot find P2002`     | Run `npx prisma migrate dev`                   |
| 401 on API calls               | Token expired — call `/auth/refresh` or re-login|
| Rate limited (429)             | Wait, or raise limit in dev config             |
| Port already in use            | Change `POSTGRES_PORT`/`PORT` env              |
