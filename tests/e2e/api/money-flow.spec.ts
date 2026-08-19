import { expect, test } from "@playwright/test";
import { OLD_DATE, uniqueName } from "./helpers";

test.describe.configure({ mode: "serial" });

let accountId: string;
let secondAccountId: string;
let customerId: string;

async function createAccount(request: import("@playwright/test").APIRequestContext, name: string) {
  const res = await request.post("/api/accounts", {
    data: { name, type: "bank" },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.id as string;
}

async function balanceOf(request: import("@playwright/test").APIRequestContext, id: string) {
  const res = await request.get("/api/accounts");
  const accounts = (await res.json()).data;
  return accounts.find((a: { id: string }) => a.id === id).balanceKurus as number;
}

test.beforeAll(async ({ request }) => {
  accountId = await createAccount(request, uniqueName("Akış Banka"));
  secondAccountId = await createAccount(request, uniqueName("Akış Banka 2"));
  const customerRes = await request.post("/api/customers", {
    data: { name: uniqueName("Akış Müşteri") },
  });
  customerId = (await customerRes.json()).data.id;
});

test("peşin gelir bakiyeyi artırır", async ({ request }) => {
  const before = await balanceOf(request, accountId);
  const res = await request.post("/api/revenues", {
    data: {
      date: OLD_DATE,
      amountKurus: 100_000,
      customerId,
      accountId,
    },
  });
  expect(res.status()).toBe(200);
  expect(await balanceOf(request, accountId)).toBe(before + 100_000);
});

test("gider bakiyeyi azaltır; silinince geri gelir", async ({ request }) => {
  const before = await balanceOf(request, accountId);
  const res = await request.post("/api/expenses", {
    data: {
      date: OLD_DATE,
      amountKurus: 25_000,
      categoryId: "seed-kategori-1",
      accountId,
    },
  });
  expect(res.status()).toBe(200);
  const expense = (await res.json()).data;
  expect(await balanceOf(request, accountId)).toBe(before - 25_000);

  const deleteRes = await request.delete(`/api/expenses/${expense.id}`);
  expect(deleteRes.status()).toBe(200);
  expect(await balanceOf(request, accountId)).toBe(before);
});

test("0 veya negatif tutar 422 döner", async ({ request }) => {
  const zero = await request.post("/api/revenues", {
    data: { date: OLD_DATE, amountKurus: 0, customerId, accountId },
  });
  expect(zero.status()).toBe(422);

  const negative = await request.post("/api/revenues", {
    data: { date: OLD_DATE, amountKurus: -100, customerId, accountId },
  });
  expect(negative.status()).toBe(422);
});

test("manuel hareket bakiyeyi günceller; edit/delete endpoint'i yoktur", async ({
  request,
}) => {
  const before = await balanceOf(request, accountId);

  const inRes = await request.post("/api/movements", {
    data: {
      accountId,
      direction: "in",
      amountKurus: 10_000,
      date: OLD_DATE,
      description: "Elden para",
    },
  });
  expect(inRes.status()).toBe(200);
  const movement = (await inRes.json()).data;
  expect(movement.type).toBe("manual_in");

  const outRes = await request.post("/api/movements", {
    data: {
      accountId,
      direction: "out",
      amountKurus: 5_000,
      date: OLD_DATE,
    },
  });
  expect(outRes.status()).toBe(200);

  expect(await balanceOf(request, accountId)).toBe(before + 5_000);

  const patchRes = await request.patch(`/api/movements/${movement.id}`, {
    data: { amountKurus: 1 },
  });
  expect(patchRes.status()).toBe(405);

  const deleteRes = await request.delete(`/api/movements/${movement.id}`);
  expect(deleteRes.status()).toBe(405);
});

test("transfer iki hareket üretir; aynı hesaba transfer reddedilir", async ({
  request,
}) => {
  const before1 = await balanceOf(request, accountId);
  const before2 = await balanceOf(request, secondAccountId);

  const sameAccount = await request.post("/api/accounts/transfer", {
    data: {
      fromAccountId: accountId,
      toAccountId: accountId,
      amountKurus: 10_000,
      date: OLD_DATE,
    },
  });
  expect(sameAccount.status()).toBe(422);

  const transfer = await request.post("/api/accounts/transfer", {
    data: {
      fromAccountId: accountId,
      toAccountId: secondAccountId,
      amountKurus: 20_000,
      date: OLD_DATE,
    },
  });
  expect(transfer.status()).toBe(200);
  const { movements } = (await transfer.json()).data;
  expect(movements).toHaveLength(2);
  expect(movements.map((m: { type: string }) => m.type).sort()).toEqual([
    "transfer_in",
    "transfer_out",
  ]);
  expect(movements[0].transferGroupId).toBeTruthy();
  expect(movements[0].transferGroupId).toBe(movements[1].transferGroupId);

  expect(await balanceOf(request, accountId)).toBe(before1 - 20_000);
  expect(await balanceOf(request, secondAccountId)).toBe(before2 + 20_000);
});

test("veresiye gelir alacak açar, hareket yazmaz; tahsilat kapatır", async ({
  request,
}) => {
  const before = await balanceOf(request, accountId);

  const revenueRes = await request.post("/api/revenues", {
    data: {
      date: OLD_DATE,
      amountKurus: 50_000,
      paid: false,
      customerId,
    },
  });
  expect(revenueRes.status()).toBe(200);

  expect(await balanceOf(request, accountId)).toBe(before);

  const listRes = await request.get(`/api/receivables?customerId=${customerId}`);
  const receivable = (await listRes.json()).data[0];
  expect(receivable.totalKurus).toBe(50_000);
  expect(receivable.remainingKurus).toBe(50_000);
  expect(receivable.status).toBe("open");

  const collectRes = await request.post(
    `/api/receivables/${receivable.id}/collections`,
    { data: { amountKurus: 20_000, date: OLD_DATE, accountId } },
  );
  expect(collectRes.status()).toBe(200);

  expect(await balanceOf(request, accountId)).toBe(before + 20_000);

  const after = await request.get(`/api/receivables?customerId=${customerId}`);
  const updated = (await after.json()).data[0];
  expect(updated.paidKurus).toBe(20_000);
  expect(updated.remainingKurus).toBe(30_000);

  const overpay = await request.post(
    `/api/receivables/${receivable.id}/collections`,
    { data: { amountKurus: 30_001, date: OLD_DATE, accountId } },
  );
  expect(overpay.status()).toBe(409);
  expect((await overpay.json()).error.code).toBe("CONFLICT");
});

test("tahsilatlı alacağı olan gelir silinemez", async ({ request }) => {
  const listRes = await request.get(`/api/receivables?customerId=${customerId}`);
  const receivable = (await listRes.json()).data[0];

  const revenueId = receivable.revenueId;
  const deleteRes = await request.delete(`/api/revenues/${revenueId}`);
  expect(deleteRes.status()).toBe(409);

  const collections = await request.get(
    `/api/receivables/${receivable.id}/collections`,
  );
  const collectionId = (await collections.json()).data[0].id;

  const deleteCollection = await request.delete(
    `/api/collections/${collectionId}`,
  );
  expect(deleteCollection.status()).toBe(200);

  const retry = await request.delete(`/api/revenues/${revenueId}`);
  expect(retry.status()).toBe(200);
});

test("peşin gelir silinince bağlı hareket de silinir", async ({ request }) => {
  const before = await balanceOf(request, accountId);

  const res = await request.post("/api/revenues", {
    data: {
      date: OLD_DATE,
      amountKurus: 15_000,
      customerId,
      accountId,
    },
  });
  const revenue = (await res.json()).data;
  expect(await balanceOf(request, accountId)).toBe(before + 15_000);

  const deleteRes = await request.delete(`/api/revenues/${revenue.id}`);
  expect(deleteRes.status()).toBe(200);
  expect(await balanceOf(request, accountId)).toBe(before);
});

test("bakiye formülü açılış + girişler − çıkışlar ile tutarlı", async ({
  request,
}) => {
  const accountsRes = await request.get("/api/accounts");
  const accounts = (await accountsRes.json()).data;
  for (const account of accounts) {
    const movementsRes = await request.get(
      `/api/accounts/${account.id}/movements?pageSize=100`,
    );
    const movements = (await movementsRes.json()).data;
    const sum = movements.reduce((acc: number, m: { type: string; amountKurus: number }) => {
      const isIn = ["income", "collection", "transfer_in", "manual_in"].includes(
        m.type,
      );
      return acc + (isIn ? m.amountKurus : -m.amountKurus);
    }, 0);
    expect(account.balanceKurus).toBe(account.openingBalanceKurus + sum);
  }
});
