import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { deleteRevenue, updateRevenue } from "@/server/services/revenues";
import {
  dateOnlySchema,
  kurusSchema,
  parseBody,
  parseId,
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

const updateSchema = z.object({
  date: dateOnlySchema.optional(),
  amountKurus: kurusSchema.optional(),
  description: z.string().trim().optional(),
  method: methodSchema.optional(),
  paid: z.boolean().optional(),
  customerId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(updateSchema, await readJson(req));
    const revenue = await updateRevenue(prisma, defaultCtx, parseId(id), body);
    return ok(revenue);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteRevenue(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
