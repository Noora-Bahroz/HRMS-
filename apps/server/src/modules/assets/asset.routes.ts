import { Router } from "express";
import * as controller from "./asset.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  assignAssetSchema,
  createAssetSchema,
  createAssetTypeSchema,
  returnAssetSchema,
} from "./asset.validation";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("asset:manage"), controller.listAssets);
router.get("/types", requirePermission("asset:manage"), controller.listAssetTypes);
router.post("/types", requirePermission("asset:manage"), validate(createAssetTypeSchema), controller.createAssetType);
router.post("/", requirePermission("asset:manage"), validate(createAssetSchema), controller.createAsset);
router.post("/:id/assign", requirePermission("asset:assign"), validate(assignAssetSchema), controller.assignAsset);
router.post("/:id/return", requirePermission("asset:manage"), validate(returnAssetSchema), controller.returnAsset);
router.get("/:id/history", requirePermission("asset:manage"), controller.assetHistory);

export default router;
