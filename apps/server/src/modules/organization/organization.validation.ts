import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  code: z.string().optional(),
});

export const createBranchSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  branchId: z.string().uuid().optional(),
  name: z.string().min(1),
  code: z.string().optional(),
  costCenterId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export const createTeamSchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().min(1),
  leadEmployeeId: z.string().uuid().optional(),
});

export const createDesignationSchema = z.object({
  title: z.string().min(1),
  level: z.number().int().optional(),
});
