import { Router } from "express";
import * as controller from "./leave.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  applyLeaveSchema,
  approveLeaveSchema,
  createLeaveTypeSchema,
  createPolicySchema,
} from "./leave.validation";

const router = Router();
router.use(authenticate);

router.post("/requests", requirePermission("leave:apply"), validate(applyLeaveSchema), controller.applyLeave);
router.get("/requests/mine", requirePermission("leave:apply"), controller.myLeave);
router.get("/requests", requirePermission("leave:read_all"), controller.listAll);
router.patch(
  "/requests/:id/decision",
  requirePermission("leave:approve"),
  validate(approveLeaveSchema),
  controller.decideLeave
);

router.get("/types", requirePermission("leave:apply"), controller.listTypes);
router.post("/types", requirePermission("leave:manage_policy"), validate(createLeaveTypeSchema), controller.createType);

router.get("/policies", requirePermission("leave:manage_policy"), controller.listPolicies);
router.post("/policies", requirePermission("leave:manage_policy"), validate(createPolicySchema), controller.createPolicy);

router.get("/balances/mine", requirePermission("leave:apply"), controller.myBalances);
router.get("/balances", requirePermission("leave:read_all"), controller.listAllBalances);
router.get("/holidays", requirePermission("leave:apply"), controller.listHolidays);

export default router;
