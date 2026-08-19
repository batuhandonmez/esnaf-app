import { dateToDateOnly } from "@/server/dates";

export type ReceivableStatus = "open" | "paid" | "overdue";

export interface ReceivableView {
  totalKurus: number;
  dueDate: Date | null;
  collections: { amountKurus: number }[];
}

export function computeReceivable(
  receivable: ReceivableView,
  today: string,
): { paidKurus: number; remainingKurus: number; status: ReceivableStatus } {
  const paidKurus = receivable.collections.reduce(
    (sum, collection) => sum + collection.amountKurus,
    0,
  );
  const remainingKurus = receivable.totalKurus - paidKurus;
  let status: ReceivableStatus = "open";
  if (remainingKurus <= 0) {
    status = "paid";
  } else if (receivable.dueDate && dateToDateOnly(receivable.dueDate) < today) {
    status = "overdue";
  }
  return { paidKurus, remainingKurus, status };
}

export const QUOTE_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected"],
};

export function canTransitionQuote(
  from: string,
  to: string,
): boolean {
  return (QUOTE_TRANSITIONS[from] ?? []).includes(to);
}

export const IN_MOVEMENT_TYPES = [
  "income",
  "collection",
  "transfer_in",
  "manual_in",
] as const;

export function isIncomingMovement(type: string): boolean {
  return (IN_MOVEMENT_TYPES as readonly string[]).includes(type);
}

export function computeProfitKurus(
  revenueTotalKurus: number,
  expenseTotalKurus: number,
): number {
  return revenueTotalKurus - expenseTotalKurus;
}
