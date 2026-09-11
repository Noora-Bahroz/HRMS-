import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(8),
  roleId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  status: z.enum(["active", "suspended", "locked"]).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionCodes: z.array(z.string()).min(1),
});

export const updateRolePermissionsSchema = z.object({
  permissionCodes: z.array(z.string()).min(1),
});
