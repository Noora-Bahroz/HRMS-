import { PrismaClient, PayrollPeriod, SalaryComponent, SalaryStructure } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS: { code: string; module: string; description: string }[] = [
  // Employee
  { code: "employee:create", module: "employee", description: "Create employees" },
  { code: "employee:read", module: "employee", description: "Read employees" },
  { code: "employee:update", module: "employee", description: "Update employees" },
  { code: "employee:delete", module: "employee", description: "Delete employees" },
  { code: "employee:view_salary", module: "employee", description: "View salary info" },
  { code: "employee:manage_documents", module: "employee", description: "Manage employee documents" },
  // Organization
  { code: "org:manage", module: "organization", description: "Manage organization" },
  { code: "department:manage", module: "organization", description: "Manage departments" },
  // Leave
  { code: "leave:apply", module: "leave", description: "Apply for leave" },
  { code: "leave:approve", module: "leave", description: "Approve leave" },
  { code: "leave:manage_policy", module: "leave", description: "Manage leave policies" },
  { code: "leave:read_all", module: "leave", description: "Read all leave" },
  // Attendance
  { code: "attendance:check_in", module: "attendance", description: "Check in/out" },
  { code: "attendance:manage_shift", module: "attendance", description: "Manage shifts" },
  { code: "attendance:read_all", module: "attendance", description: "Read all attendance" },
  // Payroll
  { code: "payroll:manage_structure", module: "payroll", description: "Manage salary structures" },
  { code: "payroll:process", module: "payroll", description: "Process payroll" },
  { code: "payroll:approve", module: "payroll", description: "Approve payroll runs" },
  { code: "payroll:view", module: "payroll", description: "View own payslip" },
  { code: "payroll:read_all", module: "payroll", description: "Read all payroll" },
  // Recruitment
  { code: "ats:manage_requisition", module: "ats", description: "Manage job requisitions" },
  { code: "ats:manage_candidate", module: "ats", description: "Manage candidates" },
  { code: "ats:interview", module: "ats", description: "Conduct interviews" },
  { code: "ats:offer", module: "ats", description: "Manage offers" },
  { code: "ats:convert_employee", module: "ats", description: "Convert candidate to employee" },
  // Expense
  { code: "expense:submit", module: "expense", description: "Submit expenses" },
  { code: "expense:approve", module: "expense", description: "Approve expenses" },
  { code: "expense:read_all", module: "expense", description: "Read all expenses" },
  // Asset
  { code: "asset:manage", module: "asset", description: "Manage assets" },
  { code: "asset:assign", module: "asset", description: "Assign assets" },
  // Reports
  { code: "report:employee", module: "report", description: "Employee reports" },
  { code: "report:payroll", module: "report", description: "Payroll reports" },
  { code: "report:attendance", module: "report", description: "Attendance reports" },
  { code: "report:headcount", module: "report", description: "Headcount analytics" },
  // Admin
  { code: "user:manage", module: "admin", description: "Manage users" },
  { code: "role:manage", module: "admin", description: "Manage roles" },
  { code: "settings:manage", module: "admin", description: "Manage settings" },
  { code: "settings:system", module: "admin", description: "Manage system and company settings" },
  { code: "audit:read", module: "admin", description: "Read audit logs" },
];

const SYSTEM_ROLES: Record<string, string[]> = {
  "super_admin": ["*"],
  "company_admin": [
    "employee:create", "employee:read", "employee:update", "employee:delete",
    "employee:view_salary", "employee:manage_documents", "org:manage",
    "department:manage", "leave:apply", "leave:approve", "leave:manage_policy",
    "leave:read_all", "attendance:check_in", "attendance:manage_shift",
    "attendance:read_all", "ats:manage_requisition",
    "ats:manage_candidate", "ats:interview", "ats:offer", "ats:convert_employee",
    "expense:submit", "expense:approve", "expense:read_all", "asset:manage",
    "asset:assign", "report:employee", "report:attendance", "report:headcount",
    "settings:manage", "settings:system",
  ],
  "hr_admin": [
    "employee:create", "employee:read", "employee:update", "employee:delete",
    "employee:view_salary", "employee:manage_documents", "org:manage",
    "department:manage", "leave:apply", "leave:approve", "leave:manage_policy",
    "leave:read_all", "attendance:check_in", "attendance:manage_shift",
    "attendance:read_all", "ats:manage_requisition",
    "ats:manage_candidate", "ats:interview", "ats:offer", "ats:convert_employee",
    "expense:submit", "expense:approve", "expense:read_all", "asset:manage",
    "asset:assign", "report:employee", "report:attendance", "report:headcount",
    "settings:manage",
  ],
  "hr_manager": [
    "employee:create", "employee:read", "employee:update", "employee:view_salary",
    "employee:manage_documents", "leave:apply", "leave:approve",
    "leave:manage_policy", "leave:read_all", "attendance:check_in",
    "attendance:manage_shift", "attendance:read_all",
    "ats:manage_requisition", "ats:manage_candidate", "ats:interview",
    "expense:submit", "expense:approve", "expense:read_all",
    "asset:manage", "asset:assign",
    "report:employee", "report:attendance", "report:headcount",
  ],
  "department_manager": [
    "employee:read", "employee:manage_documents",
    "leave:apply", "leave:approve", "leave:read_all",
    "attendance:check_in", "attendance:read_all",
    "report:employee", "report:attendance",
  ],
  "team_lead": [
    "employee:read", "leave:apply", "leave:approve", "leave:read_all",
    "attendance:check_in", "attendance:read_all",
    "report:employee", "report:attendance",
  ],
  "employee": [
    "employee:read", "leave:apply", "attendance:check_in",
    "payroll:view", "expense:submit",
  ],
  "recruiter": [
    "ats:manage_requisition", "ats:manage_candidate", "ats:interview",
    "ats:offer", "ats:convert_employee",
    "leave:apply", "attendance:check_in", "employee:read",
  ],
  "payroll_manager": [
    "payroll:manage_structure", "payroll:process", "payroll:approve",
    "payroll:view", "payroll:read_all", "employee:view_salary", "report:payroll",
    "employee:read", "expense:read_all",
  ],
};

// Data-access scope per system role: all | dept | team | self
const SYSTEM_ROLE_META: Record<
  string,
  { scope: string; description: string }
> = {
  super_admin: { scope: "all", description: "Full access across all tenants" },
  company_admin: { scope: "all", description: "Full access within one company" },
  hr_admin: { scope: "all", description: "HR modules, employee master + documents, recruitment, attendance, leave" },
  hr_manager: { scope: "all", description: "HR operations, approvals, recruitment, no org/system/payroll" },
  department_manager: { scope: "dept", description: "Own department employees, leave approval" },
  team_lead: { scope: "team", description: "Own team members, attendance, leave approval; no org/payroll/recruitment/admin" },
  employee: { scope: "self", description: "Portal; own leave/attendance/expense" },
  recruiter: { scope: "all", description: "Recruitment / ATS only" },
  payroll_manager: { scope: "all", description: "Payroll only" },
};

// Demo users for testing role-based access. Each is linked to an employee
// record so self/dept/team scope enforcement can be verified.
const DEMO_PASSWORD = "Hr@12345";
const DEMO_USERS: {
  email: string;
  fullName: string;
  role: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeEmail: string;
    department: string;
    team: string;
  };
}[] = [
  {
    email: "hr_admin@hrms.local",
    fullName: "Hr Admin",
    role: "hr_admin",
    employee: { firstName: "Harper", lastName: "Vance", employeeEmail: "harper@hrms.local", department: "Human Resources", team: "People Ops" },
  },
  {
    email: "hr_manager@hrms.local",
    fullName: "Hr Manager",
    role: "hr_manager",
    employee: { firstName: "Mina", lastName: "Okafor", employeeEmail: "mina@hrms.local", department: "Human Resources", team: "People Ops" },
  },
  {
    email: "dept_manager@hrms.local",
    fullName: "Dept Manager",
    role: "department_manager",
    employee: { firstName: "Daniel", lastName: "Ross", employeeEmail: "daniel@hrms.local", department: "Engineering", team: "Backend" },
  },
  {
    email: "team_lead@hrms.local",
    fullName: "Team Lead",
    role: "team_lead",
    employee: { firstName: "Lena", lastName: "Cruz", employeeEmail: "lena@hrms.local", department: "Engineering", team: "Frontend" },
  },
  {
    email: "employee@hrms.local",
    fullName: "Employee",
    role: "employee",
    employee: { firstName: "Sam", lastName: "Lee", employeeEmail: "sam@hrms.local", department: "Engineering", team: "Frontend" },
  },
  {
    email: "company_admin@hrms.local",
    fullName: "Company Admin",
    role: "company_admin",
    employee: { firstName: "Alex", lastName: "Avery", employeeEmail: "alex@hrms.local", department: "Human Resources", team: "People Ops" },
  },
  {
    email: "recruiter@hrms.local",
    fullName: "Recruiter",
    role: "recruiter",
    employee: { firstName: "Riley", lastName: "Grant", employeeEmail: "riley@hrms.local", department: "Human Resources", team: "People Ops" },
  },
  {
    email: "payroll_manager@hrms.local",
    fullName: "Payroll Manager",
    role: "payroll_manager",
    employee: { firstName: "Peyton", lastName: "Reed", employeeEmail: "peyton@hrms.local", department: "Human Resources", team: "People Ops" },
  },
];

async function main() {
  console.log("Seeding HRMS database...");

  // Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  const permissionByCode = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.findUnique({ where: { code: p.code } });
    if (row) permissionByCode.set(p.code, row.id);
  }

  // System roles (tenantId "system" for shared roles)
  for (const [name, codes] of Object.entries(SYSTEM_ROLES)) {
    const meta = SYSTEM_ROLE_META[name] ?? { scope: "all", description: name };
    let role = await prisma.role.findFirst({
      where: { name, tenantId: "system" },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { name, tenantId: "system", isSystem: true, scope: meta.scope, description: meta.description },
      });
    } else {
      role = await prisma.role.update({
        where: { id: role.id },
        data: { scope: meta.scope, description: meta.description },
      });
    }
    // Wildcard for super_admin granted via isSuperAdmin flag instead.
    if (name === "super_admin") continue;

    const rolePermissions = (codes as string[])
      .filter((c) => permissionByCode.has(c))
      .map((c) => ({ roleId: role!.id, permissionId: permissionByCode.get(c)! }));

    // Reconcile: revoke permissions no longer declared for the role, then
    // grant any newly declared ones. Keeps the DB in sync with SYSTEM_ROLES.
    const desiredIds = new Set(rolePermissions.map((rp) => rp.permissionId));
    const currentRps = await prisma.rolePermission.findMany({
      where: { roleId: role!.id },
      select: { permissionId: true },
    });
    const currentIds = new Set(currentRps.map((rp) => rp.permissionId));
    await prisma.rolePermission.deleteMany({
      where: { roleId: role!.id, permissionId: { notIn: Array.from(desiredIds) } },
    });
    for (const rp of rolePermissions) {
      if (!currentIds.has(rp.permissionId)) await prisma.rolePermission.create({ data: rp });
    }
  }

  // Default company
  let company = await prisma.company.findFirst({ where: { name: "Acme Corp" } });
  if (!company) {
    company = await prisma.company.create({ data: { name: "Acme Corp" } });
  }

  // Super admin user
  const superAdminEmail = "admin@hrms.local";
  let admin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        tenantId: company.id,
        email: superAdminEmail,
        passwordHash: await bcrypt.hash("Admin@123", 12),
        fullName: "Super Admin",
        isSuperAdmin: true,
      },
    });
  }
  // Assign super_admin role
  const superRole = await prisma.role.findFirstOrThrow({
    where: { name: "super_admin", tenantId: "system" },
  });
  const existingAdminUR = await prisma.userRole.findFirst({
    where: { userId: admin.id, roleId: superRole.id },
  });
  if (!existingAdminUR) {
    await prisma.userRole.create({ data: { userId: admin.id, roleId: superRole.id } });
  }

  // Demo users (roles other than super_admin) linked to employee records
  const departments = await prisma.department.findMany();
  const deptByName = new Map(departments.map((d) => [d.name, d.id]));

  for (const du of DEMO_USERS) {
    const flowerEmail = du.email;

    // Ensure department + team exist
    const deptId = deptByName.get(du.employee.department);
    if (!deptId) throw new Error(`Missing department: ${du.employee.department}`);
    let team = await prisma.team.findFirst({
      where: { name: du.employee.team, departmentId: deptId },
    });
    if (!team) {
      team = await prisma.team.create({
        data: { name: du.employee.team, departmentId: deptId },
      });
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email: flowerEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: company.id,
          email: flowerEmail,
          passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
          fullName: du.fullName,
        },
      });
    }

    // Assign role
    const role = await prisma.role.findFirstOrThrow({
      where: { name: du.role, tenantId: "system" },
    });
    const ur = await prisma.userRole.findFirst({ where: { userId: user.id, roleId: role.id } });
    if (!ur) await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

    // Link employee (create if missing, else attach userId)
    const empEmail = du.employee.employeeEmail;
    let employee = await prisma.employee.findFirst({ where: { tenantId: company.id, email: empEmail } });
    if (!employee) {
      const count = await prisma.employee.count({ where: { tenantId: company.id } });
      employee = await prisma.employee.create({
        data: {
          tenantId: company.id,
          companyId: company.id,
          employeeNumber: `EMP-${String(count + 1).padStart(4, "0")}`,
          userId: user.id,
          firstName: du.employee.firstName,
          lastName: du.employee.lastName,
          email: empEmail,
          departmentId: deptId,
          teamId: team.id,
          employmentStatus: "active",
        },
      });
    } else {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: { userId: user.id, departmentId: deptId, teamId: team.id },
      });
    }
  }

  // ============================================================
  // Demo operating data (attendance, leave, expenses, assets, ATS)
  // so the Super Admin system dashboard shows live numbers.
  // All guarded by existence checks -> idempotent.
  // ============================================================
  const employees = await prisma.employee.findMany({ where: { tenantId: company.id } });
  const empByEmail = new Map(employees.map((e) => [e.email, e]));
  const harper = empByEmail.get("harper@hrms.local");
  const mina = empByEmail.get("mina@hrms.local");
  const daniel = empByEmail.get("daniel@hrms.local");
  const lena = empByEmail.get("lena@hrms.local");
  const sam = empByEmail.get("sam@hrms.local");
  const alex = empByEmail.get("alex@hrms.local");

  // Leave type
  let annualLeave = await prisma.leaveType.findFirst({ where: { tenantId: company.id, code: "ANNUAL" } });
  if (!annualLeave) {
    annualLeave = await prisma.leaveType.create({
      data: { tenantId: company.id, name: "Annual Leave", code: "ANNUAL", paid: true, maxPerYear: 20 },
    });
  }

  // Today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendanceSeed: { emp: (typeof harper); status: string; checkIn: string }[] = [
    { emp: harper, status: "present", checkIn: "09:02" },
    { emp: mina, status: "present", checkIn: "08:55" },
    { emp: daniel, status: "present", checkIn: "09:10" },
    { emp: lena, status: "late", checkIn: "09:47" },
    { emp: sam, status: "present", checkIn: "08:50" },
    { emp: alex, status: "present", checkIn: "09:00" },
  ];
  for (const { emp, status, checkIn } of attendanceSeed) {
    if (!emp) continue;
    const exists = await prisma.attendance.findUnique({
      where: { tenantId_employeeId_date: { tenantId: company.id, employeeId: emp.id, date: today } },
    });
    if (exists) continue;
    const [h, m] = checkIn.split(":").map(Number);
    const checkInAt = new Date(today);
    checkInAt.setHours(h, m, 0, 0);
    await prisma.attendance.create({
      data: { tenantId: company.id, employeeId: emp.id, date: today, checkInAt, status, totalHours: 8 },
    });
  }

  // Leave requests
  if (sam && annualLeave) {
    const exists = await prisma.leaveRequest.findFirst({ where: { tenantId: company.id, employeeId: sam.id } });
    if (!exists) {
      await prisma.leaveRequest.create({
        data: {
          tenantId: company.id,
          employeeId: sam.id,
          leaveTypeId: annualLeave.id,
          startDate: new Date(today.getTime() + 7 * 86400000),
          endDate: new Date(today.getTime() + 9 * 86400000),
          days: 3,
          reason: "Family trip (seeded)",
          status: "pending",
        },
      });
    }
  }
  if (lena && annualLeave) {
    const exists = await prisma.leaveRequest.findFirst({ where: { tenantId: company.id, employeeId: lena.id } });
    if (!exists) {
      await prisma.leaveRequest.create({
        data: {
          tenantId: company.id,
          employeeId: lena.id,
          leaveTypeId: annualLeave.id,
          startDate: new Date(today.getTime() + 14 * 86400000),
          endDate: new Date(today.getTime() + 15 * 86400000),
          days: 2,
          reason: "Personal (seeded)",
          status: "approved",
        },
      });
    }
  }

  // Expense category + claims
  let travelCat = await prisma.expenseCategory.findFirst({ where: { tenantId: company.id, name: "Travel" } });
  if (!travelCat) {
    travelCat = await prisma.expenseCategory.create({ data: { tenantId: company.id, name: "Travel" } });
  }
  if (alex && travelCat) {
    const exists = await prisma.expense.findFirst({ where: { tenantId: company.id, employeeId: alex.id } });
    if (!exists) {
      await prisma.expense.create({
        data: {
          tenantId: company.id,
          employeeId: alex.id,
          categoryId: travelCat.id,
          amount: 185.5,
          date: new Date(),
          description: "Client visit cab + lunch",
          status: "submitted",
        },
      });
    }
  }
  if (harper && travelCat) {
    const exists = await prisma.expense.findFirst({ where: { tenantId: company.id, employeeId: harper.id } });
    if (!exists) {
      await prisma.expense.create({
        data: {
          tenantId: company.id,
          employeeId: harper.id,
          categoryId: travelCat.id,
          amount: 420,
          date: new Date(),
          description: "HR conference ticket",
          status: "approved",
        },
      });
    }
  }

  // Asset type + assets
  let laptopType = await prisma.assetType.findFirst({ where: { tenantId: company.id, name: "Laptop" } });
  if (!laptopType) {
    laptopType = await prisma.assetType.create({ data: { tenantId: company.id, name: "Laptop" } });
  }
  if (laptopType) {
    for (const t of ["MBP-001", "MBP-002"]) {
      const exists = await prisma.asset.findFirst({ where: { tenantId: company.id, tag: t } });
      if (!exists) {
        await prisma.asset.create({
          data: {
            tenantId: company.id,
            assetTypeId: laptopType.id,
            tag: t,
            name: "MacBook Pro 14",
            serialNo: `SEED-${t}`,
            condition: "good",
            status: "available",
          },
        });
      }
    }
  }

  // ATS: richer demo data — requisitions, postings, candidates, applications, interviews, offers
  const engineeringDept = daniel?.departmentId;
  const hrDept = harper?.departmentId;

  // Requisitions
  let backendReq = await prisma.jobRequisition.findFirst({ where: { tenantId: company.id, title: "Senior Backend Engineer" } });
  if (!backendReq) {
    backendReq = await prisma.jobRequisition.create({
      data: { tenantId: company.id, title: "Senior Backend Engineer", departmentId: engineeringDept, openings: 2, status: "open", description: "Own backend services and API design." },
    });
  }
  let frontendReq = await prisma.jobRequisition.findFirst({ where: { tenantId: company.id, title: "Frontend Developer" } });
  if (!frontendReq) {
    frontendReq = await prisma.jobRequisition.create({
      data: { tenantId: company.id, title: "Frontend Developer", departmentId: engineeringDept, openings: 1, status: "open", description: "Build modern React UIs." },
    });
  }
  let hrReq = await prisma.jobRequisition.findFirst({ where: { tenantId: company.id, title: "HR Coordinator" } });
  if (!hrReq) {
    hrReq = await prisma.jobRequisition.create({
      data: { tenantId: company.id, title: "HR Coordinator", departmentId: hrDept, openings: 1, status: "draft", description: "Support daily HR operations." },
    });
  }

  // Postings
  let backendPost = await prisma.jobPosting.findFirst({ where: { title: "Senior Backend Engineer - Remote" } });
  if (!backendPost && backendReq) {
    backendPost = await prisma.jobPosting.create({
      data: { requisitionId: backendReq.id, title: "Senior Backend Engineer - Remote", location: "Remote" },
    });
  }
  let frontendPost = await prisma.jobPosting.findFirst({ where: { title: "Frontend Developer - Hybrid" } });
  if (!frontendPost && frontendReq) {
    frontendPost = await prisma.jobPosting.create({
      data: { requisitionId: frontendReq.id, title: "Frontend Developer - Hybrid", location: "New York" },
    });
  }

  // Candidates
  const candData = [
    { firstName: "Jordan", lastName: "Blake", email: "jordan@example.com", phone: "+1-555-0100" },
    { firstName: "Casey", lastName: "Morgan", email: "casey.morgan@example.com", phone: "+1-555-0200" },
    { firstName: "Taylor", lastName: "Reed", email: "taylor.reed@example.com", phone: "+1-555-0300" },
    { firstName: "Avery", lastName: "Chen", email: "avery.chen@example.com", phone: "+1-555-0400" },
    { firstName: "Riley", lastName: "Patel", email: "riley.patel@example.com", phone: "+1-555-0500" },
    { firstName: "Quinn", lastName: "Nguyen", email: "quinn.nguyen@example.com", phone: "+1-555-0600" },
  ];
  const candidates = [];
  for (const cd of candData) {
    let c = await prisma.candidate.findFirst({ where: { tenantId: company.id, email: cd.email } });
    if (!c) c = await prisma.candidate.create({ data: { tenantId: company.id, ...cd } });
    candidates.push(c);
  }

  // Applications with varied stages
  const appDefs = [
    { candidateIdx: 0, postingRef: "backend", status: "interview", stage: 3 },
    { candidateIdx: 1, postingRef: "backend", status: "screening", stage: 2 },
    { candidateIdx: 2, postingRef: "backend", status: "offer", stage: 5 },
    { candidateIdx: 3, postingRef: "frontend", status: "applied", stage: 1 },
    { candidateIdx: 4, postingRef: "frontend", status: "interview", stage: 4 },
    { candidateIdx: 5, postingRef: "backend", status: "rejected", stage: 2 },
  ];
  const applications = [];
  for (const ad of appDefs) {
    const postingId = ad.postingRef === "backend" ? backendPost?.id : frontendPost?.id;
    if (!postingId) continue;
    let app = await prisma.application.findFirst({
      where: { jobPostingId: postingId, candidateId: candidates[ad.candidateIdx].id },
    });
    if (!app) {
      app = await prisma.application.create({
        data: { jobPostingId: postingId, candidateId: candidates[ad.candidateIdx].id, status: ad.status, stage: ad.stage },
      });
    } else if (app.status !== ad.status) {
      app = await prisma.application.update({ where: { id: app.id }, data: { status: ad.status, stage: ad.stage } });
    }
    applications.push(app);
  }

  // Interviews for applications in interview stage
  const interviewApps = applications.filter((a) => ["interview", "offer"].includes(a.status));
  for (const app of interviewApps) {
    const existing = await prisma.interview.findFirst({ where: { applicationId: app.id } });
    if (!existing) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 7) + 1);
      futureDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
      await prisma.interview.create({
        data: {
          applicationId: app.id,
          scheduledAt: futureDate,
          interviewerId: harper?.userId ?? admin?.id,
          mode: ["video", "in_person", "phone"][Math.floor(Math.random() * 3)],
          status: "scheduled",
        },
      });
    }
  }

  // Offers for applications in offer stage
  const offerApps = applications.filter((a) => a.status === "offer");
  for (const app of offerApps) {
    const existing = await prisma.jobOffer.findFirst({ where: { applicationId: app.id } });
    if (!existing) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      await prisma.jobOffer.create({
        data: {
          applicationId: app.id,
          salary: 95000 + Math.floor(Math.random() * 30000),
          startDate,
          notes: "Competitive offer based on experience",
          status: "pending",
        },
      });
    }
  }

  // ============================================================
  // Payroll
  // ============================================================
  const riley = empByEmail.get("riley@hrms.local");
  const peyton = empByEmail.get("peyton@hrms.local");
  const payrollUser = await prisma.user.findFirst({
    where: { tenantId: company.id, email: "peyton@hrms.local" },
    select: { id: true },
  });
  const payrollManagerUserId = payrollUser?.id ?? null;

  // Salary structures
  const structureDefs: {
    name: string;
    effectiveFrom: string;
    components: { name: string; type: "earning" | "deduction"; amount: number }[];
  }[] = [
    {
      name: "Executive Structure",
      effectiveFrom: "2026-01-01",
      components: [
        { name: "Basic Salary", type: "earning", amount: 15000 },
        { name: "Housing Allowance", type: "earning", amount: 7000 },
        { name: "Transport Allowance", type: "earning", amount: 2000 },
        { name: "Medical Allowance", type: "earning", amount: 1500 },
        { name: "Provident Fund", type: "deduction", amount: 1800 },
        { name: "Income Tax", type: "deduction", amount: 4500 },
        { name: "Health Insurance", type: "deduction", amount: 800 },
      ],
    },
    {
      name: "Manager Structure",
      effectiveFrom: "2026-01-01",
      components: [
        { name: "Basic Salary", type: "earning", amount: 10000 },
        { name: "Housing Allowance", type: "earning", amount: 5000 },
        { name: "Transport Allowance", type: "earning", amount: 1500 },
        { name: "Medical Allowance", type: "earning", amount: 1200 },
        { name: "Provident Fund", type: "deduction", amount: 1200 },
        { name: "Income Tax", type: "deduction", amount: 2800 },
        { name: "Health Insurance", type: "deduction", amount: 600 },
      ],
    },
    {
      name: "Individual Contributor Structure",
      effectiveFrom: "2026-01-01",
      components: [
        { name: "Basic Salary", type: "earning", amount: 7000 },
        { name: "Housing Allowance", type: "earning", amount: 3500 },
        { name: "Transport Allowance", type: "earning", amount: 1000 },
        { name: "Medical Allowance", type: "earning", amount: 900 },
        { name: "Provident Fund", type: "deduction", amount: 840 },
        { name: "Income Tax", type: "deduction", amount: 1500 },
        { name: "Health Insurance", type: "deduction", amount: 500 },
      ],
    },
  ];
  const structureByKey = new Map<string, SalaryStructure & { components: SalaryComponent[] }>();
  for (const def of structureDefs) {
    let structure = await prisma.salaryStructure.findFirst({ where: { tenantId: company.id, name: def.name } });
    if (!structure) {
      structure = await prisma.salaryStructure.create({
        data: { tenantId: company.id, name: def.name, effectiveFrom: new Date(def.effectiveFrom) },
      });
      for (const c of def.components) {
        await prisma.salaryComponent.create({
          data: { salaryStructureId: structure.id, name: c.name, type: c.type, amount: c.amount },
        });
      }
    }
    const full = await prisma.salaryStructure.findUniqueOrThrow({
      where: { id: structure.id },
      include: { components: true },
    });
    structureByKey.set(def.name, full);
  }

  // Active salary assignments
  const assignmentDefs: { emp: { id: string } | undefined; structure: string }[] = [
    { emp: harper, structure: "Executive Structure" },
    { emp: alex, structure: "Executive Structure" },
    { emp: mina, structure: "Manager Structure" },
    { emp: daniel, structure: "Manager Structure" },
    { emp: peyton, structure: "Manager Structure" },
    { emp: lena, structure: "Individual Contributor Structure" },
    { emp: sam, structure: "Individual Contributor Structure" },
    { emp: riley, structure: "Individual Contributor Structure" },
  ];
  for (const a of assignmentDefs) {
    if (!a.emp) continue;
    const existing = await prisma.employeeSalaryAssignment.findFirst({
      where: { employeeId: a.emp.id, effectiveTo: null },
    });
    if (!existing) {
      await prisma.employeeSalaryAssignment.create({
        data: {
          employeeId: a.emp.id,
          salaryStructureId: structureByKey.get(a.structure)!.id,
          effectiveFrom: new Date("2026-01-01"),
        },
      });
    }
  }

  // Tax configuration + slabs
  let taxConfig = await prisma.taxConfig.findFirst({ where: { tenantId: company.id, country: "US" } });
  if (!taxConfig) {
    taxConfig = await prisma.taxConfig.create({
      data: { tenantId: company.id, country: "US", taxType: "progressive" },
    });
    await prisma.taxSlab.createMany({
      data: [
        { taxConfigId: taxConfig.id, fromAmount: 0, toAmount: 20000, ratePercent: 0 },
        { taxConfigId: taxConfig.id, fromAmount: 20000, toAmount: 50000, ratePercent: 10 },
        { taxConfigId: taxConfig.id, fromAmount: 50000, toAmount: 100000, ratePercent: 20 },
        { taxConfigId: taxConfig.id, fromAmount: 100000, toAmount: null, ratePercent: 30 },
      ],
    });
  }

  // Bonuses / incentives (within Aug 2026 so they flow into the pending payroll run)
  const bonusDefs: { emp: { id: string } | undefined; type: string; amount: number; reason: string; date: string; status: string }[] = [
    { emp: sam, type: "bonus", amount: 1500, reason: "Performance bonus", date: "2026-08-15", status: "approved" },
    { emp: lena, type: "incentive", amount: 800, reason: "Project delivery incentive", date: "2026-08-20", status: "approved" },
    { emp: peyton, type: "bonus", amount: 500, reason: "Recognition bonus", date: "2026-09-08", status: "pending" },
  ];
  for (const b of bonusDefs) {
    if (!b.emp) continue;
    const existing = await prisma.salaryBonus.findFirst({
      where: { tenantId: company.id, employeeId: b.emp.id, amount: b.amount, reason: b.reason },
    });
    if (!existing) {
      await prisma.salaryBonus.create({
        data: {
          tenantId: company.id,
          employeeId: b.emp.id,
          type: b.type,
          amount: b.amount,
          reason: b.reason,
          date: new Date(b.date),
          status: b.status,
        },
      });
    }
  }

  // Overtime entries (Aug 2026)
  const overtimeDefs: { emp: { id: string } | undefined; hours: number; amount: number; date: string }[] = [
    { emp: daniel, hours: 10, amount: 600, date: "2026-08-12" },
    { emp: harper, hours: 8, amount: 480, date: "2026-08-14" },
  ];
  for (const o of overtimeDefs) {
    if (!o.emp) continue;
    const existing = await prisma.overtimeEntry.findFirst({
      where: { tenantId: company.id, employeeId: o.emp.id, date: new Date(o.date) },
    });
    if (!existing) {
      await prisma.overtimeEntry.create({
        data: { tenantId: company.id, employeeId: o.emp.id, hours: o.hours, rateFactor: 1.5, amount: o.amount, date: new Date(o.date), status: "approved" },
      });
    }
  }

  // Payroll periods
  const periodDefs: { name: string; start: string; end: string }[] = [
    { name: "July 2026", start: "2026-07-01", end: "2026-07-31" },
    { name: "August 2026", start: "2026-08-01", end: "2026-08-31" },
    { name: "September 2026", start: "2026-09-01", end: "2026-09-30" },
  ];
  const periods = new Map<string, PayrollPeriod>();
  for (const d of periodDefs) {
    let period = await prisma.payrollPeriod.findFirst({ where: { tenantId: company.id, name: d.name } });
    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          tenantId: company.id,
          name: d.name,
          startDate: new Date(d.start),
          endDate: new Date(d.end),
          status: "draft",
        },
      });
    }
    periods.set(d.name, period);
  }

  const computePayslips = async (period: PayrollPeriod) => {
    const assignments = await prisma.employeeSalaryAssignment.findMany({
      where: { salaryStructure: { tenantId: company.id }, effectiveTo: null },
      include: { salaryStructure: { include: { components: true } } },
    });
    const bonuses = await prisma.salaryBonus.findMany({
      where: { tenantId: company.id, date: { gte: period.startDate, lte: period.endDate }, status: "approved" },
    });
    const overtime = await prisma.overtimeEntry.findMany({
      where: { tenantId: company.id, date: { gte: period.startDate, lte: period.endDate }, status: "approved" },
    });
    return assignments.map((a) => {
      const b = bonuses.filter((x) => x.employeeId === a.employeeId);
      const ot = overtime.filter((x) => x.employeeId === a.employeeId);
      const earnings =
        a.salaryStructure.components
          .filter((c) => c.type === "earning")
          .reduce((sum, c) => sum + c.amount.toNumber(), 0) +
        b.reduce((sum, x) => sum + x.amount.toNumber(), 0) +
        ot.reduce((sum, x) => sum + x.amount.toNumber(), 0);
      const deductions = a.salaryStructure.components
        .filter((c) => c.type === "deduction")
        .reduce((sum, c) => sum + c.amount.toNumber(), 0);
      return {
        employeeId: a.employeeId,
        grossPay: Math.round(earnings * 100) / 100,
        totalDeductions: Math.round(deductions * 100) / 100,
        netPay: Math.round((earnings - deductions) * 100) / 100,
        details: {
          structureName: a.salaryStructure.name,
          components: a.salaryStructure.components.map((c) => ({
            name: c.name,
            type: c.type,
            amount: c.amount.toNumber(),
          })),
          bonuses: b.map((x) => ({ type: x.type, reason: x.reason, amount: x.amount.toNumber() })),
          overtime: ot.map((x) => ({ date: x.date, hours: x.hours.toNumber(), amount: x.amount.toNumber() })),
        },
      };
    });
  };

  const syncRun = async (periodName: string, runStatus: string, processedAt: string, periodStatus: string, payslipStatus: string) => {
    const period = periods.get(periodName)!;
    let run = await prisma.payrollRun.findFirst({ where: { payrollPeriodId: period.id } });
    if (!run) {
      run = await prisma.payrollRun.create({
        data: {
          payrollPeriodId: period.id,
          tenantId: company.id,
          status: runStatus,
          processedBy: payrollManagerUserId,
          processedAt: new Date(processedAt),
        },
      });
    }
    const rows = await computePayslips(period);
    for (const row of rows) {
      const existing = await prisma.payslip.findFirst({
        where: { payrollRunId: run.id, employeeId: row.employeeId },
      });
      if (!existing) {
        await prisma.payslip.create({
          data: { ...row, payrollRunId: run.id, tenantId: company.id, status: payslipStatus },
        });
      }
    }
    if (period.status !== periodStatus) {
      await prisma.payrollPeriod.update({ where: { id: period.id }, data: { status: periodStatus } });
      periods.set(periodName, { ...period, status: periodStatus });
    }
  };

  // July: fully paid (history). August: processed, awaiting approval. September: draft (in progress).
  await syncRun("July 2026", "paid", "2026-08-05T09:00:00Z", "paid", "paid");
  await syncRun("August 2026", "completed", "2026-09-05T09:00:00Z", "processed", "draft");

  // Announcement + welcome notifications so the inbox/counters are live
  const announceTitle = "Company holiday calendar published";
  const existingAnn = await prisma.notification.findFirst({ where: { tenantId: company.id, title: announceTitle } });
  if (!existingAnn) {
    const activeUsers = await prisma.user.findMany({
      where: { tenantId: company.id, status: "active" },
      select: { id: true },
    });
    if (activeUsers.length > 0) {
      await prisma.notification.createMany({
        data: activeUsers.map((u) => ({
          tenantId: company.id,
          userId: u.id,
          title: announceTitle,
          body: "The updated holiday calendar for the year is now available.",
          type: "announcement",
        })),
      });
    }
  }

  console.log(`Seeded. Super admin login: ${superAdminEmail} / Admin@123`);
  console.log(`Demo logins: ${DEMO_USERS.map((u) => u.email).join(", ")} / password ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
