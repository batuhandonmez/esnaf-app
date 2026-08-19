import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import {
  createCollection,
  listCollections,
} from "@/server/services/receivables";
import { dateOnlySchema, kurusSchema, parseBody, parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const methodSchema = z.enum([
  "cash",
  "bank_card",
  "credit_card",
  "bank_transfer",
  "other",
]);

const createSchema = z.object({
  amountKurus: kurusSchema,
  date: dateOnlySchema,
  method: methodSchema.optional(),
  accountId: z.string().min(1, "Hesap zorunludur"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const collections = await listCollections(prisma, defaultCtx, parseId(id));
    return ok(collections);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = parseBody(createSchema, await readJson(req));
    const result = await createCollection(prisma, defaultCtx, parseId(id), body);
    return ok({
      collection: result.collection,
      movement: result.movement,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
