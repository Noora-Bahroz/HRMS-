import { prisma } from "../../lib/prisma";
import { ApiError, paginate } from "../../utils/http";
import { config } from "../../config";
import { getFileStream, statFile, uploadFile } from "../../lib/storage";
import { buildScopeWhere, resolveScopeEmployeeIds, ScopeContext } from "../../utils/scope";

const bucketName = config.minio.bucket;

export type { ScopeContext };

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  departmentId?: string;
  employmentStatus?: string;
}

export async function listEmployees(tenantId: string, p: ListParams, ctx: ScopeContext) {
  const where: Record<string, unknown> = {
    tenantId,
    deletedAt: null,
  };
  Object.assign(where, buildScopeWhere(ctx));
  if (p.departmentId) where.departmentId = p.departmentId;
  if (p.employmentStatus) where.employmentStatus = p.employmentStatus;
  if (p.search) {
    where.OR = [
      { firstName: { contains: p.search, mode: "insensitive" } },
      { lastName: { contains: p.search, mode: "insensitive" } },
      { email: { contains: p.search, mode: "insensitive" } },
      { employeeNumber: { contains: p.search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        employmentStatus: true,
        employmentType: true,
        dateOfJoining: true,
        departmentId: true,
        designationId: true,
        createdAt: true,
      },
    }),
  ]);

  return { rows, meta: paginate(p.page, p.limit, total) };
}

const employeeDetailInclude = {
  emergencyContacts: true,
  skills: true,
  qualifications: true,
  certifications: true,
  employmentHistory: true,
  documents: true,
  reportingManager: { select: { id: true, firstName: true, lastName: true, email: true } },
  Department: { select: { id: true, name: true } },
  Designation: { select: { id: true, title: true } },
  Team: { select: { id: true, name: true } },
} as const;

export async function getEmployee(tenantId: string, id: string, ctx?: ScopeContext) {
  const scopedWhere = buildScopeWhere(ctx ?? { scope: "all", employee: null });
  const employee = await prisma.employee.findFirst({
    where: { id, tenantId, deletedAt: null, ...scopedWhere },
    include: employeeDetailInclude,
  });
  if (!employee) throw ApiError.notFound("Employee not found");
  return employee;
}

export async function getEmployeeByEmail(tenantId: string, email: string) {
  const employee = await prisma.employee.findFirst({
    where: { tenantId, email: email.toLowerCase(), deletedAt: null },
    include: employeeDetailInclude,
  });
  if (!employee) throw ApiError.notFound("Employee not found");
  return employee;
}

export async function createEmployee(tenantId: string, data: Record<string, unknown>) {
  // Generate a unique employee number
  const count = await prisma.employee.count({ where: { tenantId } });
  const employeeNumber = `EMP-${String(count + 1).padStart(4, "0")}`;
  return prisma.employee.create({
    data: {
      tenantId,
      employeeNumber,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      email: (data.email as string).toLowerCase(),
      phone: (data.phone as string) || undefined,
      gender: (data.gender as string) || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string) : undefined,
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining as string) : undefined,
      employmentType: (data.employmentType as string) || undefined,
      maritalStatus: (data.maritalStatus as string) || undefined,
      address: (data.address as string) || undefined,
      companyId: data.companyId as string,
      branchId: (data.branchId as string) || undefined,
      departmentId: (data.departmentId as string) || undefined,
      teamId: (data.teamId as string) || undefined,
      designationId: (data.designationId as string) || undefined,
      reportingManagerId: (data.reportingManagerId as string) || undefined,
      costCenterId: (data.costCenterId as string) || undefined,
    },
  });
}

export async function updateEmployee(tenantId: string, id: string, data: Record<string, unknown>) {
  await ensureOwnership(tenantId, id);
  const allowed: Record<string, unknown> = {};
  const fields = [
    "firstName", "lastName", "email", "phone", "gender", "dateOfBirth", "dateOfJoining",
    "employmentType", "maritalStatus", "address", "branchId", "departmentId", "teamId",
    "designationId", "reportingManagerId", "costCenterId", "employmentStatus", "dateOfExit",
    "exitReason",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) allowed[f] = data[f];
  }
  if (allowed.email) allowed.email = (allowed.email as string).toLowerCase();
  if (allowed.dateOfBirth) allowed.dateOfBirth = new Date(allowed.dateOfBirth as string);
  if (allowed.dateOfJoining) allowed.dateOfJoining = new Date(allowed.dateOfJoining as string);
  if (allowed.dateOfExit) allowed.dateOfExit = new Date(allowed.dateOfExit as string);

  return prisma.employee.update({ where: { id }, data: allowed });
}

export async function deleteEmployee(tenantId: string, id: string) {
  await ensureOwnership(tenantId, id);
  return prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date(), employmentStatus: "inactive" },
  });
}

export function listDirectory(tenantId: string, ctx?: ScopeContext) {
  const scopedWhere = buildScopeWhere(ctx ?? { scope: "all", employee: null });
  return prisma.employee.findMany({
    where: { tenantId, deletedAt: null, employmentStatus: "active", ...scopedWhere },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeNumber: true,
      departmentId: true,
      designationId: true,
    },
    orderBy: { firstName: "asc" },
  });
}

export async function addDocument(tenantId: string, employeeId: string, data: { fileId: string; docType: string; title: string; expiresAt?: string }, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  if (scoped !== null && !scoped.includes(employeeId)) {
    throw ApiError.forbidden("You cannot add documents for this employee");
  }
  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId,
      fileId: data.fileId,
      docType: data.docType,
      title: data.title,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });
  void prisma.auditLog.create({
    data: {
      tenantId,
      actorId: null,
      action: "employee.document_added",
      resource: "employee",
      resourceId: employeeId,
    },
  });
  return doc;
}

export async function uploadDocument(
  tenantId: string,
  employeeId: string,
  actorId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  meta: { docType: string; title: string; expiresAt?: string },
  ctx?: ScopeContext
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId, deletedAt: null },
  });
  if (!employee) throw ApiError.notFound("Employee not found");

  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  if (scoped !== null && !scoped.includes(employeeId)) {
    throw ApiError.forbidden("You cannot upload documents for this employee");
  }

  const key = await uploadFile({
    tenantId,
    ownerId: employeeId,
    kind: "document",
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  });

  const fileRecord = await prisma.file.create({
    data: {
      tenantId,
      ownerId: employeeId,
      kind: "document",
      bucket: bucketName,
      key,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  });

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId,
      fileId: fileRecord.id,
      docType: meta.docType,
      title: meta.title,
      expiresAt: meta.expiresAt ? new Date(meta.expiresAt) : undefined,
    },
  });

  void prisma.auditLog.create({
    data: {
      tenantId,
      actorId,
      action: "employee.document_uploaded",
      resource: "employee",
      resourceId: employeeId,
    },
  });

  return { doc, file: fileRecord };
}

export async function getDocumentFile(tenantId: string, fileId: string, ctx?: ScopeContext) {
  await assertDocumentAccess(tenantId, fileId, ctx);
  const file = await prisma.file.findFirst({ where: { id: fileId, tenantId } });
  if (!file) throw ApiError.notFound("File not found");
  const stat = await statFile(file.key);
  return { file, size: stat.size };
}

export async function streamDocument(tenantId: string, fileId: string, ctx?: ScopeContext) {
  await assertDocumentAccess(tenantId, fileId, ctx);
  const file = await prisma.file.findFirst({ where: { id: fileId, tenantId } });
  if (!file) throw ApiError.notFound("File not found");
  const stream = await getFileStream(file.key);
  return { file, stream };
}

async function assertDocumentAccess(tenantId: string, fileId: string, ctx?: ScopeContext) {
  const scoped = await resolveScopeEmployeeIds(tenantId, ctx);
  if (scoped === null) return;
  const link = await prisma.employeeDocument.findFirst({
    where: { fileId, employeeId: { in: scoped } },
    select: { id: true },
  });
  if (!link) throw ApiError.forbidden("You cannot access this document");
}

export async function updateMyProfile(tenantId: string, userId: string, data: Record<string, unknown>) {
  const employee = await prisma.employee.findFirst({ where: { userId, tenantId, deletedAt: null } });
  if (!employee) throw ApiError.notFound("No employee profile linked to this account");
  const allowed: Record<string, unknown> = {};
  for (const field of ["phone", "address", "maritalStatus"] as const) {
    if (data[field] !== undefined) allowed[field] = data[field];
  }
  if (Object.keys(allowed).length === 0) return employee;
  return prisma.employee.update({ where: { id: employee.id }, data: allowed });
}

export async function listMyDocuments(tenantId: string, employeeId: string) {
  const docs = await prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
  const fileIds = docs.map((d) => d.fileId);
  const files = fileIds.length
    ? await prisma.file.findMany({
        where: { id: { in: fileIds }, tenantId },
        select: { id: true, fileName: true, mimeType: true, size: true },
      })
    : [];
  const fileMap = new Map(files.map((f) => [f.id, f]));
  return docs.map((d) => ({
    id: d.id,
    docType: d.docType,
    title: d.title,
    expiresAt: d.expiresAt,
    createdAt: d.createdAt,
    file: fileMap.get(d.fileId) ?? null,
  }));
}

export function addEmergencyContact(employeeId: string, data: { name: string; relationship: string; phone: string }) {
  return prisma.emergencyContact.create({ data: { employeeId, ...data } });
}

export function addSkill(employeeId: string, data: { skill: string; level?: string }) {
  return prisma.employeeSkill.create({ data: { employeeId, ...data } });
}

export function addQualification(employeeId: string, data: { degree: string; institution: string; year?: number }) {
  return prisma.qualification.create({ data: { employeeId, ...data } });
}

export function addCertification(employeeId: string, data: { name: string; issuer?: string; validUntil?: string }) {
  return prisma.certification.create({
    data: {
      employeeId,
      name: data.name,
      issuer: data.issuer,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    },
  });
}

export function addEmploymentHistory(
  employeeId: string,
  data: { company: string; role: string; startDate: string; endDate?: string }
) {
  return prisma.employmentHistory.create({
    data: {
      employeeId,
      company: data.company,
      role: data.role,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

type SubResource =
  | "documents"
  | "emergency-contacts"
  | "skills"
  | "qualifications"
  | "certifications"
  | "employment-history";

const subModelMap: Record<SubResource, string> = {
  documents: "employeeDocument",
  "emergency-contacts": "emergencyContact",
  skills: "employeeSkill",
  qualifications: "qualification",
  certifications: "certification",
  "employment-history": "employmentHistory",
};

export async function deleteEmployeeSubResource(
  tenantId: string,
  employeeId: string,
  kind: SubResource,
  subId: string
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId, deletedAt: null },
  });
  if (!employee) throw ApiError.notFound("Employee not found");

  const model = subModelMap[kind];
  const key = kind === "emergency-contacts" ? "employeeId" : "employeeId";
  const deleted = await (prisma as Record<string, any>)[model].deleteMany({
    where: { id: subId, [key]: employeeId },
  });
  if (deleted.count === 0) throw ApiError.notFound("Item not found");
  return { deleted: true };
}

async function ensureOwnership(tenantId: string, id: string) {
  const exists = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!exists) throw ApiError.notFound("Employee not found");
}
