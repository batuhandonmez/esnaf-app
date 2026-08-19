import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { deleteExpense, updateExpense } from "@/server/services/expenses";
import {
  dateOnlySchema,
  kurusSchema,
  parseBody,
  parseId,
} from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  date: dateOnlySchema.optional(),
  amountKurus: kurusSchema.optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().trim().optional(),
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
    const expense = await updateExpense(prisma, defaultCtx, parseId(id), body);
    return ok(expense);
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
    await deleteExpense(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
