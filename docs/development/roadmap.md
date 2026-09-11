# Development Roadmap

This roadmap sequences the build so core foundations land before feature
depth. Each phase is complete when it ships **DB → API → Business logic →
RBAC → Frontend → Validation → Tests → Docs**.

## Phase 1 — Foundation (DONE)
- [x] Monorepo scaffold (apps/server, apps/web, docs, docker)
- [x] Architecture overview + service boundaries docs
- [x] Database ERD + Prisma schema (all models)
- [x] RBAC permission matrix doc
- [x] API spec doc
- [x] Docker Compose (postgres, redis, minio, rabbitmq, nginx, monitoring)
- [x] Express + TS + Prisma server, Vite + React + Tailwind web
- [x] Auth (JWT access/refresh, bcrypt, lockout, rate limit), RBAC middleware
- [x] Core modules: Organization, Employee, Leave, Attendance
- [x] Unit tests + API smoke tests (12 passing)
- [x] CI workflow, Makefile, README

## Phase 2 — Extended modules
- [x] Payroll (structures, periods, runs, payslips)
- [x] Expense (categories, submit, approve)
- [x] Assets (types, assets, assign/return)
- [x] Recruitment/ATS (requisitions, postings, candidates, applications, interviews, offers)
- [x] Notifications (in-app, broadcast announcements)
- [x] Reports (headcount, attendance/leave/payroll summaries, CSV export)

## Phase 3 — Hardening
- [ ] 2FA (TOTP) enable/verify flow (schema ready)
- [ ] Audit log read API + admin UI
- [ ] File/document upload via MinIO (schema ready; need S3 client)
- [ ] Email notifications + templates (schema ready)
- [ ] Async workers on RabbitMQ (payroll, emails, reports)
- [ ] Load/performance test (k6 or Artillery)

## Phase 4 — Frontend depth
- [ ] Recruitment pipeline UI
- [ ] Payroll runs UI + payslip view
- [ ] Expense approval UI
- [ ] Assets UI
- [ ] Reports UI with Recharts + CSV export buttons
- [ ] Notifications bell dropdown
- [ ] Mobile responsiveness polish + Frappe-like polish

## Phase 5 — Production
- [ ] Staging/production Docker profiles
- [ ] TLS + nginx gateway behind load balancer
- [ ] Centralized logging (ELK/Loki) + OpenTelemetry exporters
- [ ] Prometheus/Grafana dashboards wired
- [ ] Backup (pg_dump cron + MinIO versioning) runbook
- [ ] Security review (OWASP checklist)

## Guiding rules
- Never commit secrets (see `.env.example` only).
- Feature branches + PRs for major work.
- Every module: `Database → API → Logic → RBAC → UI → Validation → Tests → Docs`.
- Keep services decoupled: data stays namespaced so modules can be extracted
  into standalone services later.