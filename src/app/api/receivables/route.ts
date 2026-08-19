import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { createReceivable, listReceivables } from "@/server/services/receivables";
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
  customerId: z.string().min(1).optional(),
  overdue: z.coerce.boolean().optional(),
});

const createSchema = z.object({
  customerId: z.string().min(1, "MÃ¼ÅŸteri zorunludur"),
  description: z.string().trim().min(1, "AÃ§Ä±klama zorunludur"),
  totalKurus: kurusSchema,
  dueDate: dateOnlySchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listReceivables(prisma, defaultCtx, query);
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
    const receivable = await createReceivable(prisma, defaultCtx, body);
    return ok(receivable);
  } catch (err) {
    return handleApiError(err);
  }
}
