import { Router } from "express";
import type { RequestHandler } from "express";
import * as controller from "./employee.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requireAnyPermission, requirePermission } from "../../middleware/rbac";
import { uploadDocumentFile } from "../../middleware/upload";
import {
  addCertificationSchema,
  addDocumentSchema,
  addEmergencyContactSchema,
  addEmploymentHistorySchema,
  addQualificationSchema,
  addSkillSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employee.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("employee:read"),
  controller.listEmployees
);
router.post(
  "/",
  requirePermission("employee:create"),
  validate(createEmployeeSchema),
  controller.createEmployee
);
router.get("/directory", requirePermission("employee:read"), controller.getDirectory);
router.get("/me", controller.getMyEmployee);
router.patch("/me", requirePermission("employee:read"), controller.updateMyProfile);
router.get("/me/documents", requirePermission("employee:read"), controller.listMyDocuments);
router.post(
  "/me/documents/upload",
  requirePermission("employee:read"),
  uploadDocumentFile as unknown as RequestHandler,
  controller.uploadMyDocument
);
router.get("/:id", requirePermission("employee:read"), controller.getEmployee);
router.patch(
  "/:id",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(updateEmployeeSchema),
  controller.updateEmployee
);
router.delete("/:id", requirePermission("employee:delete"), controller.deleteEmployee);

// File access + document upload
router.get("/files/:fileId", requirePermission("employee:read"), controller.getEmployeeDocument);
router.get("/files/:fileId/download", requirePermission("employee:read"), controller.streamEmployeeDocument);
router.post(
  "/:id/documents/upload",
  requireAnyPermission(["employee:manage_documents", "employee:update"]),
  uploadDocumentFile as unknown as RequestHandler,
  controller.uploadEmployeeDocument
);

router.post(
  "/:id/employment-history",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(addEmploymentHistorySchema),
  controller.addEmploymentHistory
);

// Delete sub-resources: /:id/documents/:subId, /:id/skills/:subId, etc.
router.delete(
  "/:id/:kind/:subId",
  requireAnyPermission(["employee:update", "employee:create"]),
  controller.deleteSubResource
);

router.post(
  "/:id/documents",
  requireAnyPermission(["employee:manage_documents", "employee:update"]),
  validate(addDocumentSchema),
  controller.addDocument
);
router.post(
  "/:id/emergency-contacts",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(addEmergencyContactSchema),
  controller.addEmergencyContact
);
router.post(
  "/:id/skills",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(addSkillSchema),
  controller.addSkill
);
router.post(
  "/:id/qualifications",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(addQualificationSchema),
  controller.addQualification
);
router.post(
  "/:id/certifications",
  requireAnyPermission(["employee:update", "employee:create"]),
  validate(addCertificationSchema),
  controller.addCertification
);

export default router;
