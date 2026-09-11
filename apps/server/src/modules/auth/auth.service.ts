import { prisma } from "../../lib/prisma";
import {
  hashToken,
  hashPassword,
  randomTokenId,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "../../lib/jwt";
import { ApiError } from "../../utils/http";
import { writeAudit } from "../../middleware/audit";
import type { Request } from "express";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string; tenantId: string; isSuperAdmin: boolean };
}

export async function login(
  email: string,
  password: string,
  req?: Request
): Promise<LoginResult> {  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.status === "suspended") {
    await recordLogin(user?.id, false, req);
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (user.status === "locked" && user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.unauthorized("Account locked. Try again later.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const locked = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        status: locked ? "locked" : user.status,
        lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
      },
    });
    await recordLogin(user.id, false, req);
    throw ApiError.unauthorized("Invalid credentials");
  }

  // Reset lockout on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, status: "active", lockedUntil: null, lastLoginAt: new Date() },
  });
  await recordLogin(user.id, true, req);

  const accessToken = signAccessToken({
    sub: user.id,
    tenantId: user.tenantId,
    email: user.email,
  });

  const refreshToken = await createRefreshToken(user.id);

  writeAudit(
    { tenantId: user.tenantId, actorId: user.id, action: "login", resource: "auth" },
    req
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
}

export async function signup(fullName: string, email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) throw ApiError.conflict("Email already registered");

  const company = await prisma.company.findFirst({ where: { status: "active" } });
  if (!company) throw ApiError.internal("No company configured. Contact an administrator.");

  const role = await prisma.role.findFirst({
    where: { name: "employee", tenantId: "system" },
  });
  if (!role) throw ApiError.internal("Default role not configured. Contact an administrator.");

  let user;
  await prisma.$transaction(async (tx) => {
    user = await tx.user.create({
      data: {
        tenantId: company.id,
        email: normalizedEmail,
        fullName,
        passwordHash: await hashPassword(password),
        status: "active",
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
  });

  const accessToken = signAccessToken({
    sub: user!.id,
    tenantId: user!.tenantId,
    email: user!.email,
  });
  const refreshToken = await createRefreshToken(user!.id);

  writeAudit(
    { tenantId: user!.tenantId, actorId: user!.id, action: "signup", resource: "auth" },
    undefined
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user!.id,
      email: user!.email,
      fullName: user!.fullName,
      tenantId: user!.tenantId,
      isSuperAdmin: user!.isSuperAdmin,
    },
  };
}

async function createRefreshToken(userId: string): Promise<string> {
  const jti = randomTokenId();
  const token = signRefreshToken(userId, jti);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(jti), expiresAt },
  });
  return token;
}

export async function refresh(refreshToken: string, req?: Request): Promise<LoginResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash: hashToken(payload.jti), revokedAt: null },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== "active") {
    throw ApiError.unauthorized("User not active");
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken({ sub: user.id, tenantId: user.tenantId, email: user.email });
  const newRefreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, tokenHash: hashToken(payload.jti), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // ignore, treat as logged out
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  // Invalidate all refresh tokens
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
}

async function recordLogin(userId: string | undefined, success: boolean, req?: Request) {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: userId ?? "",
        success,
        ip: req?.ip ?? null,
        userAgent: req?.headers["user-agent"] ?? null,
      },
    });
  } catch {
    // ignore
  }
}

const SCOPE_WEIGHT: Record<string, number> = { self: 1, team: 2, dept: 3, all: 4 };

export async function getMe(userId: string) {
  const [user, userRoles, employee] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, tenantId: true, isSuperAdmin: true },
    }),
    prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            name: true,
            scope: true,
            rolePermissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    }),
    prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, departmentId: true, teamId: true },
    }),
  ]);
  if (!user) throw ApiError.notFound("User not found");

  const roles = userRoles.map((ur) => ur.role.name);
  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) permissions.add(rp.permission.code);
  }
  if (user.isSuperAdmin) {
    permissions.add("*");
  }

  let scope = "self";
  for (const ur of userRoles) {
    const w = SCOPE_WEIGHT[ur.role.scope] ?? 0;
    if (w > (SCOPE_WEIGHT[scope] ?? 0)) scope = ur.role.scope;
  }
  if (user.isSuperAdmin) scope = "all";

  return { ...user, roles, permissions: [...permissions], scope, employee };
}
