import { test, expect, devices, type Page } from "@playwright/test";
import {
  adminSignIn,
  createDriveMockState,
  mockGoogle,
  navigate,
  signIn,
} from "./google-mock";
import {
  initialWorkspace,
  mergeWorkspaces,
  SyncConflict,
  WorkspaceCloud,
  type Workspace,
} from "../src/workspaceSync";
import type { DriveClient, DriveFile } from "../src/drive";

async function setup(page: Page, backend = createDriveMockState()) {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:4173/")
      ? route.continue()
      : route.abort(),
  );
  const mock = await mockGoogle(page, {}, backend);
  await page.goto("/researchos/");
  return mock;
}
async function saved(page: Page) {
  await expect(page.locator(".local-storage-banner")).toContainText(
    "Workspace saved to Drive",
  );
}
async function sync(page: Page) {
  await navigate(page, "Settings");
  await expect(
    page.getByRole("button", { name: "Sync now", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Sync now", exact: true }).click();
  await saved(page);
}
const stageNotes = (page: Page) =>
  page.getByRole("region", { name: "Stage sticky notes", exact: true });
async function addNote(page: Page, text: string) {
  await stageNotes(page)
    .getByRole("button", { name: "Quick sticky note" })
    .click();
  await stageNotes(page).getByLabel("Sticky note text").last().fill(text);
}

test("laptop workflow notes and new projects appear on a fresh phone, with phone edits returning to the laptop", async ({
  page,
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One test exercises two separate desktop/phone contexts.",
  );
  const backend = createDriveMockState();
  await setup(page, backend);
  await adminSignIn(page);
  // Existing laptop notes must upload on the first connection, without an export.
  await navigate(page, "Rickshaw PUDO");
  await addNote(page, "Laptop concept note");
  await page
    .getByLabel("New to-do or work step")
    .fill("Collect field observations");
  await page.getByRole("button", { name: "Add to-do", exact: true }).click();
  await navigate(page, "Overview");
  await page
    .locator("main")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Project name")
    .fill("My synced study");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save to workspace" })
    .click();
  await navigate(page, "Overview");
  await signIn(page);
  await saved(page);

  const mobile = await browser.newContext({
    ...devices["Pixel 7"],
    baseURL: "http://127.0.0.1:4173",
  });
  try {
    const phone = await mobile.newPage();
    await setup(phone, backend);
    await signIn(phone);
    await saved(phone);
    await navigate(phone, "Projects");
    await expect(
      phone.getByRole("button", { name: /My synced study/ }),
    ).toBeVisible();
    await navigate(phone, "Rickshaw PUDO");
    await expect(stageNotes(phone).getByLabel("Sticky note text")).toHaveValue(
      "Laptop concept note",
    );
    await expect(
      phone.getByRole("textbox", { name: "Work step title", exact: true }),
    ).toHaveValue("Collect field observations");
    await stageNotes(phone)
      .getByLabel("Sticky note text")
      .fill("Updated from phone");
    await saved(phone); // Autosave, without the manual sync button.
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await saved(page);
    await navigate(page, "Rickshaw PUDO");
    await expect(stageNotes(page).getByLabel("Sticky note text")).toHaveValue(
      "Updated from phone",
    );
    expect(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await phone.screenshot({
      path: info.outputPath("synced-phone-workflow.png"),
      fullPage: true,
    });
    await sync(phone);
    await expect(
      phone.getByRole("button", { name: "Download previous browser copy" }),
    ).toBeVisible();
  } finally {
    await mobile.close();
  }
});

test("failed sync retains local notes across reload and a retry uploads them", async ({
  page,
}) => {
  const mock = await setup(page);
  await signIn(page);
  await saved(page);
  await navigate(page, "Rickshaw PUDO");
  await addNote(page, "Keep this offline note");
  mock.failNextWorkspaceUpload();
  await navigate(page, "Settings");
  await page.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect(page.locator(".local-storage-banner")).toContainText(
    "Simulated upload interruption",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("researchos-stages-pudo")),
  ).toContain("Keep this offline note");
  await page.reload();
  await signIn(page);
  await saved(page);
  await navigate(page, "Rickshaw PUDO");
  await expect(stageNotes(page).getByLabel("Sticky note text")).toHaveValue(
    "Keep this offline note",
  );
  expect(
    [...mock.contents.values()].some((body) =>
      body.toString().includes("Keep this offline note"),
    ),
  ).toBe(true);
});

test("conflicting note edits pause syncing and keep the browser copy until a deliberate choice", async ({
  page,
}) => {
  const mock = await setup(page);
  await signIn(page);
  await saved(page);
  await navigate(page, "Rickshaw PUDO");
  await addNote(page, "Original note");
  await sync(page);
  const snapshots = mock.files.filter(
    (f) => f.appProperties?.researchosWorkspace,
  );
  const previous = snapshots.at(-1)!;
  const version = JSON.parse(mock.contents.get(previous.id)!.toString());
  const branch = structuredClone(version);
  branch.commitId = "a".repeat(32);
  branch.parents = [version.commitId];
  branch.workspace.__stageWorkflows.pudo["0"].stickyNotes[0].body =
    "Changed on another device";
  mock.files.push({
    ...previous,
    id: "remote-conflict",
    createdTime: "2099-01-01T00:00:00.000Z",
    appProperties: {
      researchosWorkspace: "v1",
      syncId: branch.commitId,
      syncParents0: version.commitId,
    },
  });
  mock.contents.set("remote-conflict", Buffer.from(JSON.stringify(branch)));
  await navigate(page, "Rickshaw PUDO");
  await stageNotes(page)
    .getByLabel("Sticky note text")
    .fill("Keep my laptop edit");
  await navigate(page, "Settings");
  await page.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect(page.locator(".local-storage-banner")).toContainText(
    "Sync is paused",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("researchos-stages-pudo")),
  ).toContain("Keep my laptop edit");
  await expect(
    page.getByRole("button", { name: "Export browser backup", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Load latest Drive copy", exact: true })
    .click();
  await saved(page);
  await expect(
    page.getByRole("button", { name: "Download previous browser copy" }),
  ).toBeVisible();
  await navigate(page, "Rickshaw PUDO");
  await expect(stageNotes(page).getByLabel("Sticky note text")).toHaveValue(
    "Changed on another device",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("researchos-sync-recovery-v1"),
    ),
  ).toContain("Keep my laptop edit");
});

function stageNote(workspace: Workspace, id: string, body: string) {
  const stage = (workspace.__stageWorkflows.pudo["0"] ??= {
    checked: [false, false, false, false],
    status: "Not started",
    notes: "",
    todos: [],
    stickyNotes: [],
  });
  stage.stickyNotes!.push({
    id,
    projectId: "pudo",
    title: id,
    body,
    updated: "2026-10-21",
  });
}
test("merging independent notes preserves additions and deletions, while same-note edits conflict", () => {
  const base = initialWorkspace();
  stageNote(base, "existing", "Original");
  const laptop = structuredClone(base),
    phone = structuredClone(base);
  stageNote(laptop, "laptop", "Laptop");
  stageNote(phone, "phone", "Phone");
  const merged = mergeWorkspaces(base, laptop, phone);
  expect(
    merged.__stageWorkflows.pudo["0"].stickyNotes!.map((n) => n.id).sort(),
  ).toEqual(["existing", "laptop", "phone"]);
  laptop.__stageWorkflows.pudo["0"].stickyNotes!.shift();
  expect(
    mergeWorkspaces(base, laptop, phone)
      .__stageWorkflows.pudo["0"].stickyNotes!.map((n) => n.id)
      .sort(),
  ).toEqual(["laptop", "phone"]);
  const first = structuredClone(base),
    second = structuredClone(base);
  first.__stageWorkflows.pudo["0"].stickyNotes![0].body = "One";
  second.__stageWorkflows.pudo["0"].stickyNotes![0].body = "Two";
  expect(() => mergeWorkspaces(base, first, second)).toThrow(SyncConflict);
});

test("concurrent Drive snapshots retain both branches and merge against their common ancestor", async () => {
  const files: DriveFile[] = [],
    contents = new Map<string, Blob>();
  const drive = {
    workspaceVersions: async () => files,
    download: async (id: string) => contents.get(id)!,
    createWorkspaceVersion: async (
      content: string,
      appProperties: Record<string, string>,
    ) => {
      const id = "snapshot-" + files.length;
      files.push({
        id,
        name: id,
        mimeType: "application/json",
        createdTime: new Date(1000 + files.length).toISOString(),
        appProperties,
      });
      contents.set(id, new Blob([content]));
    },
  } as unknown as DriveClient;
  const cloud = new WorkspaceCloud(drive),
    base = initialWorkspace();
  await cloud.write(base, []);
  const ancestors = [...files];
  const laptop = structuredClone(base),
    phone = structuredClone(base);
  stageNote(laptop, "laptop", "Independent laptop note");
  stageNote(phone, "phone", "Independent phone note");
  await cloud.write(laptop, ancestors);
  await cloud.write(phone, ancestors);
  const combined = await cloud.read();
  expect(combined.files).toHaveLength(2);
  expect(
    combined
      .workspace!.__stageWorkflows.pudo["0"].stickyNotes!.map((n) => n.id)
      .sort(),
  ).toEqual(["laptop", "phone"]);
  await cloud.write(combined.workspace!, combined.files);
  expect((await cloud.read()).files).toHaveLength(1);
  expect(files).toHaveLength(4); // Previous snapshots remain recoverable.
});
