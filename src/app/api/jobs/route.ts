import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, okList, readJson } from "@/server/http";
import { createJob, listJobs } from "@/server/services/jobs";
import {
  dateOnlySchema,
  optionalKurusSchema,
  paginationSchema,
  parseBody,
  parseQuery,
  timeSchema,
} from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.enum(["planned", "pending", "completed"]);

const listSchema = paginationSchema.extend({
  date: dateOnlySchema.optional(),
  status: statusSchema.optional(),
  customerId: z.string().min(1).optional(),
});

const createSchema = z.object({
  customerId: z.string().min(1, "MÃ¼ÅŸteri zorunludur"),
  title: z.string().trim().min(1, "BaÅŸlÄ±k zorunludur"),
  description: z.string().trim().optional(),
  priceKurus: optionalKurusSchema,
  scheduledOn: dateOnlySchema.optional(),
  startTime: timeSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listJobs(prisma, defaultCtx, query);
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
    const job = await createJob(prisma, defaultCtx, body);
    return ok(job);
  } catch (err) {
    return handleApiError(err);
  }
}
