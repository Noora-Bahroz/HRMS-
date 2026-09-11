import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
