import {
  createCustomer,
  listCustomers,
} from "@/server/services/customers";
import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { paginationSchema, parseBody, parseQuery } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({
  q: z.string().trim().optional(),
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Ad zorunludur"),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listCustomers(prisma, defaultCtx, query);
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
    const customer = await createCustomer(prisma, defaultCtx, body);
    return ok(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
