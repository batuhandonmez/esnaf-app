import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok } from "@/server/http";
import { deleteCollection } from "@/server/services/receivables";
import { parseId } from "@/server/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteCollection(prisma, defaultCtx, parseId(id));
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
