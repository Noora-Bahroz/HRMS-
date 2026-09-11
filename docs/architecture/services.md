# Service Boundaries & Responsibilities

The system is decomposed into focused services. Each service owns its
database schema/data and exposes a REST API. Services communicate only via
APIs (through the gateway) or via asynchronous events on RabbitMQ — never by
directly touching another service's database.

## Service Map

| # | Service            | Responsibility                                        | Owns data (Postgres schema) |
|---|--------------------|-------------------------------------------------------|------------------------------|
| 1 | API Gateway        | Routing, rate limiting, auth enforcement, aggregation | none                         |
| 2 | Auth Service       | Login, JWT issuance/refresh, 2FA, lockout             | auth_* (refresh tokens, otp) |
| 3 | User / RBAC        | Users, roles, permissions, assignment                 | users, roles, permissions    |
| 4 | Organization       | Companies, branches, departments, teams, designations, hierarchy | org_*          |
| 5 | Employee           | Profiles, employment, documents, emergency contacts, skills | employee_*      |
| 6 | Attendance         | Check-in/out, shifts, schedules, holidays, overtime, reports | attendance_*    |
| 7 | Leave              | Leave types, policies, balances, requests, approvals, accrual | leave_*        |
| 8 | Payroll            | Salary structures, components, periods, payslips, tax | payroll_*                  |
| 9 | Recruitment/ATS    | Requisitions, postings, candidates, interviews, offers | ats_*                      |
| 10 | Expense            | Categories, submissions, approvals, reimbursement    | expense_*                  |
| 11 | Asset              | Assets, assignments, returns, condition, history     | asset_*                    |
| 12 | File/Document      | Object storage (MinIO), metadata, secure access      | file_*                     |
| 13 | Notification       | In-app + email notifications, templates, digest      | notification_*             |
| 14 | Reporting          | Aggregations, analytics, export (CSV/Excel/PDF)      | read from others via API    |

## Ownership Rules

- **Data ownership:** Each service is the single writer and owner of its
  schema. No cross-schema foreign keys (services reference each other by
  global ID/UUID, never by DB FK).
- **Cross-service reads:** done via service-to-service HTTP (service token),
  or by subscribing to domain events on RabbitMQ.
- **Identity:** User/Employee IDs are global UUIDs shared across services so
  references remain consistent without coupling.

## Event Flow (RabbitMQ examples)

- `employee.created` → org validates, notification sends welcome.
- `leave.request.submitted` → notification → approver workflow.
- `attendance.auto_clockout` → payroll worker accumulates hours.
- `payroll.processed` → file service generates payslips, notification emails.

## Monolith-first strategy (important for a solo build)

Building 14 independent deployables from day one is heavy for a solo
developer while the system is small. The repository therefore implements a
**modular monolith** where each service is a **separate, well-encapsulated
module** (folder) with its own router, controllers, services, and Prisma
models scoped by a `schema` prefix. This preserves clean service boundaries
and data ownership while keeping a single codebase/deployable.

Later, as load/team grows, each module can be extracted into a standalone
service with minimal change because:

- Services already communicate via events and APIs.
- Data is already namespaced per service.
- Auth/RBAC/audit are already centralized helpers.

This is a deliberate, pragmatic architecture decision. The "microservice
boundaries" defined above are honored in code; only the deployment topology
changes when scaling is required.
