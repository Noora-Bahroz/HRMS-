import { Router } from "express";
import * as controller from "./user.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  assignRoleSchema,
  createRoleSchema,
  createUserSchema,
  updateUserSchema,
} from "./user.validation";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("user:manage"), controller.listUsers);
router.post("/", requirePermission("user:manage"), validate(createUserSchema), controller.createUser);
router.patch("/:id", requirePermission("user:manage"), validate(updateUserSchema), controller.updateUser);
router.delete("/:id", requirePermission("user:manage"), controller.deleteUser);
router.get("/:id/roles", requirePermission("user:manage"), controller.getUserRoles);
router.post("/:id/roles", requirePermission("user:manage"), validate(assignRoleSchema), controller.assignRole);

export default router;
