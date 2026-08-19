import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import {
  deleteServiceItem,
  updateServiceItem,
} from "@/server/services/service-items";
import { kurusSchema, parseBody, parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Ad boÅŸ olamaz").optional(),
  description: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  unitPriceKurus: kurusSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(updateSchema, await readJson(req));
    const item = await updateServiceItem(prisma, defaultCtx, parseId(id), body);
    return ok(item);
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
    await deleteServiceItem(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
