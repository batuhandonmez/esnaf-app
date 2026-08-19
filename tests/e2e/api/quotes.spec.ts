import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers";

async function createQuote(
  request: import("@playwright/test").APIRequestContext,
  title: string,
) {
  const res = await request.post("/api/quotes", {
    data: {
      customerId: "seed-musteri-1",
      title,
      items: [
        { name: "İşçilik", unit: "saat", quantity: 2, unitPriceKurus: 50_000 },
        { name: "Malzeme", quantity: 3, unitPriceKurus: 10_000 },
      ],
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

test("kalemlerle teklif oluşturulur; toplam doğru hesaplanır", async ({
  request,
}) => {
  const quote = await createQuote(request, uniqueName("Teklif Toplam"));
  expect(quote.totalKurus).toBe(130_000);
  expect(quote.items).toHaveLength(2);
  expect(quote.status).toBe("draft");
});

test("kalemsiz teklif reddedilir", async ({ request }) => {
  const res = await request.post("/api/quotes", {
    data: { customerId: "seed-musteri-1", title: "Boş teklif", items: [] },
  });
  expect(res.status()).toBe(422);
});

test("hizmet fiyatı değişse de mevcut teklif etkilenmez (snapshot)", async ({
  request,
}) => {
  const quote = await createQuote(request, uniqueName("Snapshot"));
  const before = quote.totalKurus;

  const patchRes = await request.patch("/api/service-items/seed-hizmet-1", {
    data: { unitPriceKurus: 999_999 },
  });
  expect(patchRes.status()).toBe(200);

  const afterRes = await request.get(`/api/quotes/${quote.id}`);
  expect((await afterRes.json()).data.totalKurus).toBe(before);
});

test("durum geçişleri: draft→sent→accepted; terminal durum kilitlenir", async ({
  request,
}) => {
  const quote = await createQuote(request, uniqueName("Geçiş"));

  const directAccept = await request.patch(`/api/quotes/${quote.id}`, {
    data: { status: "accepted" },
  });
  expect(directAccept.status()).toBe(409);
  expect((await directAccept.json()).error.code).toBe("INVALID_TRANSITION");

  const sent = await request.patch(`/api/quotes/${quote.id}`, {
    data: { status: "sent" },
  });
  expect(sent.status()).toBe(200);

  const accepted = await request.patch(`/api/quotes/${quote.id}`, {
    data: { status: "accepted" },
  });
  expect(accepted.status()).toBe(200);

  const editBlocked = await request.patch(`/api/quotes/${quote.id}`, {
    data: { title: "Değiştirilemez" },
  });
  expect(editBlocked.status()).toBe(409);
});

test("kabul + createJob iş üretir; ikinci kez reddedilir", async ({
  request,
}) => {
  const quote = await createQuote(request, uniqueName("İşe Çevirme"));
  await request.patch(`/api/quotes/${quote.id}`, { data: { status: "sent" } });

  const acceptRes = await request.post(`/api/quotes/${quote.id}/accept`, {
    data: { createJob: true },
  });
  expect(acceptRes.status()).toBe(200);
  const { quote: acceptedQuote, job } = (await acceptRes.json()).data;
  expect(acceptedQuote.status).toBe("accepted");
  expect(acceptedQuote.jobId).toBe(job.id);
  expect(job.title).toBe(quote.title);
  expect(job.priceKurus).toBe(130_000);
  expect(job.customerId).toBe("seed-musteri-1");

  const again = await request.post(`/api/quotes/${quote.id}/accept`, {
    data: { createJob: true },
  });
  expect(again.status()).toBe(409);
});

test("işsiz kabul edilen teklif sonradan işe çevrilebilir", async ({
  request,
}) => {
  const quote = await createQuote(request, uniqueName("Geç Çevirme"));
  await request.patch(`/api/quotes/${quote.id}`, { data: { status: "sent" } });

  const acceptRes = await request.post(`/api/quotes/${quote.id}/accept`, {
    data: { createJob: false },
  });
  expect(acceptRes.status()).toBe(200);
  expect((await acceptRes.json()).data.job).toBeNull();

  const convertRes = await request.post(`/api/quotes/${quote.id}/accept`, {
    data: { createJob: true },
  });
  expect(convertRes.status()).toBe(200);
  expect((await convertRes.json()).data.job).toBeTruthy();
});

test("reddedilen teklif kabul edilemez", async ({ request }) => {
  const quote = await createQuote(request, uniqueName("Red"));
  await request.patch(`/api/quotes/${quote.id}`, { data: { status: "sent" } });
  await request.patch(`/api/quotes/${quote.id}`, { data: { status: "rejected" } });

  const acceptRes = await request.post(`/api/quotes/${quote.id}/accept`, {
    data: { createJob: true },
  });
  expect(acceptRes.status()).toBe(409);
});

test("pdf endpoint'i 501 stub döner", async ({ request }) => {
  const quote = await createQuote(request, uniqueName("PDF"));
  const res = await request.get(`/api/quotes/${quote.id}/pdf`);
  expect(res.status()).toBe(501);
  expect((await res.json()).error.code).toBe("NOT_IMPLEMENTED");
});
