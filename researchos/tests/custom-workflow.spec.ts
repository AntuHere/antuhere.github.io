import { test, expect } from "@playwright/test";
import { adminSignIn, navigate } from "./google-mock";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:4173/")
      ? route.continue()
      : route.abort(),
  );
});

test("each pipeline stage has editable personal work steps and sticky notes, isolated across stages and reloads", async ({
  page,
}, info) => {
  await page.goto("/researchos/");
  await adminSignIn(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(
    page.locator(".detail-stats,.detail-content,.detail-task-list"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Next steps", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Research objective", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Project contents", exact: true }),
  ).toHaveCount(0);

  const pipeline = page.locator(".rw-stages"),
    notes = page.getByRole("region", {
      name: "Stage sticky notes",
      exact: true,
    });
  await expect(pipeline.locator(".rw-stage")).toHaveCount(9);
  await expect(page.getByText("Stage checklist", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("New to-do or work step")
    .fill("Arrange a supervisor meeting");
  await page.getByLabel("New to-do or work step").press("Enter");
  await page
    .getByLabel("New to-do or work step")
    .fill("Collect project background");
  await page.getByRole("button", { name: "Add to-do", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Work step title", exact: true })
    .first()
    .fill("Meet supervisor on Monday");
  await page
    .getByRole("checkbox", {
      name: "Complete Meet supervisor on Monday",
      exact: true,
    })
    .check();
  await expect(pipeline.locator(".rw-stages-top")).toContainText(
    "1/2 work steps",
  );
  await page
    .locator(".rw-work-step")
    .last()
    .getByRole("button", { name: "Delete work step" })
    .click();
  await expect(pipeline.locator(".rw-stages-top")).toContainText(
    "1/1 work steps",
  );
  await notes.getByRole("button", { name: "Quick sticky note" }).click();
  await notes.getByLabel("Sticky note title").fill("Research direction");
  await notes
    .getByLabel("Sticky note text")
    .fill("Focus on pedestrian access near the hospital.");
  await notes.getByLabel("Note color").selectOption("pink");
  await notes.getByRole("button", { name: "Pin note", exact: true }).click();
  await expect(notes.getByLabel("Note project")).toHaveCount(0);
  await page.getByLabel("Stage status").selectOption("In progress");
  await pipeline.getByRole("button", { name: /Literature review/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await expect(notes.getByLabel("Sticky note text")).toHaveCount(0);
  await page.getByLabel("New to-do or work step").fill("Read two reviews");
  await page.getByRole("button", { name: "Add to-do", exact: true }).click();
  await notes.getByRole("button", { name: "Quick sticky note" }).click();
  await notes.getByLabel("Sticky note text").fill("Compare study limitations.");
  await pipeline.getByRole("button", { name: /Review & submission/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await expect(notes.getByLabel("Sticky note text")).toHaveCount(0);
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveValue("Meet supervisor on Monday");
  await expect(
    page.getByRole("checkbox", {
      name: "Complete Meet supervisor on Monday",
      exact: true,
    }),
  ).toBeChecked();
  await expect(page.getByLabel("Stage status")).toHaveValue("In progress");
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Focus on pedestrian access near the hospital.",
  );
  await expect(notes.locator(".sticky-note")).toHaveClass(/sticky-pink/);
  await expect(
    notes.getByRole("button", { name: "Unpin note" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: info.outputPath("custom-workflow.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await pipeline.getByRole("button", { name: /Literature review/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveValue("Read two reviews");
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Compare study limitations.",
  );
});

test("old stage notes become a single editable sticky note and deleted migrated notes stay deleted", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await adminSignIn(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "researchos-stages-pudo",
      JSON.stringify({
        "0": {
          checked: [true, false, true, false],
          notes: "Previously saved research concept notes.",
          status: "In progress",
        },
      }),
    ),
  );
  await navigate(page, "Rickshaw PUDO");
  const notes = page.getByRole("region", {
    name: "Stage sticky notes",
    exact: true,
  });
  await expect(page.getByLabel("Stage status")).toHaveValue("In progress");
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Previously saved research concept notes.",
  );
  await expect(
    page.getByRole("textbox", { name: "Work step title", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Define problem statement")).toHaveCount(0);
  await notes.getByLabel("Sticky note text").fill("Updated concept notes.");
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(notes.getByLabel("Sticky note text")).toHaveCount(1);
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Updated concept notes.",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await notes.getByRole("button", { name: "Delete sticky note" }).click();
  await page.reload();
  await adminSignIn(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(notes.getByLabel("Sticky note text")).toHaveCount(0);
});

test("old JSON backups restore stage text while malformed custom steps cannot replace a valid workflow", async ({
  page,
}) => {
  await page.goto("/researchos/");
  await adminSignIn(page);
  const backup = await page.evaluate(() => ({
    ...JSON.parse(localStorage.getItem("researchos-mvp-v1")!),
    __stageWorkflows: {
      pudo: {
        "0": {
          checked: [false, true, false, false],
          notes: "Notes from an older export.",
          status: "Complete",
        },
      },
    },
  }));
  await navigate(page, "Settings");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "legacy-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(
    page.getByText("Backup restored", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Rickshaw PUDO");
  const notes = page.getByRole("region", {
    name: "Stage sticky notes",
    exact: true,
  });
  await expect(notes.getByLabel("Sticky note text")).toHaveValue(
    "Notes from an older export.",
  );
  await expect(page.getByLabel("Stage status")).toHaveValue("Complete");
  const before = await page.evaluate(() =>
    localStorage.getItem("researchos-stages-pudo"),
  );
  const bad = structuredClone(backup) as any;
  bad.__stageWorkflows.pudo["0"].todos = [
    { id: "invalid-item", title: "Invalid completion type", done: "yes" },
  ];
  await navigate(page, "Settings");
  await page.evaluate(() => {
    window.confirm = () => true;
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid-workflow.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByText(/Could not restore backup/)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("researchos-stages-pudo")),
  ).toBe(before);
});
