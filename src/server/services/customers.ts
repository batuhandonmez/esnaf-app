import type { PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";

export interface ListCustomersInput {
  q?: string;
  page: number;
  pageSize: number;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  notes?: string;
}

export async function listCustomers(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListCustomersInput,
) {
  const where = input.q
    ? {
        OR: [
          { name: { contains: input.q, mode: "insensitive" as const } },
          { phone: { contains: input.q } },
        ],
      }
    : {};

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { receivables: { include: { collections: true } } },
    }),
  ]);

  return {
    total,
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
      receivableTotalKurus: customer.receivables.reduce(
        (sum, receivable) =>
          sum +
          receivable.totalKurus -
          receivable.collections.reduce(
            (paid, collection) => paid + collection.amountKurus,
            0,
          ),
        0,
      ),
    })),
  };
}

export async function createCustomer(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateCustomerInput,
) {
  return prisma.customer.create({ data: input });
}

export async function getCustomer(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      receivables: { include: { collections: true } },
      jobs: {
        orderBy: [{ scheduledOn: "desc" }, { startTime: "desc" }],
        take: 5,
      },
    },
  });
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    receivableTotalKurus: customer.receivables.reduce(
      (sum, receivable) =>
        sum +
        receivable.totalKurus -
        receivable.collections.reduce(
          (paid, collection) => paid + collection.amountKurus,
          0,
        ),
      0,
    ),
    recentJobs: customer.jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      scheduledOn: job.scheduledOn,
      startTime: job.startTime,
    })),
  };
}

export async function updateCustomer(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateCustomerInput,
) {
  return prisma.customer.update({ where: { id }, data: input });
}
