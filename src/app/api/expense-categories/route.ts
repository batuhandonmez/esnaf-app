import { prisma } from "@/server/db";
import { handleApiError, ok } from "@/server/http";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return ok(categories);
  } catch (err) {
    return handleApiError(err);
  }
}
