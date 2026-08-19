import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { acceptQuote } from "@/server/services/quotes";
import { parseBody, parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  createJob: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(bodySchema, await readJson(req));
    const result = await acceptQuote(prisma, defaultCtx, parseId(id), body);
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
