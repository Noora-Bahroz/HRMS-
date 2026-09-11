import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as payrollService from "./payroll.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { writeAudit } from "../../middleware/audit";

async function employeeIdForUser(userId: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  if (!emp) throw ApiError.forbidden("No employee profile linked to this account");
  return emp.id;
}

export const createStructure = asyncHandler(async (req: Request, res: Response) => {
  const s = await payrollService.createSalaryStructure(req.user!.tenantId, req.body);
  return created(res, s);
});

export const listStructures = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listStructures(req.user!.tenantId);
  return ok(res, data);
});

export const assignStructure = asyncHandler(async (req: Request, res: Response) => {
  const a = await payrollService.assignStructure(req.user!.tenantId, req.body);
  return ok(res, a);
});

export const listPeriods = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listPeriods(req.user!.tenantId);
  return ok(res, data);
});

export const createPeriod = asyncHandler(async (req: Request, res: Response) => {
  const p = await payrollService.createPayrollPeriod(req.user!.tenantId, req.body);
  return created(res, p);
});

export const processRun = asyncHandler(async (req: Request, res: Response) => {
  const run = await payrollService.processPayroll(
    req.user!.tenantId,
    req.body.payrollPeriodId,
    req.user!.id
  );
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "payroll.process", resource: "payroll", resourceId: req.body.payrollPeriodId },
    req
  );
  return ok(res, run);
});

export const listRuns = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listRuns(req.user!.tenantId);
  return ok(res, data);
});

export const myPayslips = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const data = await payrollService.myPayslips(req.user!.tenantId, employeeId);
  return ok(res, data);
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.getDashboard(req.user!.tenantId);
  return ok(res, data);
});

export const listEmployeeSalaries = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listEmployeeSalaries(req.user!.tenantId);
  return ok(res, data);
});

export const listPayslips = asyncHandler(async (req: Request, res: Response) => {
  const runId = typeof req.query.runId === "string" ? req.query.runId : undefined;
  const data = await payrollService.listPayslips(req.user!.tenantId, runId);
  return ok(res, data);
});

export const getRunDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.runDetail(req.user!.tenantId, req.params.runId);
  return ok(res, data);
});

export const approveRun = asyncHandler(async (req: Request, res: Response) => {
  const run = await payrollService.approveRun(req.user!.tenantId, req.params.runId, req.user!.id);
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "payroll.approve", resource: "payroll", resourceId: req.params.runId },
    req
  );
  return ok(res, run);
});

export const exportRun = asyncHandler(async (req: Request, res: Response) => {
  const csv = await payrollService.exportRunCsv(req.user!.tenantId, req.params.runId);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=payroll-run.csv");
  return res.send(csv);
});

export const listTaxes = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listTaxes(req.user!.tenantId);
  return ok(res, data);
});

export const createTaxConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.createTaxConfig(req.user!.tenantId, req.body);
  return created(res, data);
});

export const listBonuses = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listBonuses(req.user!.tenantId);
  return ok(res, data);
});

export const createBonus = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.createBonus(req.user!.tenantId, req.body);
  return created(res, data);
});

export const listOvertimeEntries = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.listOvertime(req.user!.tenantId);
  return ok(res, data);
});

export const createOvertimeEntry = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrollService.createOvertime(req.user!.tenantId, req.body);
  return created(res, data);
});
