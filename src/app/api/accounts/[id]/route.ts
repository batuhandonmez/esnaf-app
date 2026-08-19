import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { updateAccount } from "@/server/services/accounts";
import { parseBody, parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Ad boÅŸ olamaz").optional(),
  type: z.enum(["cash", "bank"]).optional(),
  openingBalanceKurus: z
    .number("AÃ§Ä±lÄ±ÅŸ bakiyesi sayÄ± olmalÄ±")
    .int("AÃ§Ä±lÄ±ÅŸ bakiyesi kuruÅŸ cinsinden tamsayÄ± olmalÄ±")
    .min(0, "AÃ§Ä±lÄ±ÅŸ bakiyesi negatif olamaz")
    .max(2_147_483_647, "Tutar Ã§ok bÃ¼yÃ¼k")
    .optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(updateSchema, await readJson(req));
    const account = await updateAccount(prisma, defaultCtx, parseId(id), body);
    return ok(account);
  } catch (err) {
    return handleApiError(err);
  }
}
