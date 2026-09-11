import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created, paginate } from "../../utils/http";
import * as userService from "./user.service";
import { writeAudit } from "../../middleware/audit";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const { rows, total } = await userService.listUsers(
    req.user!.tenantId,
    page,
    limit,
    req.query.search as string | undefined
  );
  return ok(res, rows, paginate(page, limit, total));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.user!.tenantId, req.body);
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "user:create", resource: "user", resourceId: user.id },
    req
  );
  return created(res, user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.user!.tenantId, req.params.id, req.body);
  return ok(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.deleteUser(req.user!.tenantId, req.params.id);
  return ok(res, result);
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.listRoles(req.user!.tenantId);
  return ok(res, data);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await userService.createCustomRole(req.user!.tenantId, req.body);
  return created(res, role);
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await userService.listPermissions();
  return ok(res, data);
});

export const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const role = await userService.updateRolePermissions(
    req.user!.tenantId,
    req.params.id,
    (req.body.permissionCodes ?? []) as string[]
  );
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "role:update_permissions", resource: "role", resourceId: role!.id },
    req
  );
  return ok(res, role);
});

export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const ur = await userService.assignRole(req.user!.tenantId, req.params.id, req.body.roleId);
  return ok(res, ur);
});

export const getUserRoles = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.getUserRoles(req.params.id);
  return ok(res, data);
});
