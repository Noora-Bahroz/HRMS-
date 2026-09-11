import { Request, Response } from "express";
import { asyncHandler } from "../../utils/validate";
import { ok, created } from "../../utils/http";
import * as assetService from "./asset.service";

export const listAssetTypes = asyncHandler(async (req: Request, res: Response) => {
  const data = await assetService.listAssetTypes(req.user!.tenantId);
  return ok(res, data);
});

export const createAssetType = asyncHandler(async (req: Request, res: Response) => {
  const t = await assetService.createAssetType(req.user!.tenantId, req.body.name);
  return created(res, t);
});

export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const a = await assetService.createAsset(req.user!.tenantId, req.body);
  return created(res, a);
});

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const data = await assetService.listAssets(req.user!.tenantId, req.query.status as string | undefined);
  return ok(res, data);
});

export const assignAsset = asyncHandler(async (req: Request, res: Response) => {
  const a = await assetService.assignAsset(req.user!.tenantId, req.params.id, req.body.employeeId);
  return ok(res, a);
});

export const returnAsset = asyncHandler(async (req: Request, res: Response) => {
  const a = await assetService.returnAsset(req.user!.tenantId, req.params.id, req.body.conditionOnReturn);
  return ok(res, a);
});

export const assetHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await assetService.assetHistory(req.params.id);
  return ok(res, data);
});
