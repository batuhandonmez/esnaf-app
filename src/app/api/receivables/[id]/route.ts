import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import {
  deleteReceivable,
  updateReceivable,
} from "@/server/services/receivables";
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
  description: z.string().trim().min(1, "AÃ§Ä±klama boÅŸ olamaz").optional(),
  totalKurus: kurusSchema.optional(),
  dueDate: dateOnlySchema.nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(updateSchema, await readJson(req));
    const receivable = await updateReceivable(
      prisma,
      defaultCtx,
      parseId(id),
      body,
    );
    return ok(receivable);
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
    await deleteReceivable(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
