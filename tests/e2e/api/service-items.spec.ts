import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers";

test("hizmet listesi CRUD akışı çalışır", async ({ request }) => {
  const listRes = await request.get("/api/service-items");
  expect(listRes.status()).toBe(200);
  const initial = (await listRes.json()).data;
  expect(initial.length).toBeGreaterThanOrEqual(8);

  const name = uniqueName("Yeni Hizmet");
  const createRes = await request.post("/api/service-items", {
    data: { name, unit: "adet", unitPriceKurus: 12_500 },
  });
  expect(createRes.status()).toBe(200);
  const item = (await createRes.json()).data;
  expect(item.name).toBe(name);
  expect(item.unitPriceKurus).toBe(12_500);

  const patchRes = await request.patch(`/api/service-items/${item.id}`, {
    data: { unitPriceKurus: 15_000, sortOrder: 99 },
  });
  expect(patchRes.status()).toBe(200);
  const updated = (await patchRes.json()).data;
  expect(updated.unitPriceKurus).toBe(15_000);
  expect(updated.sortOrder).toBe(99);

  const listAfter = await request.get("/api/service-items");
  const after = (await listAfter.json()).data;
  expect(after.map((s: { id: string }) => s.id)).toContain(item.id);

  const deleteRes = await request.delete(`/api/service-items/${item.id}`);
  expect(deleteRes.status()).toBe(200);

  const gone = await request.patch(`/api/service-items/${item.id}`, {
    data: { unitPriceKurus: 1_000 },
  });
  expect(gone.status()).toBe(404);
});
