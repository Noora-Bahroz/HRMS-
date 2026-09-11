import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/http";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email: string;
        isSuperAdmin: boolean;
        scope: string;
        employee: { id: string; departmentId: string | null; teamId: string | null } | null;
      };
    }
  }
}

const SCOPE_WEIGHT: Record<string, number> = { self: 1, team: 2, dept: 3, all: 4 };

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("Missing bearer token"));
    }
    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }

    const [user, userRoles, employee] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, tenantId: true, email: true, isSuperAdmin: true, status: true },
      }),
      prisma.userRole.findMany({
        where: { userId: payload.sub },
        select: { role: { select: { scope: true } } },
      }),
      prisma.employee.findFirst({
        where: { userId: payload.sub, deletedAt: null },
        select: { id: true, departmentId: true, teamId: true },
      }),
    ]);

    if (!user) return next(ApiError.unauthorized("User not found"));
    if (user.status !== "active") return next(ApiError.forbidden("Account is not active"));

    // Effective data scope = widest scope among the user's roles (all > dept > team > self)
    let scope = "self";
    for (const ur of userRoles) {
      const w = SCOPE_WEIGHT[ur.role.scope] ?? 0;
      if (w > (SCOPE_WEIGHT[scope] ?? 0)) scope = ur.role.scope;
    }
    if (user.isSuperAdmin) scope = "all";

    req.user = { ...user, scope, employee };
    next();
  } catch (err) {
    next(err);
  }
}
