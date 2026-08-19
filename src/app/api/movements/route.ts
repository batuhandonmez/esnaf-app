import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { createManualMovement } from "@/server/services/accounts";
import { dateOnlySchema, kurusSchema, parseBody } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  accountId: z.string().min(1, "Hesap zorunludur"),
  direction: z.enum(["in", "out"]),
  amountKurus: kurusSchema,
  date: dateOnlySchema,
  description: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(createSchema, await readJson(req));
    const movement = await createManualMovement(prisma, defaultCtx, body);
    return ok(movement);
  } catch (err) {
    return handleApiError(err);
  }
}
