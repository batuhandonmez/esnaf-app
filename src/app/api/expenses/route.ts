import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { createExpense, listExpenses } from "@/server/services/expenses";
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
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  categoryId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
});

const createSchema = z.object({
  date: dateOnlySchema,
  amountKurus: kurusSchema,
  categoryId: z.string().min(1, "Kategori zorunludur"),
  description: z.string().trim().optional(),
  jobId: z.string().min(1).optional(),
  accountId: z.string().min(1, "Hesap zorunludur"),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listExpenses(prisma, defaultCtx, query);
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
    const expense = await createExpense(prisma, defaultCtx, body);
    return ok(expense);
  } catch (err) {
    return handleApiError(err);
  }
}
