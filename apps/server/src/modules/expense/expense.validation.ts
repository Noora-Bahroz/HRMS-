import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
});

export const submitExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  currency: z.string().optional(),
  date: z.string().datetime(),
  description: z.string().optional(),
  receiptFileIds: z.array(z.string().uuid()).optional(),
});

export const decideExpenseSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});
