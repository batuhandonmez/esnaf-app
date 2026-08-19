import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import {
  createServiceItem,
  listServiceItems,
} from "@/server/services/service-items";
import { kurusSchema, parseBody } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ad zorunludur"),
  description: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  unitPriceKurus: kurusSchema,
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const items = await listServiceItems(prisma, defaultCtx);
    return ok(items);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(createSchema, await readJson(req));
    const item = await createServiceItem(prisma, defaultCtx, body);
    return ok(item);
  } catch (err) {
    return handleApiError(err);
  }
}
