import { Request } from "express";
import { prisma } from "../lib/prisma";

export interface AuditInput {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  payload?: unknown;
}

/**
 * Best-effort audit log writer. Fire-and-forget so it never blocks requests.
 */
export function writeAudit(input: AuditInput, req?: Request) {
  const ip = req?.ip ?? (req?.socket?.remoteAddress ?? null);
  void prisma.auditLog
    .create({
      data: {
        tenantId: input.tenantId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        payload: (input.payload as never) ?? undefined,
        ip,
      },
    })
    .catch(() => {
      // audit failures must not break the request
    });
}
