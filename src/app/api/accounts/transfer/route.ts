import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { createTransfer } from "@/server/services/accounts";
import { dateOnlySchema, kurusSchema, parseBody } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  fromAccountId: z.string().min(1, "Kaynak hesap zorunludur"),
  toAccountId: z.string().min(1, "Hedef hesap zorunludur"),
  amountKurus: kurusSchema,
  date: dateOnlySchema,
  description: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(createSchema, await readJson(req));
    const movements = await createTransfer(prisma, defaultCtx, body);
    return ok({ movements });
  } catch (err) {
    return handleApiError(err);
  }
}
