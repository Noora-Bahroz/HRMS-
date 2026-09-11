import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";
import { resolveScopeEmployeeIds, ScopeContext } from "../../utils/scope";

export async function checkIn(tenantId: string, employeeId: string, shiftId?: string, notes?: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const existing = await prisma.attendance.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: todayStart } },
  });

  if (existing?.checkInAt) {
    throw ApiError.conflict("Already checked in today");
  }

  const attendance = await prisma.attendance.create({
    data: {
      tenantId,
      employeeId,
      date: todayStart,
      checkInAt: new Date(),
      shiftId,
      notes,
      status: "present",
    },
  });
  return attendance;
}

export async function checkOut(tenantId: string, employeeId: string, notes?: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const attendance = await prisma.attendance.findFirst({
    where: { tenantId, employeeId, date: todayStart, checkOutAt: null },
  });
  if (!attendance) throw ApiError.notFound("No open attendance record");

  const checkout = new Date();
  const startMs = attendance.checkInAt?.getTime() ?? checkout.getTime();
  const ms = checkout.getTime() - startMs;
  const totalHours = Math.round((ms / 3600000) * 100) / 100;

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutAt: checkout,
      totalHours,
      ...(notes !== undefined ? { notes } : {}),
    },
  });
}

export async function myAttendance(tenantId: string, employeeId: string) {
  return prisma.attendance.findMany({
    where: { tenantId, employeeId },
    orderBy: { date: "desc" },
    take: 100,
  });
}

export async function listAllAttendance(tenantId: string, employeeId?: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  const cond: Record<string, unknown>[] = [];
  if (employeeId) cond.push({ employeeId });
  if (scoped !== null) cond.push({ employeeId: { in: scoped } });
  return prisma.attendance.findMany({
    where: { tenantId, ...(cond.length ? { AND: cond } : {}) },
    orderBy: { date: "desc" },
  });
}

export function listShifts(tenantId: string) {
  return prisma.shift.findMany({ where: { tenantId } });
}

export function createShift(tenantId: string, data: { name: string; startTime: string; endTime: string; gracePeriodMins?: number }) {
  return prisma.shift.create({ data: { tenantId, ...data } });
}

export function createHoliday(tenantId: string, data: { name: string; date: string }) {
  return prisma.holiday.create({ data: { tenantId, name: data.name, date: new Date(data.date) } });
}

export function listHolidays(tenantId: string) {
  return prisma.holiday.findMany({ where: { tenantId } });
}
