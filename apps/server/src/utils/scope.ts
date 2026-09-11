import { prisma } from "../lib/prisma";

export interface ScopeContext {
  scope: string;
  employee: { id: string; departmentId: string | null; teamId: string | null } | null;
}

/**
 * Build extra "where" constraints that restrict employee reads to the caller's
 * data scope: all -> everyone, dept -> own department, team -> own team,
 * self -> own record only.
 */
export function buildScopeWhere(ctx?: ScopeContext | null): Record<string, unknown> {
  if (!ctx || ctx.scope === "all") return {};
  if (!ctx.employee) {
    // Restricted scope but no linked employee -> sees nothing.
    return { id: "00000000-0000-0000-0000-000000000000" };
  }
  switch (ctx.scope) {
    case "self":
      return { id: ctx.employee.id };
    case "team":
      return ctx.employee.teamId
        ? { teamId: ctx.employee.teamId }
        : { id: "00000000-0000-0000-0000-000000000000" };
    case "dept":
      return ctx.employee.departmentId
        ? { departmentId: ctx.employee.departmentId }
        : { id: "00000000-0000-0000-0000-000000000000" };
    default:
      return {};
  }
}

/**
 * Resolve the employee ids visible to a scope context.
 * Returns null when unrestricted ("all"), otherwise the list of employee ids
 * (empty array = nothing visible).
 */
export async function resolveScopeEmployeeIds(
  tenantId: string,
  ctx?: ScopeContext | null
): Promise<string[] | null> {
  if (!ctx || ctx.scope === "all") return null;
  const rows = await prisma.employee.findMany({
    where: { tenantId, deletedAt: null, ...buildScopeWhere(ctx) },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}