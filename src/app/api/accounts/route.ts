import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { createAccount, listAccounts } from "@/server/services/accounts";
import { parseBody } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ad zorunludur"),
  type: z.enum(["cash", "bank"]),
  openingBalanceKurus: z
    .number("AÃ§Ä±lÄ±ÅŸ bakiyesi sayÄ± olmalÄ±")
    .int("AÃ§Ä±lÄ±ÅŸ bakiyesi kuruÅŸ cinsinden tamsayÄ± olmalÄ±")
    .min(0, "AÃ§Ä±lÄ±ÅŸ bakiyesi negatif olamaz")
    .max(2_147_483_647, "Tutar Ã§ok bÃ¼yÃ¼k")
    .optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const accounts = await listAccounts(prisma, defaultCtx);
    return ok(accounts);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(createSchema, await readJson(req));
    const account = await createAccount(prisma, defaultCtx, body);
    return ok(account);
  } catch (err) {
    return handleApiError(err);
  }
}
