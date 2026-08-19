import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data });
}

export function okList<T>(
  data: T[],
  meta: { total: number; page: number; pageSize: number },
): NextResponse {
  return NextResponse.json({ data, meta });
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "İstek gövdesi geçerli JSON değil");
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
        },
      },
      { status: err.status },
    );
  }

  const code = (err as { code?: string } | null)?.code;
  if (code === "P2025") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Kayıt bulunamadı" } },
      { status: 404 },
    );
  }
  if (code === "P2002" || code === "P2003") {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Kayıt başka kayıtlarca kullanılıyor" } },
      { status: 409 },
    );
  }

  console.error(err);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Beklenmeyen bir hata oluştu" } },
    { status: 500 },
  );
}
