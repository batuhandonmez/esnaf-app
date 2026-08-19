import { expect, test } from "@playwright/test";
import { OLD_DATE, istanbulToday, uniqueName } from "./helpers";

test("geçmiş vade ile alacak açılamaz", async ({ request }) => {
  const res = await request.post("/api/receivables", {
    data: {
      customerId: "seed-musteri-1",
      description: "Geçersiz vade",
      totalKurus: 10_000,
      dueDate: OLD_DATE,
    },
  });
  expect(res.status()).toBe(422);
  expect((await res.json()).error.fields.dueDate).toBeTruthy();
});

test("vadesi geçmiş seed alacağı overdue olarak listelenir", async ({
  request,
}) => {
  const overdueRes = await request.get("/api/receivables?overdue=true");
  expect(overdueRes.status()).toBe(200);
  const overdue = (await overdueRes.json()).data;
  expect(overdue.length).toBeGreaterThan(0);
  expect(
    overdue.some((r: { id: string }) => r.id === "seed-alacak-2"),
  ).toBe(true);
  for (const row of overdue) {
    expect(row.status).toBe("overdue");
  }
});

test("tam tahsilat sonrası durum Ödendi olur", async ({ request }) => {
  const customerRes = await request.post("/api/customers", {
    data: { name: uniqueName("Ödeme Müşteri") },
  });
  const customerId = (await customerRes.json()).data.id;

  const accountRes = await request.post("/api/accounts", {
    data: { name: uniqueName("Ödeme Banka"), type: "bank" },
  });
  const accountId = (await accountRes.json()).data.id;

  const receivableRes = await request.post("/api/receivables", {
    data: {
      customerId,
      description: "Tam ödenecek",
      totalKurus: 10_000,
    },
  });
  const receivable = (await receivableRes.json()).data;

  const collectRes = await request.post(
    `/api/receivables/${receivable.id}/collections`,
    { data: { amountKurus: 10_000, date: istanbulToday(), accountId } },
  );
  expect(collectRes.status()).toBe(200);

  const listRes = await request.get(`/api/receivables?customerId=${customerId}`);
  const row = (await listRes.json()).data[0];
  expect(row.status).toBe("paid");
  expect(row.remainingKurus).toBe(0);
});

test("tahsilatlı alacak silinemez; tahsilat silinince silinir", async ({
  request,
}) => {
  const customerRes = await request.post("/api/customers", {
    data: { name: uniqueName("Silme Müşteri") },
  });
  const customerId = (await customerRes.json()).data.id;

  const accountRes = await request.post("/api/accounts", {
    data: { name: uniqueName("Silme Banka"), type: "bank" },
  });
  const accountId = (await accountRes.json()).data.id;

  const receivableRes = await request.post("/api/receivables", {
    data: { customerId, description: "Silme testi", totalKurus: 10_000 },
  });
  const receivable = (await receivableRes.json()).data;

  await request.post(`/api/receivables/${receivable.id}/collections`, {
    data: { amountKurus: 4_000, date: istanbulToday(), accountId },
  });

  const blocked = await request.delete(`/api/receivables/${receivable.id}`);
  expect(blocked.status()).toBe(409);

  const collections = await request.get(
    `/api/receivables/${receivable.id}/collections`,
  );
  const collectionId = (await collections.json()).data[0].id;
  await request.delete(`/api/collections/${collectionId}`);

  const okDelete = await request.delete(`/api/receivables/${receivable.id}`);
  expect(okDelete.status()).toBe(200);
});

test("alacak tutarı tahsilat toplamının altına düşürülemez", async ({
  request,
}) => {
  const customerRes = await request.post("/api/customers", {
    data: { name: uniqueName("Tutar Müşteri") },
  });
  const customerId = (await customerRes.json()).data.id;

  const accountRes = await request.post("/api/accounts", {
    data: { name: uniqueName("Tutar Banka"), type: "bank" },
  });
  const accountId = (await accountRes.json()).data.id;

  const receivableRes = await request.post("/api/receivables", {
    data: { customerId, description: "Tutar düşürme", totalKurus: 10_000 },
  });
  const receivable = (await receivableRes.json()).data;

  await request.post(`/api/receivables/${receivable.id}/collections`, {
    data: { amountKurus: 6_000, date: istanbulToday(), accountId },
  });

  const patchRes = await request.patch(`/api/receivables/${receivable.id}`, {
    data: { totalKurus: 5_000 },
  });
  expect(patchRes.status()).toBe(409);
});
