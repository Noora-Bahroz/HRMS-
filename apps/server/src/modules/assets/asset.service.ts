import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

export function listAssetTypes(tenantId: string) {
  return prisma.assetType.findMany({ where: { tenantId } });
}

export async function createAssetType(tenantId: string, name: string) {
  return prisma.assetType.create({ data: { tenantId, name } });
}

export async function createAsset(tenantId: string, data: {
  assetTypeId: string;
  tag: string;
  name: string;
  serialNo?: string;
  purchaseDate?: string;
  condition?: string;
}) {
  return prisma.asset.create({
    data: {
      tenantId,
      assetTypeId: data.assetTypeId,
      tag: data.tag,
      name: data.name,
      serialNo: data.serialNo,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      condition: data.condition ?? "good",
      status: "available",
    },
  });
}

export async function listAssets(tenantId: string, status?: string) {
  return prisma.asset.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { assetType: true, assignments: { where: { returnedAt: null }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function assignAsset(tenantId: string, id: string, employeeId: string) {
  const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
  if (!asset) throw ApiError.notFound("Asset not found");
  if (asset.status !== "available") throw ApiError.conflict("Asset is not available");

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assetAssignment.create({
      data: { assetId: id, employeeId },
    });
    await tx.asset.update({ where: { id }, data: { status: "assigned" } });
    return assignment;
  });
}

export async function returnAsset(tenantId: string, id: string, conditionOnReturn?: string) {
  const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
  if (!asset) throw ApiError.notFound("Asset not found");

  return prisma.$transaction(async (tx) => {
    await tx.assetAssignment.updateMany({
      where: { assetId: id, returnedAt: null },
      data: { returnedAt: new Date(), conditionOnReturn },
    });
    await tx.asset.update({
      where: { id },
      data: { status: "available", ...(conditionOnReturn ? { condition: conditionOnReturn } : {}) },
    });
    return tx.asset.findUnique({ where: { id } });
  });
}

export function assetHistory(id: string) {
  return prisma.assetAssignment.findMany({
    where: { assetId: id },
    orderBy: { assignedAt: "desc" },
  });
}
