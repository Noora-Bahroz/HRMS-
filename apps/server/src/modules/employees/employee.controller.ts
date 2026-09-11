import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created, ApiError } from "../../utils/http";
import { prisma } from "../../lib/prisma";
import * as employeeService from "./employee.service";
import { writeAudit } from "../../middleware/audit";

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.listEmployees(
    req.user!.tenantId,
    {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      employmentStatus: req.query.employmentStatus as string | undefined,
    },
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data.rows, data.meta);
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getEmployee(
    req.user!.tenantId,
    req.params.id,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data);
});

export const getMyEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await prisma.employee.findFirst({
    where: { userId: req.user!.id, tenantId: req.user!.tenantId, deletedAt: null },
    include: {
      Department: true,
      Team: true,
      Designation: true,
      reportingManager: true,
      documents: true,
      emergencyContacts: true,
      skills: true,
      qualifications: true,
      certifications: true,
    },
  });
  if (!employee) throw ApiError.notFound("Employee not found");
  return ok(res, employee);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.updateMyProfile(req.user!.tenantId, req.user!.id, req.body);
  return ok(res, data);
});

export const listMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employee?.id ?? null;
  if (!employeeId) throw ApiError.forbidden("No employee profile linked to this account");
  const docs = await employeeService.listMyDocuments(req.user!.tenantId, employeeId);
  return ok(res, docs);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const emp = await employeeService.createEmployee(req.user!.tenantId, req.body);
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "employee:create", resource: "employee", resourceId: emp.id },
    req
  );
  return created(res, emp);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const emp = await employeeService.updateEmployee(req.user!.tenantId, req.params.id, req.body);
  writeAudit(
    { tenantId: req.user!.tenantId, actorId: req.user!.id, action: "employee:update", resource: "employee", resourceId: emp.id },
    req
  );
  return ok(res, emp);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.deleteEmployee(req.user!.tenantId, req.params.id);
  return ok(res, { message: "Employee deleted" });
});

export const getDirectory = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.listDirectory(req.user!.tenantId, {
    scope: req.user!.scope,
    employee: req.user!.employee,
  });
  return ok(res, data);
});

export const uploadEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: UploadedFile }).file;
  if (!file) throw ApiError.badRequest("No file uploaded");

  let expiresAt: string | undefined;
  if (req.body.expiresAt) {
    const date = new Date(req.body.expiresAt);
    if (!Number.isNaN(date.getTime())) expiresAt = date.toISOString();
  }

  const result = await employeeService.uploadDocument(
    req.user!.tenantId,
    req.params.id,
    req.user!.id,
    { originalname: file.originalname, mimetype: file.mimetype, size: file.size, buffer: file.buffer },
    { docType: req.body.docType || "other", title: req.body.title || file.originalname, expiresAt }
  );
  return created(res, result);
});

export const uploadMyDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: UploadedFile }).file;
  if (!file) throw ApiError.badRequest("No file uploaded");
  const employeeId = req.user!.employee?.id ?? null;
  if (!employeeId) throw ApiError.forbidden("No employee profile linked to this account");

  let expiresAt: string | undefined;
  if (req.body.expiresAt) {
    const date = new Date(req.body.expiresAt);
    if (!Number.isNaN(date.getTime())) expiresAt = date.toISOString();
  }

  const result = await employeeService.uploadDocument(
    req.user!.tenantId,
    employeeId,
    req.user!.id,
    { originalname: file.originalname, mimetype: file.mimetype, size: file.size, buffer: file.buffer },
    { docType: req.body.docType || "other", title: req.body.title || file.originalname, expiresAt }
  );
  return created(res, result);
});

export const getEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const data = await employeeService.getDocumentFile(
    req.user!.tenantId,
    req.params.fileId,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return ok(res, data);
});

export const streamEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { file, stream } = await employeeService.streamDocument(
    req.user!.tenantId,
    req.params.fileId,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${file.fileName}"`);
  stream.pipe(res);
});

export const addEmploymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const e = await employeeService.addEmploymentHistory(req.params.id, req.body);
  return created(res, e);
});

export const deleteSubResource = asyncHandler(async (req: Request, res: Response) => {
  const kind = req.params.kind as
    | "documents"
    | "emergency-contacts"
    | "skills"
    | "qualifications"
    | "certifications"
    | "employment-history";
  await employeeService.deleteEmployeeSubResource(req.user!.tenantId, req.params.id, kind, req.params.subId);
  return ok(res, { message: "Deleted" });
});

export const addDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await employeeService.addDocument(
    req.user!.tenantId,
    req.params.id,
    req.body,
    { scope: req.user!.scope, employee: req.user!.employee }
  );
  return created(res, doc);
});

export const addEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const c = await employeeService.addEmergencyContact(req.params.id, req.body);
  return created(res, c);
});

export const addSkill = asyncHandler(async (req: Request, res: Response) => {
  const s = await employeeService.addSkill(req.params.id, req.body);
  return created(res, s);
});

export const addQualification = asyncHandler(async (req: Request, res: Response) => {
  const q = await employeeService.addQualification(req.params.id, req.body);
  return created(res, q);
});

export const addCertification = asyncHandler(async (req: Request, res: Response) => {
  const c = await employeeService.addCertification(req.params.id, req.body);
  return created(res, c);
});
