import { Router } from "express";
import * as userController from "./user.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createRoleSchema, assignRoleSchema, updateRolePermissionsSchema } from "./user.validation";

export const rolesRouter = Router();
rolesRouter.use(authenticate);
rolesRouter.get("/", requirePermission("role:manage"), userController.listRoles);
rolesRouter.post("/", requirePermission("role:manage"), validate(createRoleSchema), userController.createRole);
rolesRouter.get("/permissions", requirePermission("role:manage"), userController.listPermissions);
rolesRouter.patch("/:id/permissions", requirePermission("role:manage"), validate(updateRolePermissionsSchema), userController.updateRolePermissions);

export const userRolesRouter = Router();
userRolesRouter.use(authenticate);
userRolesRouter.get("/:id/roles", requirePermission("user:manage"), userController.getUserRoles);
userRolesRouter.post("/:id/roles", requirePermission("user:manage"), validate(assignRoleSchema), userController.assignRole);

export default rolesRouter;
