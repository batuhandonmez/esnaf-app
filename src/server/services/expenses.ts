import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { dateOnlyToDate } from "@/server/dates";
import { ensureAccount, ensureCategory, ensureJob } from "@/server/guards";
import { ApiError } from "@/server/http";

export interface ListExpensesInput {
  from?: string;
  to?: string;
  categoryId?: string;
  jobId?: string;
  accountId?: string;
  page: number;
  pageSize: number;
}

export interface CreateExpenseInput {
  date: string;
  amountKurus: number;
  categoryId: string;
  description?: string;
  jobId?: string;
  accountId: string;
}

export interface UpdateExpenseInput {
  date?: string;
  amountKurus?: number;
  categoryId?: string;
  description?: string;
  jobId?: string;
  accountId?: string;
}

export async function listExpenses(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListExpensesInput,
) {
  const where: Prisma.ExpenseWhereInput = {
    ...(input.from || input.to
      ? {
          date: {
            ...(input.from ? { gte: dateOnlyToDate(input.from) } : {}),
            ...(input.to ? { lte: dateOnlyToDate(input.to) } : {}),
          },
        }
      : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.jobId ? { jobId: input.jobId } : {}),
    ...(input.accountId ? { accountId: input.accountId } : {}),
  };

  const [total, expenses] = await prisma.$transaction([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { category: true, job: true, account: true },
    }),
  ]);

  return {
    total,
    data: expenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      amountKurus: expense.amountKurus,
      description: expense.description,
      categoryId: expense.categoryId,
      categoryName: expense.category.name,
      jobId: expense.jobId,
      jobTitle: expense.job?.title ?? null,
      accountId: expense.accountId,
      accountName: expense.account?.name ?? null,
    })),
  };
}

export async function createExpense(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateExpenseInput,
) {
  await ensureCategory(prisma, input.categoryId);
  await ensureAccount(prisma, input.accountId);
  await ensureJob(prisma, input.jobId);

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        date: dateOnlyToDate(input.date),
        amountKurus: input.amountKurus,
        description: input.description,
        categoryId: input.categoryId,
        jobId: input.jobId,
        accountId: input.accountId,
      },
    });

    await tx.cashMovement.create({
      data: {
        accountId: input.accountId,
        type: "expense",
        amountKurus: input.amountKurus,
        date: dateOnlyToDate(input.date),
        description: input.description,
        expenseId: expense.id,
      },
    });

    return expense;
  });
}

export async function updateExpense(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateExpenseInput,
) {
  if (input.categoryId !== undefined) {
    await ensureCategory(prisma, input.categoryId);
  }
  if (input.accountId !== undefined) {
    await ensureAccount(prisma, input.accountId);
  }
  if (input.jobId !== undefined) {
    await ensureJob(prisma, input.jobId);
  }

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({
      where: { id },
      include: { movement: true },
    });
    if (!expense) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    const nextAmount = input.amountKurus ?? expense.amountKurus;
    const nextDate = input.date ?? expense.date.toISOString().slice(0, 10);
    const nextAccountId = input.accountId ?? expense.accountId;

    if (nextAccountId === null) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        "Gider için hesap zorunludur",
      );
    }

    if (expense.movement) {
      await tx.cashMovement.update({
        where: { id: expense.movement.id },
        data: {
          accountId: nextAccountId,
          amountKurus: nextAmount,
          date: dateOnlyToDate(nextDate),
          description: input.description ?? expense.description,
        },
      });
    } else {
      await tx.cashMovement.create({
        data: {
          accountId: nextAccountId,
          type: "expense",
          amountKurus: nextAmount,
          date: dateOnlyToDate(nextDate),
          description: input.description ?? expense.description,
          expenseId: expense.id,
        },
      });
    }

    return tx.expense.update({
      where: { id },
      data: {
        ...(input.date !== undefined ? { date: dateOnlyToDate(input.date) } : {}),
        ...(input.amountKurus !== undefined
          ? { amountKurus: input.amountKurus }
          : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      },
    });
  });
}

export async function deleteExpense(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({
      where: { id },
      include: { movement: true },
    });
    if (!expense) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    if (expense.movement) {
      await tx.cashMovement.delete({ where: { id: expense.movement.id } });
    }

    await tx.expense.delete({ where: { id } });
  });
}
