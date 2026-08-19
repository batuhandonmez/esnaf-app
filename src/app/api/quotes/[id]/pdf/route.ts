import { parseId } from "@/server/validation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    parseId(id);
    return NextResponse.json(
      {
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Teklif PDF'i sonraki aÅŸamada Ã¼retilecek",
        },
      },
      { status: 501 },
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Teklif PDF'i sonraki aÅŸamada Ã¼retilecek",
        },
      },
      { status: 501 },
    );
  }
}
