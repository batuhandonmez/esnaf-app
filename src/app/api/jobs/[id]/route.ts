import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { deleteJob, getJob, updateJob } from "@/server/services/jobs";
import {
  dateOnlySchema,
  optionalKurusSchema,
  parseBody,
  parseId,
  timeSchema,
} from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  customerId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "BaÅŸlÄ±k boÅŸ olamaz").optional(),
  description: z.string().trim().optional(),
  priceKurus: optionalKurusSchema,
  scheduledOn: dateOnlySchema.nullable().optional(),
  startTime: timeSchema.nullable().optional(),
  status: z.enum(["planned", "pending", "completed"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await getJob(prisma, defaultCtx, parseId(id));
    if (!job) return handleApiError({ code: "P2025" });
    return ok(job);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(updateSchema, await readJson(req));
    const job = await updateJob(prisma, defaultCtx, parseId(id), body);
    return ok(job);
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
    await deleteJob(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
