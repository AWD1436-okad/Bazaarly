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

export async function recordBusinessRefund(tx: LedgerClient, input: ExpenseInput) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return null;
  }

  return tx.businessLedgerEntry.create({
    data: {
      userId: input.userId,
      type: BusinessLedgerEntryType.REFUND,
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

  const salesSummary = await prisma.orderLineItem.aggregate({
      where: {
        order: {
          sellerId: userId,
          ...(createdAt ? { createdAt } : {}),
        },
      },
      _sum: {
        lineTotal: true,
        lineProfit: true,
      },
    });

  const salesIncomeCents = salesSummary._sum.lineTotal ?? 0;
  const netProfitCents = salesSummary._sum.lineProfit ?? 0;

  // Profit is sale revenue minus the cost basis of the sold quantity.
  // Stock purchases stay in the ledger/receipts, but do not reduce profit
  // until those units are actually sold.
  return {
    salesIncomeCents,
    businessExpenseCents: salesIncomeCents - netProfitCents,
    netProfitCents,
  };
}

export { BusinessLedgerEntryCategory };
