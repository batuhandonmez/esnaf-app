import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { deleteQuote, getQuote, updateQuote } from "@/server/services/quotes";
import {
  dateOnlySchema,
  kurusSchema,
  parseBody,
  parseId,
} from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Kalem adÄ± zorunludur"),
  unit: z.string().trim().optional(),
  quantity: z
    .number("Adet sayÄ± olmalÄ±")
    .positive("Adet 0'dan bÃ¼yÃ¼k olmalÄ±")
    .max(9999.99, "Adet Ã§ok bÃ¼yÃ¼k"),
  unitPriceKurus: kurusSchema,
});

const updateSchema = z.object({
  customerId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "BaÅŸlÄ±k boÅŸ olamaz").optional(),
  validUntil: dateOnlySchema.nullable().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).optional(),
  items: z.array(itemSchema).min(1, "Teklif en az bir kalem iÃ§ermelidir").optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const quote = await getQuote(prisma, defaultCtx, parseId(id));
    if (!quote) return handleApiError({ code: "P2025" });
    return ok(quote);
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
    const quote = await updateQuote(prisma, defaultCtx, parseId(id), body);
    return ok(quote);
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
    await deleteQuote(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
