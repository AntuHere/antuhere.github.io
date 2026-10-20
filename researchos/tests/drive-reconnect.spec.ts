import { test, expect } from "@playwright/test";
import { mockGoogle, signIn, navigate, adminSignIn } from "./google-mock";
const KEY = "researchos-drive-session-v1";

test("reload restores valid Drive access without another Google popup or extending expiry", async ({
  page,
}) => {
  const google = await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  expect(await page.evaluate(() => (window as any).googleRequests)).toEqual([
    { prompt: "" },
  ]);
  const cached = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    KEY,
  );
  expect(cached.token).toBe("test-only-token");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "test-only-token",
  );
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Settings");
  await expect(
    page.getByRole("heading", { name: "Google Drive connected" }),
  ).toBeVisible();
  expect(google.profileRequests()).toBe(2);
  expect(
    await page.evaluate(() => (window as any).googleRequests || []),
  ).toEqual([]);
  expect(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)!).expires,
      KEY,
    ),
  ).toBe(cached.expires);
});

test("disconnect and workspace sign-out clear cached Google access", async ({
  page,
}) => {
  await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  await navigate(page, "Settings");
  await page.getByRole("button", { name: "Disconnect Drive" }).click();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), KEY),
  ).toBeNull();
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Settings");
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Google Drive connected" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await expect(
    page.getByRole("heading", { name: "Google Drive connected" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), KEY),
  ).toBeNull();
  await expect(
    page.getByRole("heading", { name: "Admin login" }),
  ).toBeVisible();
});

test("expired and malformed cached connections do not block the local workspace", async ({
  page,
}) => {
  await mockGoogle(page);
  await page.clock.install();
  await page.goto("/researchos/");
  await signIn(page);
  await page.evaluate((key) => {
    const cached = JSON.parse(sessionStorage.getItem(key)!);
    cached.expires = Date.now() - 1;
    sessionStorage.setItem(key, JSON.stringify(cached));
  }, KEY);
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Settings");
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeEnabled();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), KEY),
  ).toBeNull();
  await page.evaluate(
    (key) => sessionStorage.setItem(key, "invalid JSON"),
    KEY,
  );
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Settings");
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeEnabled();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), KEY),
  ).toBeNull();
});

test("a revoked Google token is discarded on reload and admin access remains available", async ({
  page,
}) => {
  const google = await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  google.rejectProfile();
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Settings");
  await expect(page.getByRole("alert")).toContainText("Please reconnect");
  await expect(
    page.getByRole("heading", { name: "Google Drive connected" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), KEY),
  ).toBeNull();
  await navigate(page, "Research notes");
  await page.getByRole("button", { name: "Quick sticky note" }).click();
  await expect(page.getByLabel("Sticky note title").last()).toBeVisible();
});
