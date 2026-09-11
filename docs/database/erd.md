# Database Design & ERD

## Conventions

- **UUIDs** for all primary keys (`@default(uuid())`).
- **Tenancy:** most tables carry `tenant_id` (Company UUID) for row-level
  isolation. Queries always filter by the authenticated tenant.
- **Audit fields:** `created_at`, `updated_at`, `created_by`, `updated_by`.
  Aggregated via Prisma middleware/computed columns.
- **Soft deletion:** `deleted_at` nullable timestamp where appropriate.
- **Ownership:** each microservice owns a namespaced set of tables (Prisma
  models prefixed per service). No cross-service DB foreign keys.
- **Indexes:** on `tenant_id`, on foreign-key columns, and on columns used in
  filters/sorts/search (e.g. `status`, `name`, `email`).

## Entity-Relationship Overview

Below is the canonical ERD. `PK` = primary key, `FK` = references, `*` =
required, `?` = optional, `1..N` = one-to-many.

```
┌─────────────── Auth/RBAC ───────────────┐
│ User (PK, auth) 1..1 Employee           │
│   ├── tenant_id (Company)               │
│   ├── email, password_hash, 2fa_secret? │
│   ├── refresh_tokens 1..N               │
│   ├── login_history    1..N             │
│   ├── user_roles   1..N → Role (PK)     │
│   └── role_permissions 1..N → Permission│
└─────────────────────────────────────────┘

┌────────────── Organization ─────────────┐
│ Company (PK) 1..N Branch                │
│ Branch (PK) 1..N Department             │
│ Department (PK) 1..N Team               │
│ Team (PK) 1..N Designation              │
│ Designation (PK)                        │
│ CostCenter (PK)                         │
└─────────────────────────────────────────┘

┌────────────── Employee ─────────────────┐
│ Employee (PK, UUID, tenant)             │
│   ├── company FK, branch FK             │
│   ├── department FK, team FK,           │
│   ├── designation FK, reports_to FK(emp)│
│   ├── status (active/on_leave/exit)     │
│   ├── joining/exit dates, employment    │
│   ├── emergency_contacts 1..N           │
│   ├── documents 1..N                    │
│   ├── skills 1..N, qualifications 1..N  │
│   └── employment_history 1..N           │
└─────────────────────────────────────────┘

┌────────────── Attendance ───────────────┐
│ Shift (PK) 1..N WorkSchedule            │
│ WorkSchedule 1..N Attendance            │
│ Attendance (PK): emp, check_in/out      │
│   → breaks 1..N, overtime               │
│ Holiday (PK), LeaveType (PK)            │
└─────────────────────────────────────────┘

┌────────────── Leave ────────────────────┐
│ LeaveType (PK) 1..N LeavePolicy         │
│ LeavePolicy 0..N LeaveBalance / emp     │
│ LeaveRequest (PK): emp, type, dates     │
│   → approval flow, half-day flag        │
│ LeaveAccrualRule (PK)                   │
└─────────────────────────────────────────┘

┌────────────── Payroll ──────────────────┐
│ SalaryStructure (PK) 1..N SalaryComp    │
│   → emp assignment                      │
│ PayrollPeriod (PK) 1..N PayrollRun      │
│ PayrollRun 1..N Payslip                 │
│ TaxConfig/ TaxSlab (PK)                 │
└─────────────────────────────────────────┘

┌────────────── Recruitment / ATS ────────┐
│ JobRequisition (PK) 1..N JobPosting     │
│ JobPosting 1..N Application             │
│ Candidate (PK) 1..N Application         │
│ Application → status pipeline           │
│ Application 1..N Interview              │
│ Interview 1..N InterviewFeedback        │
│ Application 0..1 JobOffer 0..1 Employee │
└─────────────────────────────────────────┘

┌────────────── Expense / Asset / File ───┐
│ ExpenseCategory (PK) 1..N Expense       │
│ Expense: emp, receipts 1..N, approval   │
│ Asset (PK) 1..N AssetAssignment         │
│   → history, condition, return          │
│ File (PK): owner, bucket/key, kind,     │
│   expiry? secure access                 │
└─────────────────────────────────────────┘

┌────────────── Notification / Audit ─────┐
│ Notification (PK): user, channel,       │
│   template, read_at                     │
│ EmailNotification (PK)                  │
│ AuditLog (PK): actor, action, resource, │
│   payload, ip, timestamp                │
└─────────────────────────────────────────┘
```

## Prisma Model Naming (namespaced per service)

Using a **modular monolith**, all models live in one Prisma schema but are
grouped by service prefix to preserve ownership:

- Auth/RBAC: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`,
  `RefreshToken`, `LoginHistory`
- Org: `Company`, `Branch`, `Department`, `Team`, `Designation`, `CostCenter`
- Employee: `Employee`, `EmergencyContact`, `EmployeeDocument`, `EmployeeSkill`,
  `Qualification`, `EmploymentHistory`, `Certification`
- Attendance: `Shift`, `WorkSchedule`, `Attendance`, `AttendanceBreak`,
  `Holiday`, `Overtime`
- Leave: `LeaveType`, `LeavePolicy`, `LeaveBalance`, `LeaveRequest`,
  `LeaveApproval`, `LeaveAccrualRule`
- Payroll: `SalaryStructure`, `SalaryComponent`, `EmployeeSalaryAssignment`,
  `PayrollPeriod`, `PayrollRun`, `Payslip`, `TaxConfig`, `TaxSlab`
- ATS: `JobRequisition`, `JobPosting`, `Candidate`, `Application`,
  `Interview`, `InterviewFeedback`, `JobOffer`
- Expense: `ExpenseCategory`, `Expense`, `ExpenseReceipt`
- Asset: `Asset`, `AssetType`, `AssetAssignment`, `AssetHistory`
- File: `File`
- Notification: `Notification`, `NotificationTemplate`, `EmailNotification`
- Audit: `AuditLog`

## Migration Strategy

- Prisma Migrate is used; migrations are committed to the repo.
- `npm run prisma:migrate` in the server applies them.
- Production applies migrations via a dedicated CI step / migration container
  before rolling out new replicas.
- Seed script (`prisma/seed.ts`) creates super admin, default company, roles,
  and sample data for development.

## Indexing & Performance Notes

- Composite index on `(tenant_id, status)` for entity filtering.
- Index on all FK columns and on `email` (unique).
- Search uses `ILIKE` on indexed/trigram columns; add `pg_trgm` for fuzzy
  partial name search.
- Report queries are candidates for read replicas.

## Backup & Recovery

- Unavoidable via Docker volume snapshots + `pg_dump` cron.
- Documented in [deployment/backup.md](../deployment/setup.md).
