import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { todayIstanbul, dateOnlyToDate } from "@/server/dates";
import { computeReceivable } from "@/server/domain";
import { ApiError } from "@/server/http";

export interface ListReceivablesInput {
  customerId?: string;
  overdue?: boolean;
  page: number;
  pageSize: number;
}

export interface CreateReceivableInput {
  customerId: string;
  description: string;
  totalKurus: number;
  dueDate?: string;
}

export interface UpdateReceivableInput {
  description?: string;
  totalKurus?: number;
  dueDate?: string | null;
}

export interface CreateCollectionInput {
  amountKurus: number;
  date: string;
  method?: "cash" | "bank_card" | "credit_card" | "bank_transfer" | "other";
  accountId: string;
}

export type ReceivableStatus = "open" | "paid" | "overdue";

export async function listReceivables(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListReceivablesInput,
) {
  const today = todayIstanbul();
  const where: Prisma.ReceivableWhereInput = {
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };

  const receivables = await prisma.receivable.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      collections: { select: { amountKurus: true } },
    },
  });

  let rows = receivables.map((receivable) => {
    const computed = computeReceivable(receivable, today);
    return {
      id: receivable.id,
      customerId: receivable.customerId,
      customerName: receivable.customer.name,
      customerPhone: receivable.customer.phone,
      description: receivable.description,
      totalKurus: receivable.totalKurus,
      dueDate: receivable.dueDate,
      source: receivable.source,
      jobId: receivable.jobId,
      quoteId: receivable.quoteId,
      revenueId: receivable.revenueId,
      paidKurus: computed.paidKurus,
      remainingKurus: computed.remainingKurus,
      status: computed.status,
    };
  });

  if (input.overdue) {
    rows = rows.filter((row) => row.status === "overdue");
  }

  const total = rows.length;
  const start = (input.page - 1) * input.pageSize;
  const data = rows.slice(start, start + input.pageSize);

  return { total, data };
}

export async function createReceivable(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateReceivableInput,
) {
  if (input.dueDate && input.dueDate < todayIstanbul()) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Vade bugünden önceki bir tarih olamaz",
      { dueDate: "Vade bugünden önceki bir tarih olamaz" },
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

  return prisma.receivable.create({
    data: {
      customerId: input.customerId,
      description: input.description,
      totalKurus: input.totalKurus,
      dueDate: input.dueDate ? dateOnlyToDate(input.dueDate) : undefined,
    },
  });
}

export async function updateReceivable(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateReceivableInput,
) {
  if (input.dueDate && input.dueDate < todayIstanbul()) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Vade bugünden önceki bir tarih olamaz",
    );
  }

  if (input.totalKurus !== undefined) {
    const paid = await prisma.collection.aggregate({
      where: { receivableId: id },
      _sum: { amountKurus: true },
    });
    const paidSoFar = paid._sum.amountKurus ?? 0;
    if (input.totalKurus < paidSoFar) {
      throw new ApiError(
        409,
        "CONFLICT",
        "Alacak tutarı yapılan tahsilatların toplamından küçük olamaz",
      );
    }
  }

  return prisma.receivable.update({
    where: { id },
    data: {
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.totalKurus !== undefined ? { totalKurus: input.totalKurus } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? dateOnlyToDate(input.dueDate) : null }
        : {}),
    },
  });
}

export async function deleteReceivable(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  const collections = await prisma.collection.count({ where: { receivableId: id } });
  if (collections > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Tahsilat yapılmış alacak silinemez; önce tahsilatları silin",
    );
  }

  await prisma.receivable.delete({ where: { id } });
}

export async function listCollections(
  prisma: PrismaClient,
  _ctx: Ctx,
  receivableId: string,
) {
  const receivable = await prisma.receivable.findUnique({
    where: { id: receivableId },
  });
  if (!receivable) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

  const collections = await prisma.collection.findMany({
    where: { receivableId },
    orderBy: { date: "desc" },
    include: { account: true },
  });

  return collections.map((collection) => ({
    id: collection.id,
    receivableId: collection.receivableId,
    amountKurus: collection.amountKurus,
    date: collection.date,
    method: collection.method,
    accountId: collection.accountId,
    accountName: collection.account?.name ?? null,
  }));
}

export async function createCollection(
  prisma: PrismaClient,
  _ctx: Ctx,
  receivableId: string,
  input: CreateCollectionInput,
) {
  return prisma.$transaction(async (tx) => {
    const receivable = await tx.receivable.findUnique({
      where: { id: receivableId },
      include: { collections: true },
    });
    if (!receivable) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    const paidSoFar = receivable.collections.reduce(
      (sum, collection) => sum + collection.amountKurus,
      0,
    );
    const remaining = receivable.totalKurus - paidSoFar;
    if (input.amountKurus > remaining) {
      throw new ApiError(
        409,
        "CONFLICT",
        `Tahsilat alacak bakiyesini aşamaz (kalan: ${remaining} kuruş)`,
      );
    }

    const account = await tx.account.findUnique({
      where: { id: input.accountId },
    });
    if (!account) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    const collection = await tx.collection.create({
      data: {
        receivableId,
        amountKurus: input.amountKurus,
        date: dateOnlyToDate(input.date),
        method: input.method,
        accountId: input.accountId,
      },
    });

    const movement = await tx.cashMovement.create({
      data: {
        accountId: input.accountId,
        type: "collection",
        amountKurus: input.amountKurus,
        date: dateOnlyToDate(input.date),
        description: receivable.description,
        collectionId: collection.id,
      },
    });

    return { collection, movement };
  });
}

export async function deleteCollection(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  await prisma.$transaction(async (tx) => {
    const collection = await tx.collection.findUnique({
      where: { id },
      include: { movement: true },
    });
    if (!collection) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    if (collection.movement) {
      await tx.cashMovement.delete({ where: { id: collection.movement.id } });
    }

    await tx.collection.delete({ where: { id } });
  });
}
