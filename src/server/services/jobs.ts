import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { todayIstanbul, dateOnlyToDate } from "@/server/dates";
import { computeProfitKurus } from "@/server/domain";
import { ensureCustomer } from "@/server/guards";

export interface ListJobsInput {
  date?: string;
  status?: "planned" | "pending" | "completed";
  customerId?: string;
  page: number;
  pageSize: number;
}

export interface CreateJobInput {
  customerId: string;
  title: string;
  description?: string;
  priceKurus?: number;
  scheduledOn?: string;
  startTime?: string;
}

export interface UpdateJobInput {
  customerId?: string;
  title?: string;
  description?: string;
  priceKurus?: number;
  scheduledOn?: string | null;
  startTime?: string | null;
  status?: "planned" | "pending" | "completed";
}

export async function listJobs(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListJobsInput,
) {
  const where = {
    ...(input.date ? { scheduledOn: dateOnlyToDate(input.date) } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };

  const [total, jobs] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: [{ scheduledOn: "asc" }, { startTime: "asc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { customer: true },
    }),
  ]);

  return {
    total,
    data: jobs.map((job) => ({
      id: job.id,
      customerId: job.customerId,
      customerName: job.customer?.name ?? null,
      title: job.title,
      description: job.description,
      status: job.status,
      priceKurus: job.priceKurus,
      scheduledOn: job.scheduledOn,
      startTime: job.startTime,
      completedOn: job.completedOn,
    })),
  };
}

export async function createJob(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateJobInput,
) {
  await ensureCustomer(prisma, input.customerId);

  return prisma.job.create({
    data: {
      customerId: input.customerId,
      title: input.title,
      description: input.description,
      priceKurus: input.priceKurus,
      scheduledOn: input.scheduledOn ? dateOnlyToDate(input.scheduledOn) : undefined,
      startTime: input.startTime,
    },
  });
}

export async function getJob(prisma: PrismaClient, _ctx: Ctx, id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!job) return null;

  const [revenueAgg, expenseAgg] = await prisma.$transaction([
    prisma.revenue.aggregate({
      where: { jobId: id },
      _sum: { amountKurus: true },
    }),
    prisma.expense.aggregate({
      where: { jobId: id },
      _sum: { amountKurus: true },
    }),
  ]);

  const revenueTotalKurus = revenueAgg._sum.amountKurus ?? 0;
  const expenseTotalKurus = expenseAgg._sum.amountKurus ?? 0;

  return {
    id: job.id,
    customerId: job.customerId,
    customerName: job.customer?.name ?? null,
    title: job.title,
    description: job.description,
    status: job.status,
    priceKurus: job.priceKurus,
    scheduledOn: job.scheduledOn,
    startTime: job.startTime,
    completedOn: job.completedOn,
    summary: {
      revenueTotalKurus,
      expenseTotalKurus,
      profitKurus: computeProfitKurus(revenueTotalKurus, expenseTotalKurus),
    },
  };
}

export async function updateJob(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateJobInput,
) {
  if (input.customerId !== undefined) {
    await ensureCustomer(prisma, input.customerId);
  }

  const completedOn =
    input.status === "completed"
      ? dateOnlyToDate(todayIstanbul())
      : input.status
        ? null
        : undefined;

  const data: Prisma.JobUpdateInput = {
    ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.priceKurus !== undefined ? { priceKurus: input.priceKurus } : {}),
    ...(input.scheduledOn !== undefined
      ? { scheduledOn: input.scheduledOn ? dateOnlyToDate(input.scheduledOn) : null }
      : {}),
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(completedOn !== undefined ? { completedOn } : {}),
  };

  return prisma.job.update({ where: { id }, data });
}

export async function deleteJob(prisma: PrismaClient, _ctx: Ctx, id: string) {
  await prisma.job.delete({ where: { id } });
}
