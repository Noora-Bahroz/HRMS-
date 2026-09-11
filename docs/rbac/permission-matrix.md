# RBAC / Permission Matrix

Role-Based Access Control is implemented from day one. Permissions are
granular (create/read/update/delete per resource) and enforced both at the
API layer (Express middleware) and the UI (role-based module sidebar).

## Roles

| Role               | Scope   | Notes                                        |
| ------------------ | ------- | -------------------------------------------- |
| Super Admin        | System  | All tenants, config, user provisioning       |
| Company Admin      | Tenant  | All within one company, org settings         |
| HR Admin           | Tenant  | HR modules, employee master + security       |
| HR Manager         | Tenant  | HR operations, approvals                     |
| Department Manager | Dept    | Their department's employees, leave approval |
| Team Lead          | Team    | Their team, leave approval                   |
| Employee           | Self    | Portal, own leave/attendance/expense         |
| Recruiter          | Tenant  | Recruitment/ATS only                          |
| Payroll Manager    | Tenant  | Payroll only                                  |
| Custom Roles       | Tenant  | Admin-defined sets of permissions             |

## Permission Taxonomy

Permissions use `<resource>:<action>` strings, e.g. `employee:create`,
`leave:approve`, `payroll:process`. Actions: `create`, `read`, `update`,
`delete`, plus workflow verbs like `approve`, `process`, `export`, `manage`.

## Permission Matrix

| Permission                        | Super Admin | Comp Admin | HR Admin | HR Mgr | Dept Mgr | Team Lead | Employee | Recruiter | Payroll Mgr |
| --------------------------------- | :---------: | :--------: | :------: | :----: | :------: | :-------: | :------: | :-------: | :---------: |
| **Employee**                      |             |            |          |        |          |           |          |           |             |
| employee:create                   | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| employee:read                     | ✅          | ✅         | ✅       | ✅     | ✅ (dept)| ✅ (team) | ✅ (self)| —        | —           |
| employee:update                   | ✅          | ✅         | ✅       | ✅     | limited  | —         | limited | —         | —           |
| employee:delete                   | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | —           |
| employee:view_salary              | ✅          | ✅         | ✅       | ✅     | —        | —         | ✅ (self)| —        | ✅          |
| employee:manage_documents         | ✅          | ✅         | ✅       | ✅     | —        | —         | ✅       | —         | —           |
| **Organization**                  |             |            |          |        |          |           |          |           |             |
| org:manage                        | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | —           |
| department:manage                 | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | —           |
| **Leave**                         |             |            |          |        |          |           |          |           |             |
| leave:apply                       | ✅          | ✅         | ✅       | ✅     | ✅       | ✅        | ✅       | ✅        | —           |
| leave:approve                     | ✅          | ✅         | ✅       | ✅     | ✅ (dept)| ✅ (team) | —        | —         | —           |
| leave:manage_policy               | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| leave:read_all                    | ✅          | ✅         | ✅       | ✅     | ✅ (dept)| ✅ (team) | —        | —         | —           |
| **Attendance**                    |             |            |          |        |          |           |          |           |             |
| attendance:check_in               | ✅          | ✅         | ✅       | ✅     | ✅       | ✅        | ✅       | ✅        | —           |
| attendance:manage_shift           | ✅          | ✅         | ✅       | ✅     | ✅       | ✅        | —        | —         | —           |
| attendance:read_all               | ✅          | ✅         | ✅       | ✅     | ✅ (dept)| ✅ (team) | —        | —         | —           |
| **Payroll**                       |             |            |          |        |          |           |          |           |             |
| payroll:manage_structure          | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | ✅          |
| payroll:process                   | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | ✅          |
| payroll:view                       | ✅          | ✅         | ✅       | ✅     | —        | —         | ✅ (self)| —        | ✅          |
| payroll:read_all                  | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | ✅          |
| **Recruitment / ATS**             |             |            |          |        |          |           |          |           |             |
| ats:manage_requisition            | ✅          | ✅         | ✅       | ✅     | ✅       | —         | —        | ✅        | —           |
| ats:manage_candidate              | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | ✅        | —           |
| ats:interview                      | ✅          | ✅         | ✅       | ✅     | ✅       | ✅        | —        | ✅        | —           |
| ats:offer                          | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | ✅        | —           |
| ats:convert_employee              | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| **Expense**                       |             |            |          |        |          |           |          |           |             |
| expense:submit                    | ✅          | ✅         | ✅       | ✅     | ✅       | ✅        | ✅       | ✅        | ✅          |
| expense:approve                   | ✅          | ✅         | ✅       | ✅     | ✅       | (team)    | —        | —         | —           |
| expense:read_all                  | ✅          | ✅         | ✅       | ✅     | (dept)   | (team)    | —        | —         | —           |
| **Asset**                         |             |            |          |        |          |           |          |           |             |
| asset:manage                      | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| asset:assign                      | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| **Reports**                       |             |            |          |        |          |           |          |           |             |
| report:employee                   | ✅          | ✅         | ✅       | ✅     | (dept)   | (team)    | —        | —         | —           |
| report:payroll                    | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | ✅          |
| report:attendance                 | ✅          | ✅         | ✅       | ✅     | (dept)   | (team)    | —        | —         | —           |
| report:headcount                  | ✅          | ✅         | ✅       | ✅     | —        | —         | —        | —         | —           |
| **Admin / System**                |             |            |          |        |          |           |          |           |             |
| user:manage                       | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | —           |
| role:manage                       | ✅          | —         | —        | —      | —        | —         | —        | —         | —           |
| settings:manage                   | ✅          | ✅         | ✅       | —      | —        | —         | —        | —         | —           |
| audit:read                        | ✅          | ✅         | —        | —      | —        | —         | —        | —         | —           |

> Legend: ✅ = full access at the role's scope. "(dept)"/"(team)" = scoped to
> the manager's department/team. "limited" = update only allowed fields.
> "—" = no access.

## Implementation

- Permissions are stored in DB and checked by a central middleware using the
  JWT's `userId` + `tenantId`.
- The frontend fetches `/auth/me` which returns the user's role/permissions;
  the sidebar and routes are filtered accordingly.
- Sensitive operations also write to the audit log.
