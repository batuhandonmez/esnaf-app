import type { PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";

export interface CreateServiceItemInput {
  name: string;
  description?: string;
  unit?: string;
  unitPriceKurus: number;
  sortOrder?: number;
}

export interface UpdateServiceItemInput {
  name?: string;
  description?: string;
  unit?: string;
  unitPriceKurus?: number;
  sortOrder?: number;
}

export async function listServiceItems(prisma: PrismaClient, _ctx: Ctx) {
  return prisma.serviceItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createServiceItem(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateServiceItemInput,
) {
  return prisma.serviceItem.create({ data: input });
}

export async function updateServiceItem(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateServiceItemInput,
) {
  return prisma.serviceItem.update({ where: { id }, data: input });
}

export async function deleteServiceItem(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
) {
  await prisma.serviceItem.delete({ where: { id } });
}
