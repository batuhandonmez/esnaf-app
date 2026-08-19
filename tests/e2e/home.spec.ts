import { expect, test } from "@playwright/test";

test("ana sayfa başlığı görüntülenir", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Esnaf App" }),
  ).toBeVisible();
});
