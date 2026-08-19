import { expect, test } from "@playwright/test";
import { istanbulToday, monthRangeOf } from "./helpers";

test("seed verileri ve özet endpoint'i tutarlı", async ({ request }) => {
  const categories = await request.get("/api/expense-categories");
  expect(categories.status()).toBe(200);
  const categoryData = (await categories.json()).data;
  expect(categoryData).toHaveLength(7);
  expect(categoryData.map((c: { name: string }) => c.name)).toContain("Malzeme");

  const accounts = await request.get("/api/accounts");
  expect(accounts.status()).toBe(200);
  const accountData = (await accounts.json()).data;
  const kasa = accountData.find(
    (a: { type: string }) => a.type === "cash",
  );
  expect(kasa).toBeTruthy();
  expect(kasa.name).toBe("Kasa");
  expect(kasa.balanceKurus).toBe(490_000);
});

test("summary/today bugünkü işleri saat sırasıyla döner", async ({
  request,
}) => {
  const res = await request.get("/api/summary/today");
  expect(res.status()).toBe(200);
  const summary = (await res.json()).data;

  expect(summary.date).toBe(istanbulToday());
  expect(summary.cashBalanceKurus).toBe(490_000);
  expect(summary.todaysJobs).toHaveLength(3);

  const times = summary.todaysJobs.map((j: { startTime: string }) => j.startTime);
  const sorted = [...times].sort();
  expect(times).toEqual(sorted);
});

test("summary/today aylık toplamlar liste toplamlarıyla tutarlı", async ({
  request,
}) => {
  const today = istanbulToday();
  const range = monthRangeOf(today);

  const summaryRes = await request.get("/api/summary/today");
  const summary = (await summaryRes.json()).data;

  const revenuesRes = await request.get(
    `/api/revenues?from=${range.start}&to=${range.end}&pageSize=100`,
  );
  const revenues = (await revenuesRes.json()).data;
  const incomeSum = revenues.reduce(
    (sum: number, r: { amountKurus: number }) => sum + r.amountKurus,
    0,
  );
  expect(summary.month.incomeKurus).toBe(incomeSum);

  const expensesRes = await request.get(
    `/api/expenses?from=${range.start}&to=${range.end}&pageSize=100`,
  );
  const expenses = (await expensesRes.json()).data;
  const expenseSum = expenses.reduce(
    (sum: number, e: { amountKurus: number }) => sum + e.amountKurus,
    0,
  );
  expect(summary.month.expenseKurus).toBe(expenseSum);
});

test("summary/today alacak özeti liste bakiyeleriyle tutarlı", async ({
  request,
}) => {
  const receivablesRes = await request.get("/api/receivables?pageSize=100");
  const receivables = (await receivablesRes.json()).data;
  const total = receivables.reduce(
    (sum: number, r: { remainingKurus: number }) => sum + r.remainingKurus,
    0,
  );
  const openCustomers = new Set(
    receivables
      .filter((r: { remainingKurus: number }) => r.remainingKurus > 0)
      .map((r: { customerId: string }) => r.customerId),
  );

  const summaryRes = await request.get("/api/summary/today");
  const summary = (await summaryRes.json()).data;
  expect(summary.receivables.totalKurus).toBe(total);
  expect(summary.receivables.customerCount).toBe(openCustomers.size);
  expect(summary.receivables.overdueKurus).toBe(120_000);
});

test("listeler envelope kurallarına uyar", async ({ request }) => {
  const res = await request.get("/api/customers");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data).toBeInstanceOf(Array);
  expect(body.meta).toMatchObject({
    total: expect.any(Number),
    page: 1,
    pageSize: 50,
  });

  const notFound = await request.get("/api/customers/olmayan-id");
  expect(notFound.status()).toBe(404);
  const errorBody = await notFound.json();
  expect(errorBody.error.code).toBe("NOT_FOUND");
  expect(typeof errorBody.error.message).toBe("string");
});
