import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { resolveScopeEmployeeIds, ScopeContext } from "../../utils/scope";

type ApplyInput = {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  isHalfDay?: boolean;
};

export async function applyLeave(tenantId: string, input: ApplyInput) {
  // Check balance availability
  const balance = await prisma.leaveBalance.findFirst({
    where: { tenantId, employeeId: input.employeeId, leaveTypeId: input.leaveTypeId },
  });
  if (balance && balance.available.toNumber() < input.days) {
    throw ApiError.conflict("Insufficient leave balance");
  }

  const request = await prisma.leaveRequest.create({
    data: {
      tenantId,
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      days: input.days,
      reason: input.reason,
      isHalfDay: input.isHalfDay ?? false,
      status: "pending",
    },
  });

  // Create approval record (approver = reporting manager, resolved async in real impl)
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { reportingManagerId: true },
  });
  if (employee?.reportingManagerId) {
    await prisma.leaveApproval.create({
      data: { leaveRequestId: request.id, approverId: employee.reportingManagerId },
    });
  }

  return request;
}

export async function decideLeave(
  tenantId: string,
  id: string,
  decision: "approve" | "reject",
  approverId: string,
  comment?: string,
  ctx?: ScopeContext
) {
  const request = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
  if (!request) throw ApiError.notFound("Leave request not found");
  if (request.status !== "pending") throw ApiError.conflict("Leave request already decided");

  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  if (scoped !== null && !scoped.includes(request.employeeId)) {
    throw ApiError.forbidden("You cannot decide leave for an employee outside your scope");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const req = await tx.leaveRequest.update({
      where: { id },
      data: { status: decision === "approve" ? "approved" : "rejected" },
    });

    await tx.leaveApproval.updateMany({
      where: { leaveRequestId: id, approverId },
      data: { decision, comment, decidedAt: new Date() },
    });

    if (decision === "approve") {
      // Decrement balance
      const balance = await tx.leaveBalance.findFirst({
        where: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId },
      });
      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: balance.used.plus(req.days),
            available: balance.available.minus(req.days),
          },
        });
      }
    }
    return req;
  });

  return updated;
}

export async function myLeaveRequests(tenantId: string, employeeId: string, status?: string) {
  return prisma.leaveRequest.findMany({
    where: { tenantId, employeeId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { leaveType: { select: { name: true, code: true } } },
  });
}

export async function listAllLeave(tenantId: string, status?: string, employeeId?: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const cond: Record<string, unknown>[] = [];
  if (status) cond.push({ status });
  if (employeeId) cond.push({ employeeId });
  if (scoped !== null) cond.push({ employeeId: { in: scoped } });
  return prisma.leaveRequest.findMany({
    where: { tenantId, ...(cond.length ? { AND: cond } : {}) },
    orderBy: { createdAt: "desc" },
    include: { leaveType: { select: { name: true, code: true } } },
  });
}

export function listLeaveTypes(tenantId: string) {
  return prisma.leaveType.findMany({ where: { tenantId } });
}

export function createLeaveType(tenantId: string, data: { name: string; code: string; description?: string; paid?: boolean; maxPerYear?: number }) {
  return prisma.leaveType.create({
    data: { tenantId, ...data },
  });
}

export function listLeavePolicies(tenantId: string) {
  return prisma.leavePolicy.findMany({
    where: { tenantId },
    include: { leaveType: { select: { name: true, code: true } } },
  });
}

export function createLeavePolicy(tenantId: string, data: { name: string; leaveTypeId: string; appliesTo?: string; departmentId?: string }) {
  return prisma.leavePolicy.create({
    data: { tenantId, ...data },
  });
}

export function myLeaveBalances(tenantId: string, employeeId: string) {
  return prisma.leaveBalance.findMany({
    where: { tenantId, employeeId },
    include: { leaveType: { select: { name: true, code: true } } },
  });
}

export async function listAllBalances(tenantId: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const rows = await prisma.leaveBalance.findMany({
    where: {
      tenantId,
      ...(scoped !== null ? { employeeId: { in: scoped } } : {}),
    },
    orderBy: [{ employeeId: "asc" }, { leaveTypeId: "asc" }],
  });

  const employeeIds = Array.from(new Set(rows.map((b) => b.employeeId)));
  const leaveTypeIds = Array.from(new Set(rows.map((b) => b.leaveTypeId)));
  const [employees, leaveTypes] = await Promise.all([
    employeeIds.length
      ? prisma.employee.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : Promise.resolve([]),
    leaveTypeIds.length
      ? prisma.leaveType.findMany({
          where: { id: { in: leaveTypeIds } },
          select: { id: true, name: true, code: true },
        })
      : Promise.resolve([]),
  ]);
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const typeMap = new Map(leaveTypes.map((t) => [t.id, t]));

  return rows.map((b) => ({
    id: b.id,
    employee: empMap.get(b.employeeId) ?? null,
    leaveType: typeMap.get(b.leaveTypeId) ?? null,
    used: Number(b.used),
    available: Number(b.available),
    updatedAt: b.updatedAt,
  }));
}

export function listHolidays(tenantId: string) {
  return prisma.holiday.findMany({ where: { tenantId } });
}
