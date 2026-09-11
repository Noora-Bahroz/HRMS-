# HRMS System Architecture — Overview

## Goals

Deliver a production-ready HRMS that is:

- **Scalable horizontally** — stateless services, message queues, object
  storage, cache, the system grows from hundreds to thousands+ of users
  without major architectural changes.
- **Microservices-oriented** — clear service boundaries, each service owns its
  data, no direct cross-service DB access.
- **Multi-company** — organizations, branches, departments, teams, cost centers.
- **Secure** — RBAC from day one, JWT auth, OWASP practices, audit logging.
- **Open-source first** — PostgreSQL, Redis, RabbitMQ, MinIO, Nginx,
  OpenTelemetry, Prometheus, Grafana.
- **API-first** — REST `/api/v1` with OpenAPI/Swagger.

## High-Level Architecture

```
                        ┌──────────────────────────────┐
                        │        HTTP Clients          │
                        │  Web App / Mobile / External │
                        └──────────────┬───────────────┘
                                       │ HTTPS
                        ┌──────────────▼───────────────┐
                        │        API Gateway           │
                        │   (auth, rate-limit, routing)│
                        └──────────────┬───────────────┘
                                       │
              ┌────────────┬───────────┴──────────┬────────────┐
              ▼            ▼                      ▼            ▼
        ┌──────────┐  ┌──────────┐          ┌──────────┐  ┌──────────┐
        │  Auth    │  │  User/   │   ...    │ Employee │  │   Org    │
        │  Service │  │  RBAC    │          │ Service  │  │ Service  │
        └────┬─────┘  └────┬─────┘          └────┬─────┘  └────┬─────┘
             │             │                     │             │
          ┌──▼─────────────▼──────────┐    ┌─────▼─────────────▼─────┐
          │  PostgreSQL (per-service  │    │ Redis (cache/sessions) │
          │  schema/data ownership)   │    └────────────────────────┘
          └───────────────────────────┘
```

Services communicate via synchronous HTTP (through the gateway) for
request/response and via **RabbitMQ** for asynchronous events (notifications,
emails, payroll, reports).

- **MinIO** provides object storage for files/documents (offers, contracts,
  candidate CVs, receipts, employee documents).
- **OpenTelemetry** collects traces; **Prometheus + Grafana** provide metrics
  and dashboards.

## Scaling Model

- Each service is **stateless** → can be replicated behind a load balancer.
- Long-running work (payroll, emails, reports, notifications) is enqueued to
  **background workers** and processed asynchronously.
- **Redis** provides caching, rate-limit stores, and distributed session/JWT
  revocation metadata.
- **Database** is the main state. On Postgres use connection pooling
  (PgBouncer in production) and proper indexing. Read replicas can be added
  for reporting.

## Tenancy

Multi-company from the start. Every tenant-scoped table carries a
`tenant_id` (Company ID) for row-level isolation. All queries filter by
`tenant_id`. JWT carries `tenantId` so services scope access automatically.

## Resilience

- Health checks for every service.
- Retries + exponential backoff on queue consumers.
- Idempotency keys on critical writes (payroll, expense approval).
- Graceful shutdown and structured logging (JSON).

## Security

- All services behind the gateway; internal service-to-service calls require
  a service token.
- JWT access tokens (short-lived) + refresh tokens (rotated, revocable).
- bcrypt password hashing; 2FA-ready (TOTP architecture reserved).
- Account lockout + rate limiting (Login, API).
- Audit logs for sensitive operations.
- Input validation (Zod) at every controller boundary.

## Key Documents

- [Service boundaries](services.md)
- [Database / ERD](../database/erd.md)
- [RBAC matrix](../rbac/permission-matrix.md)
- [API specification](../api/openapi.md)
- [Deployment](../deployment/setup.md)
