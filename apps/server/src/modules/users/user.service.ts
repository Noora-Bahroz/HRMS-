import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/jwt";
import { ApiError } from "../../utils/http";

export async function listUsers(tenantId: string, page: number, limit: number, search?: string) {
  const where: Record<string, unknown> = { tenantId: { in: [tenantId, "system"] } };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: { select: { role: { select: { name: true } } } },
      },
    }),
  ]);
  return { rows, total };
}

export async function createUser(tenantId: string, data: { email: string; fullName: string; password: string; roleId: string }) {
  const email = data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw ApiError.conflict("Email already registered");

  const passwordHash = await hashPassword(data.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        email,
        fullName: data.fullName,
        passwordHash,
        status: "active",
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: data.roleId } });
    return user;
  });
}

export async function updateUser(tenantId: string, id: string, data: { fullName?: string; status?: string }) {
  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) throw ApiError.notFound("User not found");
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(tenantId: string, id: string) {
  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) throw ApiError.notFound("User not found");
  await prisma.user.update({ where: { id }, data: { status: "suspended", deletedAt: new Date() } });
  return { message: "User suspended/deleted" };
}

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({ where: { tenantId: { in: [tenantId, "system"] } } });
}

export async function createCustomRole(tenantId: string, data: { name: string; description?: string; permissionCodes: string[] }) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: { tenantId, name: data.name, description: data.description, isSystem: false },
    });
    for (const code of data.permissionCodes) {
      const perm = await tx.permission.findUnique({ where: { code } });
      if (perm) {
        await tx.rolePermission.create({ data: { roleId: role.id, permissionId: perm.id } });
      }
    }
    return role;
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: { module: "asc" } });
}

export async function updateRolePermissions(
  tenantId: string,
  roleId: string,
  permissionCodes: string[]
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId: { in: [tenantId, "system"] } } });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem && role.name === "super_admin") {
    throw ApiError.forbidden("Super Admin role permissions cannot be modified");
  }

  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    const perms = await tx.permission.findMany({ where: { code: { in: permissionCodes } } });
    const permByCode = new Map(perms.map((p) => [p.code, p.id]));
    for (const code of permissionCodes) {
      const pid = permByCode.get(code);
      if (pid) await tx.rolePermission.create({ data: { roleId, permissionId: pid } });
    }
    return tx.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
  });
}

export async function assignRole(tenantId: string, userId: string, roleId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId: { in: [tenantId, "system"] } } });
  if (!role) throw ApiError.notFound("Role not found");
  const exists = await prisma.userRole.findFirst({ where: { userId, roleId } });
  if (exists) return exists;
  return prisma.userRole.create({ data: { userId, roleId } });
}

export async function getUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { id: true, name: true, isSystem: true } } },
  });
}
