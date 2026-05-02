import {
  BusinessLedgerEntryCategory,
  BusinessLedgerEntryType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type LedgerClient = Prisma.TransactionClient | typeof prisma;

type ExpenseInput = {
  userId: string;
  category: BusinessLedgerEntryCategory;
  amount: number;
  description: string;
  data?: Prisma.InputJsonValue;
  createdAt?: Date;
};

type ProfitSummaryInput = {
  userId: string;
  startAt?: Date;
  endAt?: Date;
};

export async function recordBusinessExpense(tx: LedgerClient, input: ExpenseInput) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return null;
  }

  return tx.businessLedgerEntry.create({
    data: {
      userId: input.userId,
      type: BusinessLedgerEntryType.EXPENSE,
      category: input.category,
      amount: Math.round(input.amount),
      description: input.description,
      data: input.data,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });
}

export async function getNetProfitSummary({ userId, startAt, endAt }: ProfitSummaryInput) {
  const createdAt =
    startAt || endAt
      ? {
          ...(startAt ? { gte: startAt } : {}),
          ...(endAt ? { lt: endAt } : {}),
        }
      : undefined;

  const [salesIncome, businessExpenses] = await Promise.all([
    prisma.order.aggregate({
      where: {
        sellerId: userId,
        ...(createdAt ? { createdAt } : {}),
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.businessLedgerEntry.aggregate({
      where: {
        userId,
        type: BusinessLedgerEntryType.EXPENSE,
        ...(createdAt ? { createdAt } : {}),
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const salesIncomeCents = salesIncome._sum.totalPrice ?? 0;
  const businessExpenseCents = businessExpenses._sum.amount ?? 0;

  return {
    salesIncomeCents,
    businessExpenseCents,
    netProfitCents: salesIncomeCents - businessExpenseCents,
  };
}

export { BusinessLedgerEntryCategory };
