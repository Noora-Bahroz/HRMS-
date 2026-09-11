import { Router } from "express";
import * as controller from "./expense.controller";
import { validate } from "../../utils/validate";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createCategorySchema, decideExpenseSchema, submitExpenseSchema } from "./expense.validation";

const router = Router();
router.use(authenticate);

router.get("/categories", requirePermission("expense:submit"), controller.listCategories);
router.post(
  "/categories",
  requirePermission("expense:submit"),
  validate(createCategorySchema),
  controller.createCategory
);

router.post("/", requirePermission("expense:submit"), validate(submitExpenseSchema), controller.submitExpense);
router.get("/mine", requirePermission("expense:submit"), controller.myExpenses);
router.get("/", requirePermission("expense:read_all"), controller.listAll);
router.patch(
  "/:id/decision",
  requirePermission("expense:approve"),
  validate(decideExpenseSchema),
  controller.decideExpense
);

export default router;
