import { Router } from "express";
import * as controller from "./notification.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { broadcastSchema } from "./notification.validation";

const router = Router();
router.use(authenticate);

router.get("/", controller.myNotifications);
router.post("/:id/read", controller.markRead);
router.post("/read-all", controller.markAllRead);
router.post("/broadcast", requirePermission("settings:manage"), validate(broadcastSchema), controller.broadcast);

export default router;
