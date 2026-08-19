import type { PrismaClient } from "@/generated/prisma/client";
import { ApiError } from "@/server/http";

export async function ensureFound(
  finder: () => Promise<unknown>,
  label: string,
): Promise<void> {
  const record = await finder();
  if (!record) {
    throw new ApiError(404, "NOT_FOUND", `${label} bulunamadı`);
  }
}

export function ensureCustomer(
  prisma: PrismaClient,
  id: string | undefined,
): Promise<void> {
  if (id === undefined) return Promise.resolve();
  return ensureFound(
    () => prisma.customer.findUnique({ where: { id }, select: { id: true } }),
    "Müşteri",
  );
}

export function ensureAccount(
  prisma: PrismaClient,
  id: string | undefined,
): Promise<void> {
  if (id === undefined) return Promise.resolve();
  return ensureFound(
    () => prisma.account.findUnique({ where: { id }, select: { id: true } }),
    "Hesap",
  );
}

export function ensureCategory(
  prisma: PrismaClient,
  id: string | undefined,
): Promise<void> {
  if (id === undefined) return Promise.resolve();
  return ensureFound(
    () =>
      prisma.expenseCategory.findUnique({
        where: { id },
        select: { id: true },
      }),
    "Kategori",
  );
}

export function ensureJob(
  prisma: PrismaClient,
  id: string | undefined,
): Promise<void> {
  if (id === undefined) return Promise.resolve();
  return ensureFound(
    () => prisma.job.findUnique({ where: { id }, select: { id: true } }),
    "İş",
  );
}
