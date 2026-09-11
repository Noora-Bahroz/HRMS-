import { z } from "zod";

export const createRequisitionSchema = z.object({
  title: z.string().min(1),
  departmentId: z.string().uuid().optional(),
  openings: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const updateRequisitionSchema = z.object({
  title: z.string().min(1).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  openings: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "open", "on_hold", "closed"]).optional(),
});

export const createPostingSchema = z.object({
  requisitionId: z.string().uuid(),
  title: z.string().min(1),
  location: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const createCandidateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const updateCandidateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
});

export const applySchema = z.object({
  jobPostingId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  interviewerId: z.string().uuid().optional(),
  mode: z.string().optional(),
});

export const interviewFeedbackSchema = z.object({
  interviewId: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  status: z.enum(["recommended", "hold", "reject"]).optional(),
});

export const moveApplicationSchema = z.object({
  status: z.string().min(1),
  stage: z.number().int().optional(),
});

export const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  salary: z.coerce.number().optional(),
  startDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateOfferSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "withdrawn"]).optional(),
  salary: z.coerce.number().optional(),
  notes: z.string().nullable().optional(),
});

export const convertToEmployeeSchema = z.object({
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
});
