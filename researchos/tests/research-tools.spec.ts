import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
import { mockGoogle, signIn, navigate } from "./google-mock";

test("unconfigured, wrong-account and denied sign-in keep workspace closed", async ({
  page,
}) => {
  await mockGoogle(page, { configured: false });
  await page.goto("/researchos/");
  await expect(page.getByLabel("Google OAuth Web client ID")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Google" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toHaveCount(0);
  await mockGoogle(page, { email: "someone@example.com" });
  await page.reload();
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Choose that Google account",
  );
  await expect(page.locator(".app")).toHaveCount(0);
  await mockGoogle(page, { denied: true });
  await page.reload();
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await expect(page.getByRole("alert")).toContainText("access_denied");
  await expect(page.locator(".app")).toHaveCount(0);
});

test("sticky notes and paper sheet autosave and export safely, sign-out clears access", async ({
  page,
}, info) => {
  await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  await navigate(page, "Research notes");
  await page.getByRole("button", { name: "Quick sticky note" }).click();
  const note = page.locator(".sticky-note").last();
  await note.getByLabel("Sticky note title").fill("Meeting idea");
  await note
    .getByLabel("Sticky note text")
    .fill("Compare traffic patterns before and after the intervention.");
  await note.getByLabel("Note color").selectOption("mint");
  await note.getByRole("button", { name: "Pin note", exact: true }).click();
  await page.reload();
  await signIn(page);
  await navigate(page, "Research notes");
  const pinned = page.locator(".sticky-note").first();
  await expect(pinned.getByLabel("Sticky note title")).toHaveValue(
    "Meeting idea",
  );
  await expect(pinned).toHaveClass(/sticky-mint/);
  await expect(
    pinned.getByRole("button", { name: "Unpin note" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: info.outputPath("sticky-notes.png"),
    fullPage: true,
  });
  await navigate(page, "Literature library");
  const row = page.locator(".paper-sheet tbody tr").first();
  await row
    .getByLabel("Paper title", { exact: true })
    .fill('=HYPERLINK("unsafe")');
  await row.getByLabel("Abstract summary").fill("A longitudinal study");
  await row.getByLabel("Research gap").fill("No comparison across seasons");
  await row.getByLabel("DOI number").fill("10.1000/example");
  await row.getByLabel("Paper reading status").selectOption("Reviewed");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export sheet" }).click();
  const download = await downloadEvent;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("' =".replace(" ", ""));
  expect(csv).toContain("A longitudinal study");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await signIn(page);
  await navigate(page, "Literature library");
  await expect(page.getByLabel("Abstract summary").first()).toHaveValue(
    "A longitudinal study",
  );
  await navigate(page, "AI assistant");
  await page.getByLabel("Your question").fill("Help outline my proposal");
  await expect(page.locator(".assistant-panel pre")).toContainText(
    "Help outline my proposal",
  );
  await expect(page.locator(".assistant-panel")).toContainText(
    "does not send data",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "test-only-token",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your research workspace" }),
  ).toBeVisible();
  await expect(page.locator(".app")).toHaveCount(0);
});

test("project creation uploads proposal, retries interrupted files, previews PDF/DOCX and discovers Drive files after clearing the local file cache", async ({
  page,
}) => {
  const drive = await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  await page
    .locator("main")
    .getByRole("button", { name: "New project", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name").fill("Shared device research");
  await dialog
    .getByLabel("Research proposal file (optional)")
    .setInputFiles({
      name: "proposal.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nproposal"),
    });
  await dialog.getByRole("button", { name: "Save to workspace" }).click();
  await expect(page.getByText("Project folder ready in Drive")).toBeVisible();
  expect(
    drive.files.filter((f) => f.name === "Shared device research"),
  ).toHaveLength(1);
  for (const category of [
    "Papers",
    "Literature Review",
    "Research Proposal",
    "Spreadsheets",
    "Data & Assets",
    "Other",
  ])
    expect(drive.files.filter((f) => f.name === category)).toHaveLength(1);
  const proposal = drive.files.find((f) => f.name === "proposal.pdf");
  expect(proposal.parents[0]).toBe(
    drive.files.find((f) => f.name === "Research Proposal").id,
  );
  await navigate(page, "Projects");
  await page
    .getByRole("button", { name: /Shared device research.*Private/ })
    .click();
  await page.getByRole("tab", { name: "Documents vault" }).click();
  await expect(
    page.locator(".rw-file").filter({ hasText: "proposal.pdf" }),
  ).toContainText("Saved in Drive");
  await page
    .locator(".rw-file")
    .filter({ hasText: "proposal.pdf" })
    .getByRole("button", { name: "Open file", exact: true })
    .click();
  await expect(page.getByTitle("PDF preview")).toBeVisible();
  await page.keyboard.press("Escape");
  drive.failNextUpload();
  await page
    .getByLabel("Upload category", { exact: true })
    .selectOption("Literature Review");
  const docx = zipSync({
    "word/document.xml": strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Original review text &lt;script&gt;safe&lt;/script&gt;</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  await page
    .getByLabel("Upload files", { exact: true })
    .setInputFiles({
      name: "review.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from(docx),
    });
  await expect(page.getByRole("alert")).toContainText(
    "Simulated upload interruption",
  );
  await expect(
    page.locator(".rw-file").filter({ hasText: "review.docx" }),
  ).toContainText("Pending upload");
  await page.getByRole("button", { name: "Retry pending uploads" }).click();
  await expect(
    page.locator(".rw-file").filter({ hasText: "review.docx" }),
  ).toContainText("Saved in Drive");
  expect(drive.files.filter((f) => f.name === "review.docx")).toHaveLength(1);
  expect(drive.files.find((f) => f.name === "review.docx").parents[0]).toBe(
    drive.files.find((f) => f.name === "Literature Review").id,
  );
  await page
    .locator(".rw-file")
    .filter({ hasText: "review.docx" })
    .getByRole("button", { name: "Open file", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator("pre")).toHaveText(
    "Original review text <script>safe</script>",
  );
  await page.getByRole("button", { name: "Close preview" }).click();
  // Clear the browser's cached file bytes: Drive still lists the file and can serve its original bytes.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open("researchos-document-vault-v1", 1);
        r.onsuccess = () => {
          const tx = r.result.transaction("documents", "readwrite");
          tx.objectStore("documents").clear();
          tx.oncomplete = () => {
            r.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await signIn(page);
  await navigate(page, "Projects");
  await page
    .getByRole("button", { name: /Shared device research.*Private/ })
    .click();
  await page.getByRole("tab", { name: "Documents vault" }).click();
  await expect(
    page.locator(".rw-file").filter({ hasText: "review.docx" }),
  ).toContainText("Saved in Drive");
  const event = page.waitForEvent("download");
  await page
    .locator(".rw-file")
    .filter({ hasText: "review.docx" })
    .getByRole("button", { name: "Download file" })
    .click();
  const downloaded = await event;
  expect(await readFile((await downloaded.path())!)).toEqual(Buffer.from(docx));
});

test("legacy browser files retain original bytes and migrate through pending upload", async ({
  page,
}) => {
  const drive = await mockGoogle(page);
  await page.goto("/researchos/");
  await signIn(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open("researchos-document-vault-v1", 1);
        r.onupgradeneeded = () =>
          r.result.createObjectStore("documents", { keyPath: "id" });
        r.onsuccess = () => {
          const tx = r.result.transaction("documents", "readwrite");
          tx.objectStore("documents").put({
            id: "legacy-original",
            projectId: "pudo",
            name: "old-fieldwork.txt",
            size: 11,
            type: "text/plain",
            created: "2026-10-01T00:00:00Z",
            file: new Blob(["old records"], { type: "text/plain" }),
          });
          tx.oncomplete = () => {
            r.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await navigate(page, "Rickshaw PUDO");
  await page.getByRole("tab", { name: "Documents vault" }).click();
  const row = page.locator(".rw-file").filter({ hasText: "old-fieldwork.txt" });
  await expect(row).toContainText("Other · Pending upload");
  await page.getByRole("button", { name: "Retry pending uploads" }).click();
  await expect(row).toContainText("Saved in Drive");
  const saved = drive.files.find((f) => f.name === "old-fieldwork.txt");
  expect(drive.contents.get(saved.id)?.toString()).toBe("old records");
  expect(saved.parents[0]).toBe(drive.files.find((f) => f.name === "Other").id);
});

test("expired Google access returns to sign-in and preserves browser records", async ({
  page,
}) => {
  await page.clock.install();
  await mockGoogle(page, { expire: 10 });
  await page.goto("/researchos/");
  await signIn(page);
  await navigate(page, "Research notes");
  await page.getByRole("button", { name: "Quick sticky note" }).click();
  await page.getByLabel("Sticky note title").last().fill("Keep after expiry");
  await page.clock.fastForward(11000);
  await expect(
    page.getByRole("heading", { name: "Your research workspace" }),
  ).toBeVisible();
  await expect(page.locator(".app")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("researchos-mvp-v1")!).notes.some(
        (n: any) => n.title === "Keep after expiry",
      ),
    ),
  ).toBe(true);
});
