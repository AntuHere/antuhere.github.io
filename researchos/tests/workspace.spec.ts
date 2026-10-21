import { mockGoogle, signIn } from "./google-mock";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function navigate(page: Page, name: string) {
  const open = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await open.isVisible()) await open.click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name, exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:4173/")
      ? route.continue()
      : route.abort(),
  );
  await mockGoogle(page);
});

test("portfolio navigation and direct Pages paths work on desktop and phone", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Nasfiqul Islam Antu/ }).first(),
  ).toBeVisible();
  if (await page.locator(".menu-icon").isVisible())
    await page.locator(".menu-icon").click();
  await page.getByRole("link", { name: "ResearchOS", exact: true }).click();
  await expect(page).toHaveURL(/\/researchos\/$/);
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toBeVisible();
  await page.goto("/researchos");
  await page.reload();
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => {
      const projects = document
        .querySelector(".sidebar-projects")!
        .getBoundingClientRect();
      const bottom = document
        .querySelector(".sidebar-bottom")!
        .getBoundingClientRect();
      return bottom.top >= projects.bottom;
    }),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("overview.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.reload();
  await signIn(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("searchbox", { name: "Search workspace" })
    .fill("Rickshaw");
  await expect(page.locator(".project-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("create and edit a project, complete a task, and persist a note", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await signIn(page);
  await page
    .locator("main")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name").fill("My field study");
  await dialog
    .getByLabel("Research objective")
    .fill("Compare observations across sites");
  await dialog.getByLabel("Workspace visibility").selectOption("Shared");
  await dialog.getByRole("button", { name: "Save to workspace" }).click();
  await navigate(page, "Projects");
  await page.getByRole("button", { name: /My field study.*Shared/ }).click();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await dialog.getByLabel("Description").fill("A longitudinal survey");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("A longitudinal survey", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await dialog.getByLabel("Task title").fill("Collect field observations");
  await dialog.getByRole("button", { name: "Save to workspace" }).click();
  await page.getByRole("tab", { name: "Research notes", exact: true }).click();
  await page.getByRole("button", { name: "Quick sticky note" }).click();
  await page.getByLabel("Sticky note title").last().fill("Field decisions");
  await page
    .getByLabel("Sticky note text")
    .last()
    .fill("Sample each location twice.");
  await navigate(page, "Task board");
  const card = page
    .locator(".task-card")
    .filter({ hasText: "Collect field observations" });
  await card.getByRole("button", { name: "✓ Done", exact: true }).click();
  await expect(
    page
      .locator(".kanban-column")
      .filter({ has: page.getByRole("heading", { name: "Done", exact: true }) })
      .getByText("Collect field observations"),
  ).toBeVisible();
  await page.reload();
  await signIn(page);
  await navigate(page, "Research notes");
  await expect(
    page.getByRole("textbox", { name: "Sticky note text" }).last(),
  ).toHaveValue("Sample each location twice.");
});

test("project stages remain isolated and JSON backup restores custom work steps and sticky notes", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await signIn(page);
  await navigate(page, "Rickshaw PUDO");
  await page
    .getByLabel("New to-do or work step")
    .fill("Review hospital access observations");
  await page.getByRole("button", { name: "Add to-do", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Complete Review hospital access observations",
    })
    .check();
  const notes = page.getByRole("region", {
    name: "Stage sticky notes",
    exact: true,
  });
  await notes.getByRole("button", { name: "Quick sticky note" }).click();
  await notes.getByLabel("Sticky note text").fill("Rickshaw observations");
  await navigate(page, "Lateral Movement");
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await expect(notes.getByLabel("Sticky note text")).toHaveCount(0);
  await notes.getByRole("button", { name: "Quick sticky note" }).click();
  await notes.getByLabel("Sticky note text").fill("Lateral observations");
  await navigate(page, "Rickshaw PUDO");
  await expect(
    page.getByRole("checkbox", {
      name: "Complete Review hospital access observations",
    }),
  ).toBeChecked();
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Rickshaw observations",
  );
  await navigate(page, "Settings");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await event;
  const data = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(data.__stageWorkflows.pudo["0"].todos[0]).toMatchObject({
    title: "Review hospital access observations",
    done: true,
  });
  expect(data.__stageWorkflows.pudo["0"].stickyNotes[0].body).toBe(
    "Rickshaw observations",
  );
  expect(data.__stageWorkflows.lateral["0"].stickyNotes[0].body).toBe(
    "Lateral observations",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await navigate(page, "Rickshaw PUDO");
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await navigate(page, "Settings");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(
    page.getByText("Backup restored", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await signIn(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(
    page.getByRole("checkbox", {
      name: "Complete Review hospital access observations",
    }),
  ).toBeChecked();
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Rickshaw observations",
  );
  await navigate(page, "Settings");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"projects":[],"tasks":[]}'),
  });
  await expect(page.getByText(/Could not restore backup/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("researchos-mvp-v1")!).projects.length,
    ),
  ).toBe(6);
});

test("document uploads persist, download intact, and remain project-specific", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await signIn(page);
  await navigate(page, "Rickshaw PUDO");
  await page.getByRole("tab", { name: "Documents vault" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "observations.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("My original observations"),
  });
  const row = page.locator(".rw-file").filter({ hasText: "observations.txt" });
  await expect(row).toContainText("Saved in Drive");
  const event = page.waitForEvent("download");
  await row.getByRole("button", { name: "Download file" }).click();
  const download = await event;
  expect(await readFile((await download.path())!, "utf8")).toBe(
    "My original observations",
  );
  await page.reload();
  await signIn(page);
  await navigate(page, "Rickshaw PUDO");
  await page.getByRole("tab", { name: "Documents vault" }).click();
  await expect(row).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await navigate(page, "Lateral Movement");
  await page.getByRole("tab", { name: "Documents vault" }).click();
  await expect(page.getByText("observations.txt")).toHaveCount(0);
});
