import { z } from "zod";

export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  days: z.coerce.number().positive(),
  reason: z.string().optional(),
  isHalfDay: z.boolean().optional().default(false),
});

export const approveLeaveSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  paid: z.boolean().optional().default(false),
  maxPerYear: z.number().int().optional(),
});

export const createPolicySchema = z.object({
  name: z.string().min(1),
  leaveTypeId: z.string().uuid(),
  appliesTo: z.string().optional(),
  departmentId: z.string().uuid().optional(),
});

export const listLeaveRequestsSchema = z.object({
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
});
