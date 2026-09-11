import { Router } from "express";
import * as controller from "./payroll.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  assignStructureSchema,
  createBonusSchema,
  createOvertimeSchema,
  createPayrollPeriodSchema,
  createSalaryStructureSchema,
  createTaxConfigSchema,
  processRunSchema,
} from "./payroll.validation";

const router = Router();
router.use(authenticate);

router.get("/structures", requirePermission("payroll:read_all"), controller.listStructures);
router.post(
  "/structures",
  requirePermission("payroll:manage_structure"),
  validate(createSalaryStructureSchema),
  controller.createStructure
);
router.post(
  "/structures/assign",
  requirePermission("payroll:manage_structure"),
  validate(assignStructureSchema),
  controller.assignStructure
);

router.get("/periods", requirePermission("payroll:read_all"), controller.listPeriods);
router.post(
  "/periods",
  requirePermission("payroll:manage_structure"),
  validate(createPayrollPeriodSchema),
  controller.createPeriod
);

router.get("/runs", requirePermission("payroll:read_all"), controller.listRuns);
router.post(
  "/runs/process",
  requirePermission("payroll:process"),
  validate(processRunSchema),
  controller.processRun
);
router.get("/runs/:runId", requirePermission("payroll:read_all"), controller.getRunDetail);
router.post("/runs/:runId/approve", requirePermission("payroll:approve"), controller.approveRun);
router.get("/runs/:runId/export", requirePermission("payroll:read_all"), controller.exportRun);

router.get("/payslips/mine", requirePermission("payroll:view"), controller.myPayslips);
router.get("/payslips", requirePermission("payroll:read_all"), controller.listPayslips);

router.get("/dashboard", requirePermission("payroll:read_all"), controller.getDashboard);
router.get("/employees", requirePermission("payroll:read_all"), controller.listEmployeeSalaries);

router.get("/taxes", requirePermission("payroll:read_all"), controller.listTaxes);
router.post(
  "/taxes",
  requirePermission("payroll:manage_structure"),
  validate(createTaxConfigSchema),
  controller.createTaxConfig
);

router.get("/bonuses", requirePermission("payroll:read_all"), controller.listBonuses);
router.post(
  "/bonuses",
  requirePermission("payroll:manage_structure"),
  validate(createBonusSchema),
  controller.createBonus
);

router.get("/overtime", requirePermission("payroll:read_all"), controller.listOvertimeEntries);
router.post(
  "/overtime",
  requirePermission("payroll:manage_structure"),
  validate(createOvertimeSchema),
  controller.createOvertimeEntry
);

export default router;
