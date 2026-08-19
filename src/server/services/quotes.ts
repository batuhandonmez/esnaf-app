import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { dateOnlyToDate } from "@/server/dates";
import { canTransitionQuote } from "@/server/domain";
import { ensureCustomer } from "@/server/guards";
import { computeQuoteTotalKurus } from "@/server/money";
import { ApiError } from "@/server/http";

export interface QuoteItemInput {
  name: string;
  unit?: string;
  quantity: number;
  unitPriceKurus: number;
}

export interface ListQuotesInput {
  q?: string;
  status?: "draft" | "sent" | "accepted" | "rejected";
  customerId?: string;
  page: number;
  pageSize: number;
}

export interface CreateQuoteInput {
  customerId?: string;
  title: string;
  validUntil?: string;
  notes?: string;
  items: QuoteItemInput[];
}

export interface UpdateQuoteInput {
  customerId?: string;
  title?: string;
  validUntil?: string | null;
  notes?: string;
  status?: "draft" | "sent" | "accepted" | "rejected";
  items?: QuoteItemInput[];
}

function mapQuote(quote: {
  id: string;
  customerId: string | null;
  customer: { name: string } | null;
  jobId: string | null;
  title: string;
  status: string;
  validUntil: Date | null;
  notes: string | null;
  createdAt: Date;
  items: { id: string; name: string; unit: string | null; quantity: unknown; unitPriceKurus: number; sortOrder: number }[];
}) {
  const items = quote.items.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPriceKurus: item.unitPriceKurus,
    sortOrder: item.sortOrder,
  }));
  const totalKurus = computeQuoteTotalKurus(items);
  return {
    id: quote.id,
    customerId: quote.customerId,
    customerName: quote.customer?.name ?? null,
    jobId: quote.jobId,
    title: quote.title,
    status: quote.status,
    validUntil: quote.validUntil,
    notes: quote.notes,
    createdAt: quote.createdAt,
    items,
    totalKurus,
  };
}

const QUOTE_INCLUDE = {
  customer: true,
  items: { orderBy: { sortOrder: "asc" as const } },
} as const;

export async function listQuotes(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: ListQuotesInput,
) {
  const where: Prisma.QuoteWhereInput = {
    ...(input.q
      ? { title: { contains: input.q, mode: "insensitive" as const } }
      : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };

  const [total, quotes] = await prisma.$transaction([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: QUOTE_INCLUDE,
    }),
  ]);

  return { total, data: quotes.map(mapQuote) };
}

export async function createQuote(
  prisma: PrismaClient,
  _ctx: Ctx,
  input: CreateQuoteInput,
) {
  if (input.items.length === 0) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Teklif en az bir kalem içermelidir",
    );
  }

  await ensureCustomer(prisma, input.customerId);

  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        customerId: input.customerId,
        title: input.title,
        validUntil: input.validUntil ? dateOnlyToDate(input.validUntil) : undefined,
        notes: input.notes,
      },
    });

    await tx.quoteItem.createMany({
      data: input.items.map((item, index) => ({
        quoteId: quote.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPriceKurus: item.unitPriceKurus,
        sortOrder: index,
      })),
    });

    const created = await tx.quote.findUniqueOrThrow({
      where: { id: quote.id },
      include: QUOTE_INCLUDE,
    });
    return mapQuote(created);
  });
}

export async function getQuote(prisma: PrismaClient, _ctx: Ctx, id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: QUOTE_INCLUDE,
  });
  if (!quote) return null;
  return mapQuote(quote);
}

export async function updateQuote(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: UpdateQuoteInput,
) {
  if (input.customerId !== undefined) {
    await ensureCustomer(prisma, input.customerId);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.quote.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    if (
      existing.status === "accepted" ||
      existing.status === "rejected"
    ) {
      throw new ApiError(
        409,
        "CONFLICT",
        "Kabul edilmiş veya reddedilmiş teklif düzenlenemez",
      );
    }

    if (input.status !== undefined && input.status !== existing.status) {
      if (!canTransitionQuote(existing.status, input.status)) {
        throw new ApiError(
          409,
          "INVALID_TRANSITION",
          "Geçersiz durum geçişi",
        );
      }
    }

    if (input.items !== undefined) {
      if (input.items.length === 0) {
        throw new ApiError(
          422,
          "VALIDATION_ERROR",
          "Teklif en az bir kalem içermelidir",
        );
      }
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      await tx.quoteItem.createMany({
        data: input.items.map((item, index) => ({
          quoteId: id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPriceKurus: item.unitPriceKurus,
          sortOrder: index,
        })),
      });
    }

    await tx.quote.update({
      where: { id },
      data: {
        ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.validUntil !== undefined
          ? { validUntil: input.validUntil ? dateOnlyToDate(input.validUntil) : null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    const updated = await tx.quote.findUniqueOrThrow({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    return mapQuote(updated);
  });
}

export async function acceptQuote(
  prisma: PrismaClient,
  _ctx: Ctx,
  id: string,
  input: { createJob?: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    if (!quote) throw new ApiError(404, "NOT_FOUND", "Kayıt bulunamadı");

    if (quote.status === "rejected") {
      throw new ApiError(409, "CONFLICT", "Reddedilen teklif kabul edilemez");
    }

    const mapped = mapQuote(quote);
    const createJob = input.createJob ?? false;

    if (quote.status !== "accepted") {
      await tx.quote.update({
        where: { id },
        data: { status: "accepted" },
      });
    }

    let job = null;
    if (createJob) {
      if (quote.jobId) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Bu tekliften zaten iş oluşturuldu",
        );
      }

      const description = mapped.items
        .map(
          (item) =>
            `${item.name}${item.unit ? ` (${item.unit})` : ""} ×${item.quantity}`,
        )
        .join("\n");

      job = await tx.job.create({
        data: {
          customerId: quote.customerId,
          title: quote.title,
          description: description || undefined,
          priceKurus: mapped.totalKurus,
        },
      });

      await tx.quote.update({
        where: { id },
        data: { jobId: job.id },
      });
    }

    const updated = await tx.quote.findUniqueOrThrow({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    return { quote: mapQuote(updated), job };
  });
}

export async function deleteQuote(prisma: PrismaClient, _ctx: Ctx, id: string) {
  await prisma.quote.delete({ where: { id } });
}
