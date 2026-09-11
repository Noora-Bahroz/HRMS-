import { Router } from "express";
import * as controller from "./attendance.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  checkInSchema,
  checkOutSchema,
  createHolidaySchema,
  createShiftSchema,
} from "./attendance.validation";

const router = Router();
router.use(authenticate);

router.post("/check-in", requirePermission("attendance:check_in"), validate(checkInSchema), controller.checkIn);
router.post("/check-out", requirePermission("attendance:check_in"), validate(checkOutSchema), controller.checkOut);
router.get("/mine", requirePermission("attendance:check_in"), controller.myAttendance);
router.get("/", requirePermission("attendance:read_all"), controller.listAll);

router.get("/shifts", requirePermission("attendance:check_in"), controller.listShifts);
router.post("/shifts", requirePermission("attendance:manage_shift"), validate(createShiftSchema), controller.createShift);

router.get("/holidays", requirePermission("attendance:check_in"), controller.listHolidays);
router.post("/holidays", requirePermission("attendance:manage_shift"), validate(createHolidaySchema), controller.createHoliday);

export default router;
