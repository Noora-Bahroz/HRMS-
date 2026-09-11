import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/http";

/**
 * requirePermission(permissionCode)
 * Loads the authenticated user's roles -> permissions and rejects if the
 * required permission is not granted. Super admin bypasses the check.
 */
export function requirePermission(permissionCode: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (user.isSuperAdmin) return next();

      const roles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: {
          role: {
            select: {
              rolePermissions: { select: { permission: { select: { code: true } } } },
            },
          },
        },
      });

      const codes = new Set<string>();
      for (const ur of roles) {
        for (const rp of ur.role.rolePermissions) codes.add(rp.permission.code);
      }

      if (!codes.has(permissionCode)) {
        return next(ApiError.forbidden(`Missing permission: ${permissionCode}`));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Convenience: require one of several permissions (OR).
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      if (user.isSuperAdmin) return next();

      const roles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: {
          role: {
            select: {
              rolePermissions: { select: { permission: { select: { code: true } } } },
            },
          },
        },
      });

      const granted = new Set<string>();
      for (const ur of roles) {
        for (const rp of ur.role.rolePermissions) granted.add(rp.permission.code);
      }

      if (!permissionCodes.some((c) => granted.has(c))) {
        return next(ApiError.forbidden("Insufficient permissions"));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
