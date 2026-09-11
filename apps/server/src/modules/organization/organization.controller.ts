import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created, ApiError } from "../../utils/http";
import * as orgService from "./organization.service";
import { writeAudit } from "../../middleware/audit";

export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.listCompanies({ page: 1, limit: 50 }, req.user!.isSuperAdmin ? undefined : req.user!.tenantId);
  return ok(res, data);
});

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.isSuperAdmin) {
    throw ApiError.forbidden("Only Super Admin can create companies");
  }
  const company = await orgService.createCompany(req.body);
  writeAudit(
    { tenantId: company.id, actorId: req.user!.id, action: "company:create", resource: "company", resourceId: company.id },
    req
  );
  return created(res, company);
});

export const listBranches = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.listBranches(String(req.query.companyId ?? ""));
  return ok(res, data);
});

export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await orgService.createBranch(req.body);
  return created(res, branch);
});

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.listDepartments(req.query.branchId as string | undefined);
  return ok(res, data);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await orgService.createDepartment(req.body);
  return created(res, dept);
});

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.listTeams(req.query.departmentId as string | undefined);
  return ok(res, data);
});

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const team = await orgService.createTeam(req.body);
  return created(res, team);
});

export const listDesignations = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.listDesignations(req.user!.tenantId);
  return ok(res, data);
});

export const createDesignation = asyncHandler(async (req: Request, res: Response) => {
  const d = await orgService.createDesignation(req.user!.tenantId, req.body.title, req.body.level);
  return created(res, d);
});

export const getOrgTree = asyncHandler(async (req: Request, res: Response) => {
  const data = await orgService.getOrgTree(req.user!.isSuperAdmin ? undefined : req.user!.tenantId);
  return ok(res, data);
});
