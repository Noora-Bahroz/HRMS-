import { Router } from "express";
import * as controller from "./organization.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  createBranchSchema,
  createCompanySchema,
  createDepartmentSchema,
  createDesignationSchema,
  createTeamSchema,
} from "./organization.validation";

const router = Router();

router.use(authenticate);

router.get("/companies", controller.listCompanies);
router.post(
  "/companies",
  requirePermission("org:manage"),
  validate(createCompanySchema),
  controller.createCompany
);

router.get("/branches", controller.listBranches);
router.post(
  "/branches",
  requirePermission("org:manage"),
  validate(createBranchSchema),
  controller.createBranch
);

router.get("/departments", controller.listDepartments);
router.post(
  "/departments",
  requirePermission("department:manage"),
  validate(createDepartmentSchema),
  controller.createDepartment
);

router.get("/teams", controller.listTeams);
router.post("/teams", requirePermission("org:manage"), validate(createTeamSchema), controller.createTeam);

router.get("/designations", controller.listDesignations);
router.post(
  "/designations",
  requirePermission("org:manage"),
  validate(createDesignationSchema),
  controller.createDesignation
);

router.get("/tree", controller.getOrgTree);

export default router;
