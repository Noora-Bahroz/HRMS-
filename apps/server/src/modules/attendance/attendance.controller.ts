import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as attendanceService from "./attendance.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

async function employeeIdForUser(userId: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { userId } });
  if (!emp) throw ApiError.forbidden("No employee profile linked to this account");
  return emp.id;
}

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const attendance = await attendanceService.checkIn(req.user!.tenantId, employeeId, req.body.shiftId, req.body.notes);
  return created(res, attendance);
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const attendance = await attendanceService.checkOut(req.user!.tenantId, employeeId, req.body.notes);
  return ok(res, attendance);
});

export const myAttendance = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = await employeeIdForUser(req.user!.id);
  const data = await attendanceService.myAttendance(req.user!.tenantId, employeeId);
  return ok(res, data);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listAllAttendance(
    req.user!.tenantId,
    req.query.employeeId as string | undefined,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data);
});

export const listShifts = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listShifts(req.user!.tenantId);
  return ok(res, data);
});

export const createShift = asyncHandler(async (req: Request, res: Response) => {
  const s = await attendanceService.createShift(req.user!.tenantId, req.body);
  return created(res, s);
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const h = await attendanceService.createHoliday(req.user!.tenantId, req.body);
  return created(res, h);
});

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listHolidays(req.user!.tenantId);
  return ok(res, data);
});
