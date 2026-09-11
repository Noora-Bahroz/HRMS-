import { z } from "zod";

export const createAssetTypeSchema = z.object({
  name: z.string().min(1),
});

export const createAssetSchema = z.object({
  assetTypeId: z.string().uuid(),
  tag: z.string().min(1),
  name: z.string().min(1),
  serialNo: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  condition: z.string().optional(),
});

export const assignAssetSchema = z.object({
  employeeId: z.string().uuid(),
});

export const returnAssetSchema = z.object({
  conditionOnReturn: z.string().optional(),
});
