import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

export function listCompanies(query: { page: number; limit: number }, companyId?: string) {
  const skip = (query.page - 1) * query.limit;
  return prisma.company.findMany({
    where: { deletedAt: null, ...(companyId ? { id: companyId } : {}) },
    skip,
    take: query.limit,
  });
}

export function createCompany(data: { name: string; legalName?: string; timezone?: string; currency?: string; code?: string }) {
  return prisma.company.create({
    data: {
      name: data.name,
      legalName: data.legalName,
      timezone: data.timezone,
      currency: data.currency,
    },
  });
}

export function listBranches(companyId: string) {
  return prisma.branch.findMany({ where: { companyId } });
}

export function createBranch(data: {
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  return prisma.branch.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      code: data.code,
      address: data.address,
      city: data.city,
      country: data.country,
    },
  });
}

export function listDepartments(branchId?: string) {
  return prisma.department.findMany({ where: { branchId: branchId ?? undefined } });
}

export function createDepartment(data: {
  branchId?: string;
  name: string;
  code?: string;
  costCenterId?: string;
  parentId?: string;
}) {
  return prisma.department.create({
    data: {
      branchId: data.branchId,
      name: data.name,
      code: data.code,
      costCenterId: data.costCenterId,
      parentId: data.parentId,
    },
  });
}

export function listTeams(departmentId?: string) {
  return prisma.team.findMany({ where: { departmentId: departmentId ?? undefined } });
}

export function createTeam(data: { departmentId: string; name: string; leadEmployeeId?: string }) {
  return prisma.team.create({ data });
}

export function listDesignations(tenantId: string) {
  return prisma.designation.findMany({ where: { tenantId } });
}

export function createDesignation(tenantId: string, title: string, level?: number) {
  return prisma.designation.create({ data: { tenantId, title, level } });
}

export async function getOrgTree(companyId?: string) {
  const [companies, departments, teams] = await Promise.all([
    prisma.company.findMany({ where: { deletedAt: null, ...(companyId ? { id: companyId } : {}) } }),
    prisma.department.findMany({ include: { teams: true } }),
    prisma.team.findMany(),
  ]);
  if (!companies.length) throw ApiError.notFound("No companies");
  return { companies, departments, teams };
}
