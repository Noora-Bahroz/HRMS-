import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

export function myNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markRead(userId: string, id: string) {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw ApiError.notFound("Notification not found");
  if (notif.readAt) return notif;
  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { count: result.count };
}

/**
 * Broadcast to all active users in a tenant (announcement).
 * In a scaled deployment this would be enqueued to RabbitMQ; here we issue
 * direct inserts for simplicity and testability.
 */
export async function broadcast(tenantId: string, data: { title: string; body?: string; type?: string }) {
  const users = await prisma.user.findMany({
    where: { tenantId, status: "active" },
    select: { id: true },
  });
  const created = await prisma.notification.createMany({
    data: users.map((u) => ({
      tenantId,
      userId: u.id,
      title: data.title,
      body: data.body,
      type: data.type ?? "announcement",
    })),
  });
  return { count: created.count };
}
