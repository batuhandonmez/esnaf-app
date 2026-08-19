import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, ok } from "@/server/http";
import { getTodaySummary } from "@/server/services/summary";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const summary = await getTodaySummary(prisma, defaultCtx);
    return ok(summary);
  } catch (err) {
    return handleApiError(err);
  }
}
