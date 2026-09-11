import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as expenseService from "./expense.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { writeAudit } from "../../middleware/audit";

async function employeeIdForUser(userId: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  if (!emp) throw ApiError.forbidden("No employee profile linked to this account");
  return emp.id;
}

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.listCategories(req.user!.tenantId);
  return ok(res, data);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const c = await expenseService.createCategory(req.user!.tenantId, req.body.name);
  return created(res, c);
});

export const submitExpense = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const expense = await expenseService.submitExpense(req.user!.tenantId, employeeId, req.body);
  return created(res, expense);
});

export const decideExpense = asyncHandler(async (req: Request, res: Response) => {
  const updated = await expenseService.decideExpense(
    req.user!.tenantId,
    req.params.id,
    req.body.decision,
    req.user!.id,
    req.body.comment
  );
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: `expense.${req.body.decision}`, resource: "expense", resourceId: updated.id },
    req
  );
  return ok(res, updated);
});

export const myExpenses = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const data = await expenseService.myExpenses(req.user!.tenantId, employeeId);
  return ok(res, data);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await expenseService.listAllExpenses(req.user!.tenantId, req.query.status as string | undefined);
  return ok(res, data);
});
