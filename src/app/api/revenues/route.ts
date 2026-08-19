import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { createRevenue, listRevenues } from "@/server/services/revenues";
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

const methodSchema = z.enum([
  "cash",
  "bank_card",
  "credit_card",
  "bank_transfer",
  "other",
]);

const listSchema = paginationSchema.extend({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  customerId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
});

const createSchema = z.object({
  date: dateOnlySchema,
  amountKurus: kurusSchema,
  description: z.string().trim().optional(),
  method: methodSchema.optional(),
  paid: z.boolean().optional(),
  customerId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listRevenues(prisma, defaultCtx, query);
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
    const revenue = await createRevenue(prisma, defaultCtx, body);
    return ok(revenue);
  } catch (err) {
    return handleApiError(err);
  }
}
