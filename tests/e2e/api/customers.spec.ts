import { expect, test } from "@playwright/test";
import { uniqueName } from "./helpers";

test("boş adla müşteri oluşturulamaz", async ({ request }) => {
  const res = await request.post("/api/customers", { data: { name: "  " } });
  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.error.code).toBe("VALIDATION_ERROR");
  expect(body.error.fields.name).toBeTruthy();
});

test("müşteri oluşturulur ve güncellenir", async ({ request }) => {
  const name = uniqueName("Test Müşteri");
  const createRes = await request.post("/api/customers", {
    data: { name, phone: "0555 000 11 22" },
  });
  expect(createRes.status()).toBe(200);
  const created = (await createRes.json()).data;
  expect(created.name).toBe(name);

  const patchRes = await request.patch(`/api/customers/${created.id}`, {
    data: { phone: "0555 999 88 77" },
  });
  expect(patchRes.status()).toBe(200);
  const updated = (await patchRes.json()).data;
  expect(updated.phone).toBe("0555 999 88 77");

  const detailRes = await request.get(`/api/customers/${created.id}`);
  expect(detailRes.status()).toBe(200);
  expect((await detailRes.json()).data.phone).toBe("0555 999 88 77");
});

test("ad/telefon araması büyük/küçük harf duyarsız çalışır", async ({
  request,
}) => {
  const res = await request.get("/api/customers?q=ahmet");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data.length).toBeGreaterThan(0);
  expect(
    body.data.some(
      (c: { name: string }) => c.name.toLowerCase().includes("ahmet"),
    ),
  ).toBe(true);

  const phoneRes = await request.get("/api/customers?q=0555%20333");
  expect(phoneRes.status()).toBe(200);
  const phoneBody = await phoneRes.json();
  expect(phoneBody.data.length).toBeGreaterThan(0);
});

test("bilinmeyen müşteri id'si 404 döner", async ({ request }) => {
  const res = await request.patch("/api/customers/olmayan-id", {
    data: { phone: "0555" },
  });
  expect(res.status()).toBe(404);
  expect((await res.json()).error.code).toBe("NOT_FOUND");
});
