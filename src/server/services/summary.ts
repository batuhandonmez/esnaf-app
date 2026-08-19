import type { PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";
import { dateToDateOnly, monthRangeIstanbul, todayIstanbul, dateOnlyToDate } from "@/server/dates";
import { computeReceivable, isIncomingMovement } from "@/server/domain";

export async function getTodaySummary(prisma: PrismaClient, _ctx: Ctx) {
  const today = todayIstanbul();
  const { start, end } = monthRangeIstanbul();

  const [accounts, movements, jobs, revenueAgg, expenseAgg, receivables] =
    await prisma.$transaction([
      prisma.account.findMany({ where: { type: "cash" } }),
      prisma.cashMovement.groupBy({
        by: ["accountId", "type"],
        orderBy: { accountId: "asc" },
        _sum: { amountKurus: true },
      }),
      prisma.job.findMany({
        where: { scheduledOn: dateOnlyToDate(today) },
        orderBy: [{ startTime: "asc" }],
        include: { customer: true },
      }),
      prisma.revenue.aggregate({
        where: { date: { gte: dateOnlyToDate(start), lte: dateOnlyToDate(end) } },
        _sum: { amountKurus: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: dateOnlyToDate(start), lte: dateOnlyToDate(end) } },
        _sum: { amountKurus: true },
      }),
      prisma.receivable.findMany({
        include: {
          customer: true,
          collections: { select: { amountKurus: true } },
        },
      }),
    ]);

  const cashAccountIds = new Set(accounts.map((account) => account.id));
  let cashBalanceKurus = accounts.reduce(
    (sum, account) => sum + account.openingBalanceKurus,
    0,
  );
  for (const movement of movements) {
    if (!cashAccountIds.has(movement.accountId)) continue;
    const sum = movement._sum?.amountKurus ?? 0;
    if (isIncomingMovement(movement.type)) {
      cashBalanceKurus += sum;
    } else {
      cashBalanceKurus -= sum;
    }
  }

  const receivableRows = receivables.map((receivable) => {
    const computed = computeReceivable(receivable, today);
    return { customerId: receivable.customerId, ...computed };
  });

  const openRows = receivableRows.filter((row) => row.remainingKurus > 0);
  const overdueKurus = openRows
    .filter((row) => row.status === "overdue")
    .reduce((sum, row) => sum + row.remainingKurus, 0);

  return {
    date: today,
    cashBalanceKurus,
    todaysJobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      startTime: job.startTime,
      completedOn: job.completedOn ? dateToDateOnly(job.completedOn) : null,
      customerId: job.customerId,
      customerName: job.customer?.name ?? null,
    })),
    month: {
      incomeKurus: revenueAgg._sum.amountKurus ?? 0,
      expenseKurus: expenseAgg._sum.amountKurus ?? 0,
    },
    receivables: {
      totalKurus: openRows.reduce((sum, row) => sum + row.remainingKurus, 0),
      customerCount: new Set(openRows.map((row) => row.customerId)).size,
      overdueKurus,
    },
  };
}
