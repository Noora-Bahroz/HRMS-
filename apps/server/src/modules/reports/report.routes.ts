import { Router } from "express";
import * as controller from "./report.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

const router = Router();
router.use(authenticate);

router.get("/company-summary", requirePermission("report:headcount"), controller.companySummary);
router.get("/hr-summary", requirePermission("report:headcount"), controller.hrSummary);
router.get("/system-summary", requirePermission("report:headcount"), controller.systemSummary);
router.get("/audit-logs", requirePermission("audit:read"), controller.listAuditLogs);
router.get("/headcount", requirePermission("report:headcount"), controller.headcount);
router.get("/attendance", requirePermission("report:attendance"), controller.attendanceSummary);
router.get("/leave", requirePermission("report:employee"), controller.leaveSummary);
router.get("/department-summary", requirePermission("report:attendance"), controller.departmentSummary);
router.get("/team-summary", requirePermission("report:attendance"), controller.teamSummary);
router.get("/employee-summary", requirePermission("employee:read"), controller.employeeSummary);
router.get("/payroll", requirePermission("report:payroll"), controller.payrollSummary);
router.get("/export/employees.csv", requirePermission("report:employee"), controller.employeeCsv);

export default router;
