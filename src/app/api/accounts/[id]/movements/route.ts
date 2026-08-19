import { defaultCtx } from "@/server/ctx";
import { prisma } from "@/server/db";
import { handleApiError, okList } from "@/server/http";
import { listMovements } from "@/server/services/accounts";
import {
  dateOnlySchema,
  paginationSchema,
  parseId,
  parseQuery,
} from "@/server/validation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const listSchema = paginationSchema.extend({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const query = parseQuery(listSchema, req.nextUrl.searchParams);
    const result = await listMovements(prisma, defaultCtx, parseId(id), query);
    return okList(result.data, {
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
