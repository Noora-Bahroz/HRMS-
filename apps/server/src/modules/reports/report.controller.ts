import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, ApiError } from "../../utils/http";
import * as reportService from "./report.service";

export const companySummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.companySummary(req.user!.tenantId, req.user!.tenantId);
  return ok(res, data);
});

export const hrSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.hrSummary(req.user!.tenantId);
  return ok(res, data);
});

export const systemSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.isSuperAdmin) throw ApiError.forbidden("Only Super Admin can access the system summary");
  const data = await reportService.systemSummary(req.user!.tenantId);
  return ok(res, data);
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const data = await reportService.auditLogs(req.user!.tenantId, page, limit);
  return ok(res, data);
});

export const headcount = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.headcount(req.user!.tenantId);
  return ok(res, data);
});

export const attendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.attendanceSummary(
    req.user!.tenantId,
    req.query.employeeId as string | undefined,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data);
});

export const leaveSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.leaveSummary(req.user!.tenantId, {
    scope: req.user!.scope,
    employee: req.user!.employee,
  });
  return ok(res, data);
});

export const departmentSummary = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.scope === "team" || req.user!.scope === "self") {
    throw ApiError.forbidden("Department summary requires department or wider data scope");
  }
  const departmentId = req.user!.employee?.departmentId ?? null;
  if (!departmentId) throw ApiError.forbidden("You are not assigned to a department");
  const data = await reportService.departmentSummary(req.user!.tenantId, departmentId);
  return ok(res, data);
});

export const teamSummary = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.scope === "self") {
    throw ApiError.forbidden("You can only access your own records");
  }
  const teamId = req.user!.employee?.teamId ?? null;
  if (!teamId) throw ApiError.forbidden("You are not assigned to a team");
  const data = await reportService.teamSummary(req.user!.tenantId, teamId);
  return ok(res, data);
});

export const employeeSummary = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employee?.id ?? null;
  if (!employeeId) throw ApiError.forbidden("No employee profile linked to this account");
  const data = await reportService.employeeSummary(req.user!.tenantId, employeeId, req.user!.id);
  return ok(res, data);
});

export const payrollSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.payrollSummary(req.user!.tenantId);
  return ok(res, data);
});

export const employeeCsv = asyncHandler(async (req: Request, res: Response) => {
  const csv = await reportService.employeeCsv(req.user!.tenantId, {
    scope: req.user!.scope,
    employee: req.user!.employee,
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=employees.csv");
  return res.send(csv);
});
