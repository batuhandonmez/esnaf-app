import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok, readJson } from "@/server/http";
import { getCustomer, updateCustomer } from "@/server/services/customers";
import { parseBody, parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Ad boÅŸ olamaz").optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customer = await getCustomer(prisma, defaultCtx, parseId(id));
    if (!customer) {
      return handleApiError({ code: "P2025" });
    }
    return ok(customer);
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
    const customer = await updateCustomer(
      prisma,
      defaultCtx,
      parseId(id),
      body,
    );
    return ok(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
