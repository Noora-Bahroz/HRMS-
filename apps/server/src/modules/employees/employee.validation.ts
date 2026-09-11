import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  dateOfJoining: z.string().datetime().optional(),
  employmentType: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const addEmergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
});

export const addDocumentSchema = z.object({
  fileId: z.string().uuid(),
  docType: z.string().min(1),
  title: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

export const addSkillSchema = z.object({
  skill: z.string().min(1),
  level: z.string().optional(),
});

export const addQualificationSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.number().int().optional(),
});

export const addCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export const addEmploymentHistorySchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  employmentStatus: z.string().optional(),
});
