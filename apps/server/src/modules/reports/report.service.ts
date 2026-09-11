import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { resolveScopeEmployeeIds, ScopeContext } from "../../utils/scope";

export async function headcount(tenantId: string) {
  const [total, byDepartment, byStatus] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
  ]);
  return { total, byDepartment, byStatus };
}

export async function attendanceSummary(tenantId: string, employeeId?: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const cond: Record<string, unknown>[] = [];
  if (employeeId) cond.push({ employeeId });
  if (scoped !== null) cond.push({ employeeId: { in: scoped } });
  const rows = await prisma.attendance.groupBy({
    by: ["status"],
    where: { tenantId, ...(cond.length ? { AND: cond } : {}) },
    _count: { id: true },
  });
  return rows;
}

export async function leaveSummary(tenantId: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const rows = await prisma.leaveRequest.groupBy({
    by: ["status"],
    where: {
      tenantId,
      ...(scoped !== null ? { employeeId: { in: scoped } } : {}),
    },
    _count: { id: true },
    _sum: { days: true },
  });
  return rows;
}

export async function payrollSummary(tenantId: string) {
  const rows = await prisma.payslip.groupBy({
    by: ["payrollRunId"],
    where: { tenantId },
    _sum: { netPay: true, grossPay: true },
  });
  return rows;
}

export async function hrSummary(tenantId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    employeeTotal,
    employeeByDepartment,
    employeeByStatus,
    joinedThisMonth,
    exitedTotal,
    terminated,
    documents,
    departments,
    teams,
    attendanceToday,
    attendanceTotal,
    attendanceByStatus,
    leaveByStatus,
    requisitionTotal,
    requisitionOpen,
    candidateCount,
    expenseByStatus,
    assetByStatus,
    unreadNotifications,
  ] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, dateOfJoining: { gte: monthStart } } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, dateOfExit: { not: null } } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, employmentStatus: "terminated" } }),
    prisma.employeeDocument.count({ where: { employee: { tenantId, deletedAt: null } } }),
    prisma.department.count(),
    prisma.team.count(),
    prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
    prisma.attendance.count({ where: { tenantId } }),
    prisma.attendance.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.jobRequisition.count({ where: { tenantId } }),
    prisma.jobRequisition.count({ where: { tenantId, status: "open" } }),
    prisma.candidate.count({ where: { tenantId, deletedAt: null } }),
    prisma.expense.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.asset.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.notification.count({ where: { tenantId, readAt: null } }),
  ]);

  const countBy = (
    rows: { status: string; _count: { id: number } }[],
    label: string
  ) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  const expenseAmount = expenseByStatus.reduce(
    (a, r) => a + (r._sum.amount ? Number(r._sum.amount) : 0),
    0
  );

  return {
    organizations: { departments, teams },
    headcount: {
      total: employeeTotal,
      byDepartment: employeeByDepartment.map((r) => ({ departmentId: r.departmentId, count: r._count.id })),
      byStatus: employeeByStatus.map((r) => ({ status: r.employmentStatus, count: r._count.id })),
    },
    movement: {
      joinedThisMonth,
      exited: exitedTotal,
      terminated,
    },
    documents: { total: documents },
    attendance: {
      todayCheckIns: attendanceToday,
      total: attendanceTotal,
      byStatus: attendanceByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: countBy(leaveByStatus, "pending"),
      approved: countBy(leaveByStatus, "approved"),
      byStatus: leaveByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    expenses: {
      total: expenseByStatus.reduce((a, r) => a + r._count.id, 0),
      submitted: countBy(expenseByStatus, "submitted"),
      approved: countBy(expenseByStatus, "approved"),
      reimbursed: countBy(expenseByStatus, "reimbursed"),
      amount: expenseAmount,
    },
    assets: {
      total: assetByStatus.reduce((a, r) => a + r._count.id, 0),
      byStatus: assetByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    recruitment: {
      requisitions: requisitionTotal,
      open: requisitionOpen,
      candidates: candidateCount,
    },
    notifications: { unread: unreadNotifications },
  };
}

export async function systemSummary(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    companies,
    branches,
    departments,
    teams,
    employeeTotal,
    attendanceToday,
    attendanceTotal,
    attendanceByStatus,
    leaveByStatus,
    payrollRuns,
    payslips,
    payslipNet,
    expenseByStatus,
    assetByStatus,
    requisitionTotal,
    requisitionOpen,
    candidateCount,
    userTotal,
    userActive,
    unreadNotifications,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.branch.count(),
    prisma.department.count(),
    prisma.team.count(),
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
    prisma.attendance.count({ where: { tenantId } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.payrollRun.count({ where: { tenantId } }),
    prisma.payslip.count({ where: { tenantId } }),
    prisma.payslip.aggregate({ where: { tenantId }, _sum: { netPay: true } }),
    prisma.expense.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.asset.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.jobRequisition.count({ where: { tenantId } }),
    prisma.jobRequisition.count({ where: { tenantId, status: "open" } }),
    prisma.candidate.count({ where: { tenantId, deletedAt: null } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, status: "active" } }),
    prisma.notification.count({ where: { tenantId, readAt: null } }),
  ]);

  const countBy = (rows: { status: string; _count: { id: number } }[], label: string) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  const leavePending = countBy(leaveByStatus, "pending");
  const leaveApproved = countBy(leaveByStatus, "approved");
  const expenseAmount = expenseByStatus.reduce((a, r) => a + (r._sum.amount ? Number(r._sum.amount) : 0), 0);

  return {
    organizations: { companies, branches, departments, teams },
    headcount: { total: employeeTotal },
    attendance: {
      todayCheckIns: attendanceToday,
      total: attendanceTotal,
      byStatus: attendanceByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: leavePending,
      approved: leaveApproved,
      byStatus: leaveByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    payroll: {
      runs: payrollRuns,
      payslips,
      netPaid: payslipNet._sum.netPay ? Number(payslipNet._sum.netPay) : 0,
    },
    expenses: {
      total: expenseByStatus.reduce((a, r) => a + r._count.id, 0),
      submitted: countBy(expenseByStatus, "submitted"),
      approved: countBy(expenseByStatus, "approved"),
      reimbursed: countBy(expenseByStatus, "reimbursed"),
      amount: expenseAmount,
    },
    assets: {
      total: assetByStatus.reduce((a, r) => a + r._count.id, 0),
      byStatus: assetByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    recruitment: {
      requisitions: requisitionTotal,
      open: requisitionOpen,
      candidates: candidateCount,
    },
    users: { total: userTotal, active: userActive },
    notifications: { unread: unreadNotifications },
  };
}

export async function auditLogs(tenantId: string, page: number, limit: number) {
  const where = { tenantId };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const actorIds = Array.from(new Set(rows.map((r) => r.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, email: true, fullName: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      action: r.action,
      resource: r.resource,
      resourceId: r.resourceId,
      payload: r.payload,
      ip: r.ip,
      createdAt: r.createdAt,
      actor: r.actorId ? actorMap.get(r.actorId) ?? null : null,
    })),
  };
}

export async function companySummary(tenantId: string, companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    branches,
    departments,
    teams,
    employeeTotal,
    employeeByDepartment,
    employeeByStatus,
    attendanceToday,
    attendanceTotal,
    attendanceByStatus,
    leaveByStatus,
    expenseByStatus,
    assetByStatus,
    requisitionTotal,
    requisitionOpen,
    candidateCount,
    unreadNotifications,
  ] = await Promise.all([
    prisma.branch.count({ where: { companyId } }),
    prisma.department.count(),
    prisma.team.count(),
    prisma.employee.count({ where: { tenantId, deletedAt: null } }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
    prisma.attendance.count({ where: { tenantId } }),
    prisma.attendance.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.expense.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.asset.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.jobRequisition.count({ where: { tenantId } }),
    prisma.jobRequisition.count({ where: { tenantId, status: "open" } }),
    prisma.candidate.count({ where: { tenantId, deletedAt: null } }),
    prisma.notification.count({ where: { tenantId, readAt: null } }),
  ]);

  const countBy = (
    rows: { status: string; _count: { id: number } }[],
    label: string
  ) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  const leavePending = countBy(leaveByStatus, "pending");
  const leaveApproved = countBy(leaveByStatus, "approved");
  const expenseAmount = expenseByStatus.reduce(
    (a, r) => a + (r._sum.amount ? Number(r._sum.amount) : 0),
    0
  );

  return {
    organizations: { branches, departments, teams },
    headcount: {
      total: employeeTotal,
      byDepartment: employeeByDepartment.map((r) => ({ departmentId: r.departmentId, count: r._count.id })),
      byStatus: employeeByStatus.map((r) => ({ status: r.employmentStatus, count: r._count.id })),
    },
    attendance: {
      todayCheckIns: attendanceToday,
      total: attendanceTotal,
      byStatus: attendanceByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: leavePending,
      approved: leaveApproved,
      byStatus: leaveByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    expenses: {
      total: expenseByStatus.reduce((a, r) => a + r._count.id, 0),
      submitted: countBy(expenseByStatus, "submitted"),
      approved: countBy(expenseByStatus, "approved"),
      reimbursed: countBy(expenseByStatus, "reimbursed"),
      amount: expenseAmount,
    },
    assets: {
      total: assetByStatus.reduce((a, r) => a + r._count.id, 0),
      byStatus: assetByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    recruitment: {
      requisitions: requisitionTotal,
      open: requisitionOpen,
      candidates: candidateCount,
    },
    notifications: { unread: unreadNotifications },
  };
}

export async function employeeCsv(tenantId: string, ctx?: ScopeContext): Promise<string> {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const employees = await prisma.employee.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(scoped !== null ? { id: { in: scoped } } : {}),
    },
    take: 1000,
  });
  const header = "employee_number,first_name,last_name,email,status,type,date_of_joining\n";
  const lines = employees.map(
    (e) =>
      [e.employeeNumber, e.firstName, e.lastName, e.email, e.employmentStatus, e.employmentType ?? "", e.dateOfJoining?.toISOString() ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
  );
  return header + lines.join("\n");
}

export async function departmentSummary(tenantId: string, departmentId: string) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw ApiError.notFound("Department not found");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const members = await prisma.employee.findMany({
    where: { tenantId, deletedAt: null, departmentId },
    select: { id: true },
  });
  const ids = members.map((m) => m.id);
  const idFilter = ids.length ? { in: ids } : "00000000-0000-0000-0000-000000000000";

  const [
    headcountTotal,
    headcountByStatus,
    joinedThisMonth,
    exited,
    attendanceToday,
    attendanceTotal,
    attendanceByStatus,
    attendanceHours,
    leaveByStatus,
    unreadNotifications,
  ] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null, departmentId } }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { tenantId, deletedAt: null, departmentId },
      _count: { id: true },
    }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, departmentId, dateOfJoining: { gte: monthStart } } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, departmentId, dateOfExit: { not: null } } }),
    prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, employeeId: idFilter } }),
    prisma.attendance.count({ where: { tenantId, employeeId: idFilter } }),
    prisma.attendance.groupBy({ by: ["status"], where: { tenantId, employeeId: idFilter }, _count: { id: true } }),
    prisma.attendance.aggregate({ where: { tenantId, employeeId: idFilter }, _sum: { totalHours: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], where: { tenantId, employeeId: idFilter }, _count: { id: true } }),
    prisma.notification.count({ where: { tenantId, readAt: null } }),
  ]);

  const countBy = (rows: { status: string; _count: { id: number } }[], label: string) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  return {
    department: { id: department.id, name: department.name },
    headcount: {
      total: headcountTotal,
      byStatus: headcountByStatus.map((r) => ({ status: r.employmentStatus, count: r._count.id })),
    },
    movement: { joinedThisMonth, exited },
    attendance: {
      todayCheckIns: attendanceToday,
      total: attendanceTotal,
      byStatus: attendanceByStatus.map((r) => ({ status: r.status, count: r._count.id })),
      totalHours: attendanceHours._sum.totalHours ? Number(attendanceHours._sum.totalHours) : 0,
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: countBy(leaveByStatus, "pending"),
      approved: countBy(leaveByStatus, "approved"),
      byStatus: leaveByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    notifications: { unread: unreadNotifications },
  };
}

export async function teamSummary(tenantId: string, teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw ApiError.notFound("Team not found");
  const department = team.departmentId
    ? await prisma.department.findUnique({ where: { id: team.departmentId } })
    : null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const members = await prisma.employee.findMany({
    where: { tenantId, deletedAt: null, teamId },
    select: { id: true },
  });
  const ids = members.map((m) => m.id);
  const idFilter = ids.length ? { in: ids } : "00000000-0000-0000-0000-000000000000";

  const [
    headcountTotal,
    headcountByStatus,
    joinedThisMonth,
    exited,
    attendanceToday,
    attendanceTodayCheckedOut,
    attendanceTotal,
    attendanceByStatus,
    attendanceHours,
    leaveByStatus,
    leaveBalances,
    unreadNotifications,
  ] = await Promise.all([
    prisma.employee.count({ where: { tenantId, deletedAt: null, teamId } }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { tenantId, deletedAt: null, teamId },
      _count: { id: true },
    }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, teamId, dateOfJoining: { gte: monthStart } } }),
    prisma.employee.count({ where: { tenantId, deletedAt: null, teamId, dateOfExit: { not: null } } }),
    prisma.attendance.count({ where: { tenantId, date: { gte: today, lt: tomorrow }, employeeId: idFilter } }),
    prisma.attendance.count({
      where: { tenantId, date: { gte: today, lt: tomorrow }, employeeId: idFilter, checkOutAt: { not: null } },
    }),
    prisma.attendance.count({ where: { tenantId, employeeId: idFilter } }),
    prisma.attendance.groupBy({ by: ["status"], where: { tenantId, employeeId: idFilter }, _count: { id: true } }),
    prisma.attendance.aggregate({ where: { tenantId, employeeId: idFilter }, _sum: { totalHours: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], where: { tenantId, employeeId: idFilter }, _count: { id: true } }),
    prisma.leaveBalance.groupBy({
      by: ["leaveTypeId"],
      where: { tenantId, employeeId: idFilter },
      _sum: { used: true, available: true },
    }),
    prisma.notification.count({ where: { tenantId, readAt: null } }),
  ]);

  const countBy = (rows: { status: string; _count: { id: number } }[], label: string) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  const leaveTypeRows = await prisma.leaveType.findMany({ where: { tenantId }, select: { id: true, name: true, code: true } });
  const leaveTypeMap = new Map(leaveTypeRows.map((t) => [t.id, t]));

  return {
    team: {
      id: team.id,
      name: team.name,
      departmentId: team.departmentId,
      departmentName: department?.name ?? null,
    },
    headcount: {
      total: headcountTotal,
      byStatus: headcountByStatus.map((r) => ({ status: r.employmentStatus, count: r._count.id })),
    },
    movement: { joinedThisMonth, exited },
    attendance: {
      todayCheckIns: attendanceToday,
      todayCheckedOut: attendanceTodayCheckedOut,
      total: attendanceTotal,
      byStatus: attendanceByStatus.map((r) => ({ status: r.status, count: r._count.id })),
      totalHours: attendanceHours._sum.totalHours ? Number(attendanceHours._sum.totalHours) : 0,
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: countBy(leaveByStatus, "pending"),
      approved: countBy(leaveByStatus, "approved"),
      byStatus: leaveByStatus.map((r) => ({ status: r.status, count: r._count.id })),
    },
    leaveBalances: leaveBalances.map((b) => {
      const type = leaveTypeMap.get(b.leaveTypeId);
      return {
        leaveTypeId: b.leaveTypeId,
        name: type?.name ?? "Leave",
        code: type?.code ?? "",
        used: b._sum.used ? Number(b._sum.used) : 0,
        available: b._sum.available ? Number(b._sum.available) : 0,
      };
    }),
    notifications: { unread: unreadNotifications },
  };
}

export async function employeeSummary(tenantId: string, employeeId: string, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    employee,
    attendanceRows,
    attendanceToday,
    leaveByStatus,
    leaveRecent,
    leaveBalances,
    payslip,
    expenses,
    expenseStats,
    notifUnread,
    notifRecent,
  ] = await Promise.all([
    prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeNumber: true,
        employmentStatus: true,
        employmentType: true,
        dateOfJoining: true,
        phone: true,
        address: true,
        maritalStatus: true,
        Department: { select: { id: true, name: true } },
        Designation: { select: { id: true, title: true } },
        Team: { select: { id: true, name: true } },
      },
    }),
    prisma.attendance.findMany({
      where: { tenantId, employeeId },
      select: { id: true, date: true, checkInAt: true, checkOutAt: true, status: true, totalHours: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.attendance.findFirst({
      where: { tenantId, employeeId, date: { gte: today, lt: tomorrow } },
      select: { date: true, checkInAt: true, checkOutAt: true, status: true, totalHours: true },
    }),
    prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { tenantId, employeeId },
      _count: { id: true },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId, employeeId },
      select: { id: true, leaveTypeId: true, startDate: true, endDate: true, days: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.leaveBalance.groupBy({
      by: ["leaveTypeId"],
      where: { tenantId, employeeId },
      _sum: { used: true, available: true },
    }),
    prisma.payslip.findFirst({
      where: { tenantId, employeeId },
      include: { payrollRun: { include: { payrollPeriod: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { tenantId, employeeId },
      select: {
        id: true,
        amount: true,
        currency: true,
        date: true,
        description: true,
        status: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.expense.groupBy({
      by: ["status"],
      where: { tenantId, employeeId },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.notification.count({ where: { tenantId, userId, readAt: null } }),
    prisma.notification.findMany({
      where: { tenantId, userId },
      select: { id: true, title: true, body: true, type: true, readAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!employee) throw ApiError.notFound("Employee not found");

  const leaveTypeRows = await prisma.leaveType.findMany({
    where: { tenantId },
    select: { id: true, name: true, code: true },
  });
  const leaveTypeMap = new Map(leaveTypeRows.map((t) => [t.id, t]));

  const countBy = (rows: { status: string; _count: { id: number } }[], label: string) => {
    const row = rows.find((r) => r.status === label);
    return row ? row._count.id : 0;
  };

  const attendanceByStatus = attendanceRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const attendanceTotalHours = attendanceRows.reduce((a, r) => a + (r.totalHours ? Number(r.totalHours) : 0), 0);
  const expensePending = expenseStats.find((r) => r.status === "submitted");
  const expenseTotalAmount = expenseStats.reduce((a, r) => a + (r._sum.amount ? Number(r._sum.amount) : 0), 0);

  return {
    profile: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employeeNumber: employee.employeeNumber,
      employmentStatus: employee.employmentStatus,
      employmentType: employee.employmentType,
      dateOfJoining: employee.dateOfJoining,
      phone: employee.phone,
      address: employee.address,
      maritalStatus: employee.maritalStatus,
      department: employee.Department ? { id: employee.Department.id, name: employee.Department.name } : null,
      designation: employee.Designation ? { id: employee.Designation.id, title: employee.Designation.title } : null,
      team: employee.Team ? { id: employee.Team.id, name: employee.Team.name } : null,
    },
    attendance: {
      total: attendanceRows.length,
      byStatus: attendanceByStatus,
      totalHours: attendanceTotalHours,
      today: attendanceToday
        ? {
            date: attendanceToday.date,
            checkInAt: attendanceToday.checkInAt,
            checkOutAt: attendanceToday.checkOutAt,
            status: attendanceToday.status,
            totalHours: attendanceToday.totalHours ? Number(attendanceToday.totalHours) : null,
          }
        : null,
    },
    leave: {
      total: leaveByStatus.reduce((a, r) => a + r._count.id, 0),
      pending: countBy(leaveByStatus, "pending"),
      approved: countBy(leaveByStatus, "approved"),
      balances: leaveBalances.map((b) => {
        const type = leaveTypeMap.get(b.leaveTypeId);
        return {
          leaveTypeId: b.leaveTypeId,
          name: type?.name ?? "Leave",
          code: type?.code ?? "",
          used: b._sum.used ? Number(b._sum.used) : 0,
          available: b._sum.available ? Number(b._sum.available) : 0,
        };
      }),
      recent: leaveRecent.map((r) => ({
        id: r.id,
        leaveTypeId: r.leaveTypeId,
        leaveTypeName: leaveTypeMap.get(r.leaveTypeId)?.name ?? "Leave",
        startDate: r.startDate,
        endDate: r.endDate,
        days: Number(r.days),
        status: r.status,
      })),
    },
    payslip: payslip
      ? {
          id: payslip.id,
          grossPay: Number(payslip.grossPay),
          totalDeductions: Number(payslip.totalDeductions),
          netPay: Number(payslip.netPay),
          status: payslip.status,
          periodName: payslip.payrollRun?.payrollPeriod?.name ?? null,
          createdAt: payslip.createdAt,
        }
      : null,
    expenses: {
      total: expenseStats.reduce((a, r) => a + r._count.id, 0),
      pending: expensePending ? expensePending._count.id : 0,
      amount: expenseTotalAmount,
      recent: expenses.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        currency: e.currency,
        date: e.date,
        description: e.description,
        status: e.status,
        categoryName: e.category?.name ?? null,
      })),
    },
    notifications: {
      unread: notifUnread,
      recent: notifRecent,
    },
  };
}
