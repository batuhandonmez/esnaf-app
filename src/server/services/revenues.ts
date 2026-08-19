import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { dateOnlyToDate } from "@/server/dates";
import { ensureAccount, ensureCustomer, ensureJob } from "@/server/guards";
import { ApiError } from "@/server/http";

export interface ListRevenuesInput {
  from?: string;
  to?: string;
  customerId?: string;
  jobId?: string;
  accountId?: string;
  page: number;
  pageSize: number;
}

export interface CreateRevenueInput {
  date: string;
  amountKurus: number;
  description?: string;
  method?: "cash" | "bank_card" | "credit_card" | "bank_transfer" | "other";
  paid?: boolean;
  customerId?: string;
  jobId?: string;
  accountId?: string;
}

export interface UpdateRevenueInput {
  date?: string;
  amountKurus?: number;
  description?: string;
  method?: "cash" | "bank_card" | "credit_card" | "bank_transfer" | "other";
  paid?: boolean;
  customerId?: string;
  jobId?: string;
  accountId?: string;
}

export async function listRevenues(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListRevenuesInput,
) {
  const where: Prisma.RevenueWhereInput = {
    ...(input.from || input.to
      ? {
          date: {
            ...(input.from ? { gte: dateOnlyToDate(input.from) } : {}),
            ...(input.to ? { lte: dateOnlyToDate(input.to) } : {}),
          },
        }
      : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.jobId ? { jobId: input.jobId } : {}),
    ...(input.accountId ? { accountId: input.accountId } : {}),
  };

  const [total, revenues] = await prisma.$transaction([
    prisma.revenue.count({ where }),
    prisma.revenue.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { customer: true, job: true, account: true },
    }),
  ]);

  return {
    total,
    data: revenues.map((revenue) => ({
      id: revenue.id,
      date: revenue.date,
      amountKurus: revenue.amountKurus,
      description: revenue.description,
      method: revenue.method,
      paid: revenue.paid,
      customerId: revenue.customerId,
      customerName: revenue.customer?.name ?? null,
      jobId: revenue.jobId,
      jobTitle: revenue.job?.title ?? null,
      accountId: revenue.accountId,
      accountName: revenue.account?.name ?? null,
    })),
  };
}

export async function createRevenue(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateRevenueInput,
) {
  const paid = input.paid ?? true;

  if (!paid && !input.customerId) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Veresiye gelir için müşteri zorunludur",
      { customerId: "Veresiye gelir için müşteri zorunludur" },
    );
  }

  await ensureCustomer(prisma, input.customerId);
  await ensureJob(prisma, input.jobId);
  if (paid) {
    await ensureAccount(prisma, input.accountId);
  }

  return prisma.$transaction(async (tx) => {
    const revenue = await tx.revenue.create({
      data: {
        date: dateOnlyToDate(input.date),
        amountKurus: input.amountKurus,
        description: input.description,
        method: input.method,
        paid,
        customerId: input.customerId,
        jobId: input.jobId,
        accountId: paid ? input.accountId : null,
      },
    });

    if (paid && input.accountId) {
      await tx.cashMovement.create({
        data: {
          accountId: input.accountId,
          type: "income",
          amountKurus: input.amountKurus,
          date: dateOnlyToDate(input.date),
          description: input.description,
          revenueId: revenue.id,
        },
      });
    }

    if (!paid) {
      await tx.receivable.create({
        data: {
          customerId: input.customerId as string,
          description: input.description ?? "Veresiye gelir",
          totalKurus: input.amountKurus,
          source: input.jobId ? "job" : "manual",
          jobId: input.jobId,
          revenueId: revenue.id,
        },
      });
    }

    return revenue;
  });
}

export async function updateRevenue(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateRevenueInput,
) {
  if (input.customerId !== undefined) {
    await ensureCustomer(prisma, input.customerId);
  }
  if (input.jobId !== undefined) {
    await ensureJob(prisma, input.jobId);
  }
  if (input.accountId !== undefined) {
    await ensureAccount(prisma, input.accountId);
  }

  return prisma.$transaction(async (tx) => {
    const revenue = await tx.revenue.findUnique({
      where: { id },
      include: { movement: true, receivable: { include: { collections: true } } },
    });
    if (!revenue) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    const nextPaid = input.paid ?? revenue.paid;
    const nextAmount = input.amountKurus ?? revenue.amountKurus;
    const nextDate = input.date ?? dateToApi(revenue.date);
    const nextAccountId =
      input.accountId !== undefined ? input.accountId : revenue.accountId;
    const nextCustomerId =
      input.customerId !== undefined ? input.customerId : revenue.customerId;

    if (!nextPaid && !nextCustomerId) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        "Veresiye gelir için müşteri zorunludur",
      );
    }

    if (revenue.paid && !nextPaid) {
      if (revenue.movement) {
        await tx.cashMovement.delete({ where: { id: revenue.movement.id } });
      }
      await tx.receivable.create({
        data: {
          customerId: nextCustomerId as string,
          description: input.description ?? revenue.description ?? "Veresiye gelir",
          totalKurus: nextAmount,
          source: (input.jobId ?? revenue.jobId) ? "job" : "manual",
          jobId: input.jobId ?? revenue.jobId,
          revenueId: revenue.id,
        },
      });
    } else if (!revenue.paid && nextPaid) {
      const receivable = revenue.receivable;
      if (receivable && receivable.collections.length > 0) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Tahsilat yapılmış alacağı olan gelir ödeme durumunu değiştiremezsiniz",
        );
      }
      if (receivable) {
        await tx.receivable.delete({ where: { id: receivable.id } });
      }
      if (nextAccountId) {
        await tx.cashMovement.create({
          data: {
            accountId: nextAccountId,
            type: "income",
            amountKurus: nextAmount,
            date: dateOnlyToDate(nextDate),
            description: input.description ?? revenue.description,
            revenueId: revenue.id,
          },
        });
      }
    } else if (revenue.paid && nextPaid) {
      if (revenue.movement) {
        if (nextAccountId) {
          await tx.cashMovement.update({
            where: { id: revenue.movement.id },
            data: {
              accountId: nextAccountId,
              amountKurus: nextAmount,
              date: dateOnlyToDate(nextDate),
              description: input.description ?? revenue.description,
            },
          });
        } else {
          await tx.cashMovement.delete({ where: { id: revenue.movement.id } });
        }
      } else if (nextAccountId) {
        await tx.cashMovement.create({
          data: {
            accountId: nextAccountId,
            type: "income",
            amountKurus: nextAmount,
            date: dateOnlyToDate(nextDate),
            description: input.description ?? revenue.description,
            revenueId: revenue.id,
          },
        });
      }
    } else {
      const receivable = revenue.receivable;
      if (receivable) {
        const paidSoFar = receivable.collections.reduce(
          (sum, collection) => sum + collection.amountKurus,
          0,
        );
        if (nextAmount < paidSoFar) {
          throw new ApiError(
            409,
            "CONFLICT",
            "Gelir tutarı yapılan tahsilatların toplamından küçük olamaz",
          );
        }
        await tx.receivable.update({
          where: { id: receivable.id },
          data: {
            customerId: nextCustomerId as string,
            totalKurus: nextAmount,
            description: input.description ?? receivable.description,
            jobId: input.jobId ?? revenue.jobId,
            source: (input.jobId ?? revenue.jobId) ? "job" : "manual",
          },
        });
      }
    }

    return tx.revenue.update({
      where: { id },
      data: {
        ...(input.date !== undefined ? { date: dateOnlyToDate(input.date) } : {}),
        ...(input.amountKurus !== undefined
          ? { amountKurus: input.amountKurus }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.paid !== undefined ? { paid: input.paid } : {}),
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      },
    });
  });
}

export async function deleteRevenue(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  await prisma.$transaction(async (tx) => {
    const revenue = await tx.revenue.findUnique({
      where: { id },
      include: { movement: true, receivable: { include: { collections: true } } },
    });
    if (!revenue) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    if (revenue.receivable) {
      if (revenue.receivable.collections.length > 0) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Tahsilat yapılmış alacağı olan gelir silinemez; önce tahsilatları silin",
        );
      }
      await tx.receivable.delete({ where: { id: revenue.receivable.id } });
    }

    if (revenue.movement) {
      await tx.cashMovement.delete({ where: { id: revenue.movement.id } });
    }

    await tx.revenue.delete({ where: { id } });
  });
}

function dateToApi(date: Date): string {
  return date.toISOString().slice(0, 10);
}
