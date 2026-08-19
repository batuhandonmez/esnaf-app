import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { createQuote, listQuotes } from "@/server/services/quotes";
import {
  dateOnlySchema,
  kurusSchema,
  paginationSchema,
  parseBody,
  parseQuery,
} from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).optional(),
  customerId: z.string().min(1).optional(),
});

const itemSchema = z.object({
  name: z.string().trim().min(1, "Kalem adÄ± zorunludur"),
  unit: z.string().trim().optional(),
  quantity: z
    .number("Adet sayÄ± olmalÄ±")
    .positive("Adet 0'dan bÃ¼yÃ¼k olmalÄ±")
    .max(9999.99, "Adet Ã§ok bÃ¼yÃ¼k"),
  unitPriceKurus: kurusSchema,
});

const createSchema = z.object({
  customerId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "BaÅŸlÄ±k zorunludur"),
  validUntil: dateOnlySchema.optional(),
  notes: z.string().trim().optional(),
  items: z.array(itemSchema).min(1, "Teklif en az bir kalem iÃ§ermelidir"),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listQuotes(prisma, defaultCtx, query);
    return okList(result.data, {
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(createSchema, await readJson(req));
    const quote = await createQuote(prisma, defaultCtx, body);
    return ok(quote);
  } catch (err) {
    return handleApiError(err);
  }
}
