import { expect, test } from "@playwright/test";
import { OLD_DATE, istanbulToday } from "./helpers";

test("müşteri ve başlık olmadan iş oluşturulamaz", async ({ request }) => {
  const noCustomer = await request.post("/api/jobs", {
    data: { title: "Deneme işi" },
  });
  expect(noCustomer.status()).toBe(422);
  expect((await noCustomer.json()).error.fields.customerId).toBeTruthy();

  const noTitle = await request.post("/api/jobs", {
    data: { customerId: "seed-musteri-1" },
  });
  expect(noTitle.status()).toBe(422);
  expect((await noTitle.json()).error.fields.title).toBeTruthy();
});

test("geçersiz saat 422 döner", async ({ request }) => {
  const res = await request.post("/api/jobs", {
    data: {
      customerId: "seed-musteri-1",
      title: "Deneme",
      startTime: "24:00",
    },
  });
  expect(res.status()).toBe(422);
  expect((await res.json()).error.fields.startTime).toBeTruthy();
});

test("iş oluşturulur; tarih filtresi ve durum akışı çalışır", async ({
  request,
}) => {
  const createRes = await request.post("/api/jobs", {
    data: {
      customerId: "seed-musteri-2",
      title: "Eski tarihli deneme işi",
      scheduledOn: OLD_DATE,
      startTime: "09:00",
    },
  });
  expect(createRes.status()).toBe(200);
  const job = (await createRes.json()).data;
  expect(job.status).toBe("planned");

  const oldDay = await request.get(`/api/jobs?date=${OLD_DATE}`);
  const oldDayBody = await oldDay.json();
  expect(oldDayBody.data.some((j: { id: string }) => j.id === job.id)).toBe(
    true,
  );

  const today = istanbulToday();
  const todayRes = await request.get(`/api/jobs?date=${today}`);
  const todayBody = await todayRes.json();
  expect(todayBody.data.some((j: { id: string }) => j.id === job.id)).toBe(
    false,
  );

  const completeRes = await request.patch(`/api/jobs/${job.id}`, {
    data: { status: "completed" },
  });
  expect(completeRes.status()).toBe(200);
  const completed = (await completeRes.json()).data;
  expect(completed.completedOn).toBe(today);

  const invalidStatus = await request.patch(`/api/jobs/${job.id}`, {
    data: { status: "cancelled" },
  });
  expect(invalidStatus.status()).toBe(422);
});

test("iş silinince bağlı gelir korunur, bağ kopar", async ({ request }) => {
  const accountRes = await request.post("/api/accounts", {
    data: { name: "İş Testi Banka", type: "bank" },
  });
  const account = (await accountRes.json()).data;

  const jobRes = await request.post("/api/jobs", {
    data: {
      customerId: "seed-musteri-3",
      title: "Silinecek iş",
      scheduledOn: OLD_DATE,
    },
  });
  const job = (await jobRes.json()).data;

  const revenueRes = await request.post("/api/revenues", {
    data: {
      date: OLD_DATE,
      amountKurus: 45_000,
      customerId: "seed-musteri-3",
      jobId: job.id,
      accountId: account.id,
    },
  });
  expect(revenueRes.status()).toBe(200);
  const revenue = (await revenueRes.json()).data;

  const deleteRes = await request.delete(`/api/jobs/${job.id}`);
  expect(deleteRes.status()).toBe(200);

  const listRes = await request.get(
    `/api/revenues?from=${OLD_DATE}&to=${OLD_DATE}`,
  );
  const list = (await listRes.json()).data;
  const kept = list.find((r: { id: string }) => r.id === revenue.id);
  expect(kept).toBeTruthy();
  expect(kept.jobId).toBeNull();
});
