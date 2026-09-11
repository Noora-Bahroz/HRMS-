import { z } from "zod";

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1),
  effectiveFrom: z.string().datetime(),
  components: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum(["earning", "deduction"]),
        amount: z.coerce.number().nonnegative(),
      })
    )
    .min(1),
});

export const assignStructureSchema = z.object({
  employeeId: z.string().uuid(),
  salaryStructureId: z.string().uuid(),
});

export const createPayrollPeriodSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const processRunSchema = z.object({
  payrollPeriodId: z.string().uuid(),
});

export const createTaxConfigSchema = z.object({
  country: z.string().min(1),
  taxType: z.string().min(1),
  slabs: z
    .array(
      z.object({
        fromAmount: z.coerce.number().nonnegative(),
        toAmount: z.coerce.number().nonnegative().nullable().optional(),
        ratePercent: z.coerce.number().nonnegative(),
      })
    )
    .min(1),
});

export const createBonusSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(["bonus", "incentive"]),
  amount: z.coerce.number().positive(),
  reason: z.string().min(1),
  date: z.string().datetime(),
  status: z.enum(["pending", "approved", "paid"]).optional(),
});

export const createOvertimeSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().datetime(),
  hours: z.coerce.number().positive(),
  rateFactor: z.coerce.number().nonnegative().optional(),
  amount: z.coerce.number().positive(),
  status: z.enum(["pending", "approved", "paid"]).optional(),
});
