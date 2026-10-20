import { expect, type Page } from "@playwright/test";
export async function mockGoogle(
  page: Page,
  options: {
    email?: string;
    denied?: boolean;
    configured?: boolean;
    expire?: number;
  } = {},
) {
  const files: any[] = [];
  const contents = new Map<string, Buffer>();
  let serial = 0,
    failUploads = 0;
  await page.route("**/researchos/google-config.json", (route) =>
    route.fulfill({
      json: {
        clientId:
          options.configured === false
            ? ""
            : "123-test.apps.googleusercontent.com",
      },
    }),
  );
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.google={accounts:{oauth2:{revoke:()=>{},initTokenClient:(config)=>({requestAccessToken:()=>config.callback(${JSON.stringify(options.denied ? { error: "access_denied" } : { access_token: "test-only-token", expires_in: options.expire || 3600, scope: "https://www.googleapis.com/auth/drive.file openid email profile" })})})}}};`,
    }),
  );
  await page.route("https://www.googleapis.com/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (request.headers()["authorization"] !== "Bearer test-only-token")
      return route.fulfill({
        status: 401,
        json: { error: { message: "Missing access token" } },
      });
    if (url.pathname.includes("/userinfo"))
      return route.fulfill({
        json: {
          email: options.email || "nasfiqul.antu@gmail.com",
          email_verified: true,
          name: "Antu",
        },
      });
    if (url.pathname.startsWith("/upload/")) {
      if (failUploads > 0) {
        failUploads--;
        return route.fulfill({
          status: 503,
          json: { error: { message: "Simulated upload interruption" } },
        });
      }
      const body = request.postDataBuffer()!;
      const separator = body.indexOf("\r\n\r\n");
      const jsonEnd = body.indexOf("\r\n--", separator + 4);
      const metadata = JSON.parse(
        body.subarray(separator + 4, jsonEnd).toString(),
      );
      const dataStart = body.indexOf("\r\n\r\n", jsonEnd + 2) + 4;
      const dataEnd = body.lastIndexOf("\r\n--");
      const id = "file-" + ++serial;
      const file = {
        id,
        mimeType: "application/octet-stream",
        ...metadata,
        webViewLink: "https://drive.google.com/file/d/" + id + "/view",
      };
      files.push(file);
      contents.set(id, body.subarray(dataStart, dataEnd));
      return route.fulfill({ json: file });
    }
    const id = url.pathname.split("/").pop()!;
    if (request.method() === "POST") {
      const file = { id: "folder-" + ++serial, ...request.postDataJSON() };
      files.push(file);
      return route.fulfill({ json: file });
    }
    if (request.method() === "PATCH") {
      Object.assign(
        files.find((f) => f.id === id),
        request.postDataJSON(),
      );
      return route.fulfill({ json: { id } });
    }
    if (url.searchParams.get("alt") === "media")
      return route.fulfill({
        body: contents.get(id) || Buffer.from(""),
        contentType: "application/octet-stream",
      });
    const q = url.searchParams.get("q") || "";
    const parent = q.match(/'([^']+)' in parents/)?.[1];
    const prop = q.match(/key='([^']+)' and value='([^']+)'/);
    const folders = q.includes("mimeType =");
    return route.fulfill({
      json: {
        files: files.filter(
          (f) =>
            (!parent || f.parents?.includes(parent)) &&
            (!prop || f.appProperties?.[prop[1]] === prop[2]) &&
            (!folders || f.mimeType === "application/vnd.google-apps.folder"),
        ),
      },
    });
  });
  return {
    files,
    contents,
    failNextUpload: () => {
      failUploads++;
    },
  };
}
export async function signIn(page: Page) {
  await page
    .getByRole("button", { name: "Sign in with Google", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good to see you back." }),
  ).toBeVisible();
}
export async function navigate(page: Page, name: string) {
  const button = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await button.isVisible()) await button.click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name, exact: true })
    .click();
}
