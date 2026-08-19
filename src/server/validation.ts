import { ApiError } from "@/server/http";
import { z } from "zod";

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Girdi doğrulanamadı",
      collectFields(result.error),
    );
  }
  return result.data;
}

export function parseQuery<T>(
  schema: z.ZodType<T>,
  params: URLSearchParams,
): T {
  const record: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    record[key] = value;
  }
  const result = schema.safeParse(record);
  if (!result.success) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Sorgu parametreleri geçersiz",
      collectFields(result.error),
    );
  }
  return result.data;
}

function collectFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in fields)) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export const idSchema = z.string().min(1, "Id zorunludur");

export function parseId(value: string): string {
  return parseBody(idSchema, value);
}

export const kurusSchema = z
  .number("Tutar sayı olmalı")
  .int("Tutar kuruş cinsinden tamsayı olmalı")
  .positive("Tutar 0'dan büyük olmalı")
  .max(2_147_483_647, "Tutar çok büyük");

export const optionalKurusSchema = kurusSchema.optional();

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG biçiminde olmalı")
  .refine(isRealDate, "Geçersiz takvim tarihi");

export const optionalDateOnlySchema = dateOnlySchema.optional();

export const timeSchema = z
  .string()
  .regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Saat SS:DD biçiminde olmalı");

export const paginationSchema = z.object({
  page: z.coerce.number("Sayfa sayı olmalı").int().min(1).default(1),
  pageSize: z.coerce
    .number("Sayfa boyutu sayı olmalı")
    .int()
    .min(1)
    .max(100)
    .default(50),
});

export type Pagination = z.infer<typeof paginationSchema>;

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
