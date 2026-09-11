import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok } from "../../utils/http";
import * as notificationService from "./notification.service";

export const myNotifications = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === "true";
  const data = await notificationService.myNotifications(req.user!.id, unreadOnly);
  return ok(res, data);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const n = await notificationService.markRead(req.user!.id, req.params.id);
  return ok(res, n);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllRead(req.user!.id);
  return ok(res, result);
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.broadcast(req.user!.tenantId, req.body);
  return ok(res, result);
});
