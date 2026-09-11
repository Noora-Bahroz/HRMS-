import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

export function listCategories(tenantId: string) {
  return prisma.expenseCategory.findMany({ where: { tenantId } });
}

export async function createCategory(tenantId: string, name: string) {
  return prisma.expenseCategory.create({ data: { tenantId, name } });
}

export async function submitExpense(tenantId: string, employeeId: string, data: {
  categoryId: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
  receiptFileIds?: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        tenantId,
        employeeId,
        categoryId: data.categoryId,
        amount: data.amount,
        currency: data.currency ?? "USD",
        date: new Date(data.date),
        description: data.description,
        status: "submitted",
      },
    });
    for (const fileId of data.receiptFileIds ?? []) {
      await tx.expenseReceipt.create({ data: { expenseId: expense.id, fileId } });
    }
    return tx.expense.findUnique({
      where: { id: expense.id },
      include: { category: true, receipts: true },
    });
  });
}

export async function decideExpense(tenantId: string, id: string, decision: "approve" | "reject", approverId: string, comment?: string) {
  const expense = await prisma.expense.findFirst({ where: { id, tenantId } });
  if (!expense) throw ApiError.notFound("Expense not found");
  if (expense.status !== "submitted") throw ApiError.conflict("Expense already decided");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id },
      data: { status: decision === "approve" ? "approved" : "rejected" },
    });
    await tx.expenseApproval.create({
      data: {
        expenseId: id,
        approverId,
        decision,
        comment,
        decidedAt: new Date(),
      },
    });
    return updated;
  });
}

export function myExpenses(tenantId: string, employeeId: string) {
  return prisma.expense.findMany({
    where: { tenantId, employeeId },
    orderBy: { createdAt: "desc" },
    include: { category: true, receipts: true },
  });
}

export function listAllExpenses(tenantId: string, status?: string) {
  return prisma.expense.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}
