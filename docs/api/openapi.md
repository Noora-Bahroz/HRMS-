# API Specification

REST over HTTPS at `/api/v1`. OpenAPI/Swagger is exposed at
`GET /api/v1/docs` when the server runs.

## Base URL

```
https://<host>/api/v1
```

## Authentication

- **Access token:** JWT, short-lived (e.g. 15 min), sent as
  `Authorization: Bearer <token>`.
- **Refresh token:** HttpOnly cookie or separate endpoint, rotated and
  revocable.
- **Login:** `POST /auth/login` → returns access token + refresh token.
- **Register (self-service):** `POST /auth/register` (optional, admin usually
  provisions users).

## Standard Response Envelope

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 132, "totalPages": 7 }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ { "field": "email", "message": "Invalid email" } ]
  }
}
```

## HTTP Status Codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 200  | OK                                        |
| 201  | Created                                   |
| 400  | Bad request / validation                  |
| 401  | Unauthenticated / invalid token           |
| 403  | Forbidden (authenticated but no perms)    |
| 404  | Not found                                 |
| 409  | Conflict (duplicate)                      |
| 422  | Unprocessable entity                      |
| 429  | Too many requests (rate limited)          |
| 500  | Internal server error                     |

## Pagination / Filter / Sort / Search

Query params supported on list endpoints:

```
/page, /limit, /sort(param:asc|desc), /search, /filter[key]=value, /status=
```

## Endpoint Matrix (initial/core)

### Auth & RBAC
| Method | Path                   | Description                     |
| ------ | ---------------------- | ------------------------------- |
| POST   | /auth/login            | Login                           |
| POST   | /auth/refresh          | Refresh access token            |
| POST   | /auth/logout           | Logout / revoke refresh token   |
| POST   | /auth/2fa/enable       | Enable TOTP (2FA-ready)         |
| POST   | /auth/2fa/verify       | Verify OTP at login             |
| GET    | /auth/me               | Current user + roles/permissions|
| GET    | /users                 | List users                      |
| POST   | /users                 | Create user                     |
| PATCH  | /users/:id             | Update user                     |
| GET    | /users/:id/roles       | User roles                      |
| POST   | /users/:id/roles       | Assign role                     |
| GET    | /roles                 | List roles                      |
| POST   | /roles                 | Create role (custom)            |
| GET    | /roles/:id/permissions | Role permissions                |

### Organization
| Method | Path                     | Description        |
| ------ | ------------------------ | ------------------ |
| GET    | /companies               | List companies     |
| POST   | /companies               | Create company     |
| GET    | /branches                | List branches      |
| POST   | /branches                | Create branch      |
| GET    | /departments             | List departments   |
| POST   | /departments             | Create department  |
| GET    | /teams                   | List teams         |
| POST   | /teams                   | Create team        |
| GET    | /designations            | List designations  |
| POST   | /designations            | Create designation |

### Employee
| Method | Path               | Description          |
| ------ | ------------------ | -------------------- |
| GET    | /employees         | List / search        |
| POST   | /employees         | Create employee      |
| GET    | /employees/:id     | Employee detail      |
| PATCH  | /employees/:id     | Update employee      |
| DELETE | /employees/:id     | Soft delete          |
| GET    | /employees/:id/documents | Documents     |
| POST   | /employees/:id/documents | Add document   |
| GET    | /directory         | Employee directory   |
| GET    | /departments/:id/employees | Dept roster  |

### Attendance
| Method | Path          | Description                |
| ------ | ------------- | -------------------------- |
| POST   | /attendance/check-in  | Check in          |
| POST   | /attendance/check-out | Check out         |
| GET    | /attendance   | My attendance              |
| GET    | /shifts       | List shifts                |
| POST   | /shifts       | Create shift               |
| GET    | /holidays     | List holidays              |

### Leave
| Method | Path                    | Description          |
| ------ | ----------------------- | -------------------- |
| GET    | /leave/types            | Leave types          |
| POST   | /leave/requests         | Request leave        |
| GET    | /leave/requests         | My requests          |
| PATCH  | /leave/requests/:id/approve | Approve          |
| PATCH  | /leave/requests/:id/reject  | Reject           |
| GET    | /leave/balances         | My balances          |
| POST   | /leave/policies         | Create policy        |

### Payroll
| Method | Path             | Description          |
| ------ | ---------------- | -------------------- |
| GET    | /payroll/structures   | Salary structures |
| POST   | /payroll/structures   | Create structure  |
| GET    | /payroll/periods      | Payroll periods   |
| POST   | /payroll/periods/:id/process | Process run |
| GET    | /payroll/payslips/:id | Payslip detail    |

(Similar matrices exist for recruitment, expense, asset, report — defined in
the Swagger spec and expanded during implementation.)

## Error Handling

- Central error middleware maps Zod/Prisma errors to standard envelopes.
- Prisma errors (`P2002` unique, `P2025` not found) translated to 409/404.
- Unhandled errors logged with trace IDs; client gets generic 500.

## Security

- Every route validates with Zod.
- Rate limiting via Redis on `/auth/*` and globally.
- CORS restricted to configured origins.
- CSRF-safe (JWT in header, refresh in HttpOnly cookie).
