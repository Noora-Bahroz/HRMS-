import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok } from "../../utils/http";
import * as authService from "./auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, req);
  return ok(res, result);
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;
  const result = await authService.signup(fullName, email, password);
  return ok(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken, req);
  return ok(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return ok(res, { message: "Logged out" });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  return ok(res, { message: "Password changed" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return ok(res, user);
});
