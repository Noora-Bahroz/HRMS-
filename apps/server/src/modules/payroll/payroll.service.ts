import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

const Decimal = Prisma.Decimal;

interface ComponentInput {
  name: string;
  type: "earning" | "deduction";
  amount: number;
}

export async function createSalaryStructure(
  tenantId: string,
  data: { name: string; effectiveFrom: string; components: ComponentInput[] }
) {
  return prisma.$transaction(async (tx) => {
    const structure = await tx.salaryStructure.create({
      data: {
        tenantId,
        name: data.name,
        effectiveFrom: new Date(data.effectiveFrom),
      },
    });
    for (const c of data.components) {
      await tx.salaryComponent.create({
        data: {
          salaryStructureId: structure.id,
          name: c.name,
          type: c.type,
          amount: c.amount,
        },
      });
    }
    return tx.salaryStructure.findUnique({
      where: { id: structure.id },
      include: { components: { orderBy: { createdAt: "asc" } } },
    });
  });
}

export function listStructures(tenantId: string) {
  return prisma.salaryStructure.findMany({
    where: { tenantId },
    include: { components: true },
  });
}

export async function assignStructure(
  tenantId: string,
  data: { employeeId: string; salaryStructureId: string }
) {
  const structure = await prisma.salaryStructure.findFirst({
    where: { id: data.salaryStructureId, tenantId },
  });
  if (!structure) throw ApiError.notFound("Salary structure not found");

  // Unassign any current active assignment
  await prisma.employeeSalaryAssignment.updateMany({
    where: { employeeId: data.employeeId, effectiveTo: null },
    data: { effectiveTo: new Date() },
  });

  return prisma.employeeSalaryAssignment.create({
    data: {
      employeeId: data.employeeId,
      salaryStructureId: data.salaryStructureId,
      effectiveFrom: new Date(),
    },
  });
}

export function listPeriods(tenantId: string) {
  return prisma.payrollPeriod.findMany({
    where: { tenantId },
    orderBy: { startDate: "desc" },
  });
}

export async function createPayrollPeriod(
  tenantId: string,
  data: { name: string; startDate: string; endDate: string }
) {
  return prisma.payrollPeriod.create({
    data: {
      tenantId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: "draft",
    },
  });
}

export async function processPayroll(tenantId: string, payrollPeriodId: string, processedBy: string) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: payrollPeriodId, tenantId },
  });
  if (!period) throw ApiError.notFound("Payroll period not found");

  const run = await prisma.$transaction(async (tx) => {
    const existing = await tx.payrollRun.findFirst({
      where: { payrollPeriodId, status: { in: ["processing", "completed"] } },
    });
    if (existing) throw ApiError.conflict("Payroll already processed for this period");

    const run = await tx.payrollRun.create({
      data: {
        payrollPeriodId,
        tenantId,
        status: "processing",
        processedBy,
      },
    });

    // Employees with active salary assignments
    const [assignments, bonuses, overtime] = await Promise.all([
      tx.employeeSalaryAssignment.findMany({
        where: { effectiveTo: null },
        include: { salaryStructure: { include: { components: true } } },
      }),
      tx.salaryBonus.findMany({
        where: { tenantId, date: { gte: period.startDate, lte: period.endDate }, status: "approved" },
      }),
      tx.overtimeEntry.findMany({
        where: { tenantId, date: { gte: period.startDate, lte: period.endDate }, status: "approved" },
      }),
    ]);

    for (const a of assignments) {
      const empBonuses = bonuses.filter((x) => x.employeeId === a.employeeId);
      const empOvertime = overtime.filter((x) => x.employeeId === a.employeeId);
      const earnings = a.salaryStructure.components
        .filter((c) => c.type === "earning")
        .reduce((sum, c) => sum.plus(c.amount), new Decimal(0))
        .plus(empBonuses.reduce((sum, x) => sum.plus(x.amount), new Decimal(0)))
        .plus(empOvertime.reduce((sum, x) => sum.plus(x.amount), new Decimal(0)));
      const deductions = a.salaryStructure.components
        .filter((c) => c.type === "deduction")
        .reduce((sum, c) => sum.plus(c.amount), new Decimal(0));
      const gross = earnings;
      const net = gross.minus(deductions);

      await tx.payslip.create({
        data: {
          payrollRunId: run.id,
          tenantId,
          employeeId: a.employeeId,
          grossPay: gross.toNumber(),
          totalDeductions: deductions.toNumber(),
          netPay: net.toNumber(),
          details: {
            structureName: a.salaryStructure.name,
            components: a.salaryStructure.components,
            bonuses: empBonuses.map((x) => ({ type: x.type, reason: x.reason, amount: x.amount.toNumber() })),
            overtime: empOvertime.map((x) => ({ date: x.date, hours: x.hours.toNumber(), amount: x.amount.toNumber() })),
          },
          status: "draft",
        },
      });
    }

    await tx.payrollPeriod.update({
      where: { id: payrollPeriodId },
      data: { status: "processed" },
    });
    await tx.payrollRun.update({
      where: { id: run.id },
      data: { status: "completed", processedAt: new Date() },
    });

    return tx.payrollRun.findUnique({
      where: { id: run.id },
      include: { payslips: true },
    });
  });

  return run;
}

export async function listRuns(tenantId: string) {
  return prisma.payrollRun.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { payrollPeriod: true, _count: { select: { payslips: true } } },
  });
}

export async function myPayslips(tenantId: string, employeeId: string) {
  return prisma.payslip.findMany({
    where: { tenantId, employeeId },
    orderBy: { createdAt: "desc" },
    include: { payrollRun: { include: { payrollPeriod: true } } },
  });
}

async function addEmployeeRefs<T extends { employeeId: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.employeeId))];
  const employees = await prisma.employee.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employmentStatus: true,
      Department: { select: { name: true } },
      Team: { select: { name: true } },
    },
  });
  const map = new Map(employees.map((e) => [e.id, e]));
  return rows.map((r) => ({ ...r, employee: map.get(r.employeeId) ?? null }));
}

export async function getDashboard(tenantId: string) {
  const [employeeCount, periods, runs, payslips, bonusCount, overtimeCount] = await Promise.all([
    prisma.employeeSalaryAssignment.count({ where: { salaryStructure: { tenantId }, effectiveTo: null } }),
    prisma.payrollPeriod.findMany({ where: { tenantId }, orderBy: { startDate: "desc" } }),
    prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { payrollPeriod: true },
    }),
    prisma.payslip.findMany({ where: { tenantId } }),
    prisma.salaryBonus.count({ where: { tenantId } }),
    prisma.overtimeEntry.count({ where: { tenantId } }),
  ]);

  const totals = payslips.reduce(
    (acc, p) => ({
      gross: acc.gross.plus(p.grossPay),
      deductions: acc.deductions.plus(p.totalDeductions),
      net: acc.net.plus(p.netPay),
    }),
    { gross: new Decimal(0), deductions: new Decimal(0), net: new Decimal(0) }
  );

  const runTrend = runs.slice(0, 12).map((r) => {
    const runPayslips = payslips.filter((p) => p.payrollRunId === r.id);
    return {
      periodName: r.payrollPeriod?.name ?? null,
      status: r.status,
      gross: runPayslips.reduce((sum, p) => sum.plus(p.grossPay), new Decimal(0)),
      deductions: runPayslips.reduce((sum, p) => sum.plus(p.totalDeductions), new Decimal(0)),
      net: runPayslips.reduce((sum, p) => sum.plus(p.netPay), new Decimal(0)),
    };
  });

  return {
    employeeCount,
    currentPeriod: periods[0] ?? null,
    latestRun: runs[0] ?? null,
    pendingApprovals: runs.filter((r) => r.status !== "paid").length,
    totals,
    runTrend,
    bonusCount,
    overtimeCount,
  };
}

export async function listEmployeeSalaries(tenantId: string) {
  const rows = await prisma.employeeSalaryAssignment.findMany({
    where: { salaryStructure: { tenantId }, effectiveTo: null },
    include: { salaryStructure: { include: { components: true } } },
  });
  return addEmployeeRefs(rows);
}

export async function listPayslips(tenantId: string, runId?: string) {
  const rows = await prisma.payslip.findMany({
    where: { tenantId, ...(runId ? { payrollRunId: runId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { payrollRun: { include: { payrollPeriod: true } } },
  });
  return addEmployeeRefs(rows);
}

export async function runDetail(tenantId: string, runId: string) {
  const run = await prisma.payrollRun.findFirst({
    where: { id: runId, tenantId },
    include: { payrollPeriod: true, payslips: { orderBy: { createdAt: "asc" } } },
  });
  if (!run) throw ApiError.notFound("Payroll run not found");
  const payslips = await addEmployeeRefs(run.payslips);
  return { ...run, payslips };
}

export async function approveRun(tenantId: string, runId: string, approvedBy: string) {
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw ApiError.notFound("Payroll run not found");
    if (run.status === "paid") throw ApiError.conflict("Payroll run already approved and paid");
    const updated = await tx.payrollRun.update({
      where: { id: runId },
      data: { status: "paid", processedBy: approvedBy, processedAt: new Date() },
    });
    await tx.payrollPeriod.updateMany({
      where: { id: run.payrollPeriodId },
      data: { status: "paid" },
    });
    await tx.payslip.updateMany({ where: { payrollRunId: runId }, data: { status: "paid" } });
    return updated;
  });
}

export function listTaxes(tenantId: string) {
  return prisma.taxConfig.findMany({
    where: { tenantId },
    include: { slabs: { orderBy: { fromAmount: "asc" } } },
  });
}

export async function createTaxConfig(
  tenantId: string,
  data: { country: string; taxType: string; slabs: { fromAmount: number; toAmount?: number | null; ratePercent: number }[] }
) {
  return prisma.$transaction(async (tx) => {
    const config = await tx.taxConfig.create({ data: { tenantId, country: data.country, taxType: data.taxType } });
    for (const s of data.slabs) {
      await tx.taxSlab.create({
        data: { taxConfigId: config.id, fromAmount: s.fromAmount, toAmount: s.toAmount ?? null, ratePercent: s.ratePercent },
      });
    }
    return tx.taxConfig.findUnique({ where: { id: config.id }, include: { slabs: true } });
  });
}

export async function listBonuses(tenantId: string) {
  const rows = await prisma.salaryBonus.findMany({ where: { tenantId }, orderBy: { date: "desc" } });
  return addEmployeeRefs(rows);
}

export function createBonus(
  tenantId: string,
  data: { employeeId: string; type: string; amount: number; reason: string; date: string; status?: string }
) {
  return prisma.salaryBonus.create({
    data: {
      tenantId,
      employeeId: data.employeeId,
      type: data.type,
      amount: data.amount,
      reason: data.reason,
      date: new Date(data.date),
      status: data.status ?? "pending",
    },
  });
}

export async function listOvertime(tenantId: string) {
  const rows = await prisma.overtimeEntry.findMany({ where: { tenantId }, orderBy: { date: "desc" } });
  return addEmployeeRefs(rows);
}

export function createOvertime(
  tenantId: string,
  data: { employeeId: string; date: string; hours: number; rateFactor?: number; amount: number; status?: string }
) {
  return prisma.overtimeEntry.create({
    data: {
      tenantId,
      employeeId: data.employeeId,
      date: new Date(data.date),
      hours: data.hours,
      rateFactor: data.rateFactor ?? 1.5,
      amount: data.amount,
      status: data.status ?? "pending",
    },
  });
}

export async function exportRunCsv(tenantId: string, runId: string) {
  const run = await runDetail(tenantId, runId);
  const header = ["Employee", "Email", "Gross Pay", "Deductions", "Net Pay", "Status"];
  const body = run.payslips.map((p) =>
    [
      `${p.employee?.firstName ?? ""} ${p.employee?.lastName ?? ""}`.trim(),
      p.employee?.email ?? "",
      Number(p.grossPay),
      Number(p.totalDeductions),
      Number(p.netPay),
      p.status,
    ].join(",")
  );
  return [header.join(","), ...body].join("\n");
}
