import type { PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { dateOnlyToDate } from "@/server/dates";
import { isIncomingMovement } from "@/server/domain";
import { ApiError } from "@/server/http";

export interface CreateAccountInput {
  name: string;
  type: "cash" | "bank";
  openingBalanceKurus?: number;
  sortOrder?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: "cash" | "bank";
  openingBalanceKurus?: number;
  sortOrder?: number;
}

export interface ListMovementsInput {
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface CreateManualMovementInput {
  accountId: string;
  direction: "in" | "out";
  amountKurus: number;
  date: string;
  description?: string;
}

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amountKurus: number;
  date: string;
  description?: string;
}

export async function listAccounts(prisma: PrismaClient, _ctx: Ctx) {
  const [accounts, movements] = await prisma.$transaction([
    prisma.account.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.cashMovement.groupBy({
      by: ["accountId", "type"],
      orderBy: { accountId: "asc" },
      _sum: { amountKurus: true },
    }),
  ]);

  const movementSum = new Map<string, { in: number; out: number }>();
  for (const movement of movements) {
    const key = movement.accountId;
    const entry = movementSum.get(key) ?? { in: 0, out: 0 };
    const sum = movement._sum?.amountKurus ?? 0;
    if (isIncomingMovement(movement.type)) {
      entry.in += sum;
    } else {
      entry.out += sum;
    }
    movementSum.set(key, entry);
  }

  return accounts.map((account) => {
    const sums = movementSum.get(account.id) ?? { in: 0, out: 0 };
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      openingBalanceKurus: account.openingBalanceKurus,
      sortOrder: account.sortOrder,
      balanceKurus:
        account.openingBalanceKurus + sums.in - sums.out,
    };
  });
}

export async function createAccount(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateAccountInput,
) {
  return prisma.account.create({
    data: {
      name: input.name,
      type: input.type,
      openingBalanceKurus: input.openingBalanceKurus ?? 0,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateAccount(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateAccountInput,
) {
  return prisma.account.update({ where: { id }, data: input });
}

export async function listMovements(
  prisma: PrismaClient,
  _ctx: Ctx,
  accountId: string,
  input: ListMovementsInput,
) {
  const where = {
    accountId,
    ...(input.from || input.to
      ? {
          date: {
            ...(input.from ? { gte: dateOnlyToDate(input.from) } : {}),
            ...(input.to ? { lte: dateOnlyToDate(input.to) } : {}),
          },
        }
      : {}),
  };

  const [total, movements] = await prisma.$transaction([
    prisma.cashMovement.count({ where }),
    prisma.cashMovement.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    total,
    data: movements.map((movement) => ({
      id: movement.id,
      accountId: movement.accountId,
      type: movement.type,
      amountKurus: movement.amountKurus,
      date: movement.date,
      description: movement.description,
      transferGroupId: movement.transferGroupId,
      revenueId: movement.revenueId,
      expenseId: movement.expenseId,
      collectionId: movement.collectionId,
    })),
  };
}

export async function createManualMovement(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateManualMovementInput,
) {
  const account = await prisma.account.findUnique({
    where: { id: input.accountId },
  });
  if (!account) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

  return prisma.cashMovement.create({
    data: {
      accountId: input.accountId,
      type: input.direction === "in" ? "manual_in" : "manual_out",
      amountKurus: input.amountKurus,
      date: dateOnlyToDate(input.date),
      description: input.description,
    },
  });
}

export async function createTransfer(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateTransferInput,
) {
  if (input.fromAccountId === input.toAccountId) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Kaynak ve hedef hesap aynı olamaz",
    );
  }

  const accounts = await prisma.account.findMany({
    where: { id: { in: [input.fromAccountId, input.toAccountId] } },
  });
  if (accounts.length !== 2) {
    throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");
  }

  const transferGroupId = crypto.randomUUID();

  return prisma.$transaction(async (tx) => {
    const out = await tx.cashMovement.create({
      data: {
        accountId: input.fromAccountId,
        type: "transfer_out",
        amountKurus: input.amountKurus,
        date: dateOnlyToDate(input.date),
        description: input.description,
        transferGroupId,
      },
    });
    const inMovement = await tx.cashMovement.create({
      data: {
        accountId: input.toAccountId,
        type: "transfer_in",
        amountKurus: input.amountKurus,
        date: dateOnlyToDate(input.date),
        description: input.description,
        transferGroupId,
      },
    });
    return [out, inMovement];
  });
}
