import { test, expect } from "@playwright/test";
import { adminSignIn, navigate } from "./google-mock";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:4173/")
      ? route.continue()
      : route.abort(),
  );
});

test("admin login remembers this browser, works without Google, and signs out without losing notes", async ({
  page,
}, info) => {
  await page.goto("/researchos/");
  await expect(
    page.getByRole("heading", { name: "Admin login" }),
  ).toBeVisible();
  await expect(page.getByLabel("Google OAuth Web client ID")).toHaveCount(0);
  await page.getByLabel("Username", { exact: true }).fill("antuhere");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Incorrect username or password",
  );
  await expect(page.locator(".app")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("admin-login.png") });
  await adminSignIn(page);
  await navigate(page, "Research notes");
  await page.getByRole("button", { name: "Quick sticky note" }).click();
  await page
    .getByLabel("Sticky note title")
    .last()
    .fill("Phone note without Google");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toBeVisible();
  await navigate(page, "Research notes");
  await expect(page.getByLabel("Sticky note title").last()).toHaveValue(
    "Phone note without Google",
  );
  await navigate(page, "Overview");
  await page
    .locator("main")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name").fill("Local project");
  await dialog.getByLabel("Research proposal file (optional)").setInputFiles({
    name: "local-proposal.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("My local proposal"),
  });
  await dialog.getByRole("button", { name: "Save to workspace" }).click();
  await navigate(page, "Projects");
  await page.getByRole("button", { name: /Local project.*Private/ }).click();
  await page.getByRole("tab", { name: "Documents vault" }).click();
  const row = page
    .locator(".rw-file")
    .filter({ hasText: "local-proposal.txt" });
  await expect(row).toContainText("Pending upload");
  await expect(
    page.getByRole("button", { name: "Retry pending uploads" }),
  ).toBeDisabled();
  await row.getByRole("button", { name: "Open file", exact: true }).click();
  await expect(page.getByRole("dialog").locator("pre")).toHaveText(
    "My local proposal",
  );
  await page.getByRole("button", { name: "Close preview" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Admin login" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Admin login" }),
  ).toBeVisible();
  await adminSignIn(page);
  await navigate(page, "Research notes");
  await expect(page.getByLabel("Sticky note title").last()).toHaveValue(
    "Phone note without Google",
  );
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => /password/i.test(k)),
    ),
  ).toBe(false);
});

test("old admin credentials and remembered sessions no longer open the workspace", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await page.evaluate(() =>
    localStorage.setItem("researchos-admin-session", "admin"),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Admin login" }),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("admin");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Incorrect username or password",
  );
  await expect(page.locator(".app")).toHaveCount(0);
  await adminSignIn(page);
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toBeVisible();
});
