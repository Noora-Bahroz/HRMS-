import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as leaveService from "./leave.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { writeAudit } from "../../middleware/audit";

async function employeeIdForUser(userId: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  if (!emp) throw ApiError.forbidden("No employee profile linked to this account");
  return emp.id;
}

export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const request = await leaveService.applyLeave(req.user!.tenantId, {
    employeeId,
    ...req.body,
  });
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "leave.apply", resource: "leave", resourceId: request.id },
    req
  );
  return created(res, request);
});

export const decideLeave = asyncHandler(async (req: Request, res: Response) => {
  const updated = await leaveService.decideLeave(
    req.user!.tenantId,
    req.params.id,
    req.body.decision,
    req.user!.id,
    req.body.comment,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: `leave.${req.body.decision}`, resource: "leave", resourceId: updated.id },
    req
  );
  return ok(res, updated);
});

export const myLeave = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const data = await leaveService.myLeaveRequests(req.user!.tenantId, employeeId, req.query.status as string | undefined);
  return ok(res, data);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listAllLeave(
    req.user!.tenantId,
    req.query.status as string | undefined,
    req.query.employeeId as string | undefined,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data);
});

export const listTypes = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listLeaveTypes(req.user!.tenantId);
  return ok(res, data);
});

export const createType = asyncHandler(async (req: Request, res: Response) => {
  const t = await leaveService.createLeaveType(req.user!.tenantId, req.body);
  return created(res, t);
});

export const listPolicies = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listLeavePolicies(req.user!.tenantId);
  return ok(res, data);
});

export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
  const p = await leaveService.createLeavePolicy(req.user!.tenantId, req.body);
  return created(res, p);
});

export const myBalances = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const data = await leaveService.myLeaveBalances(req.user!.tenantId, employeeId);
  return ok(res, data);
});

export const listAllBalances = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listAllBalances(req.user!.tenantId, {
    scope: req.user!.scope,
    employee: req.user!.employee,
  });
  return ok(res, data);
});

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const data = await leaveService.listHolidays(req.user!.tenantId);
  return ok(res, data);
});
