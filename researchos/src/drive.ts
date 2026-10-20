export const CATEGORIES = [
  "Papers",
  "Literature Review",
  "Research Proposal",
  "Spreadsheets",
  "Data & Assets",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  createdTime?: string;
  appProperties?: Record<string, string>;
  parents?: string[];
};
const FOLDER = "application/vnd.google-apps.folder";
const fields =
  "id,name,mimeType,size,webViewLink,createdTime,appProperties,parents";
const quote = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
export class DriveClient {
  private jobs = new Map<string, Promise<DriveFile>>();
  constructor(
    private token: string,
    private expires: number,
    private expired: () => void,
  ) {}
  async request(url: string, init: RequestInit = {}) {
    if (Date.now() >= this.expires) {
      this.expired();
      throw Error("Google access expired. Sign in again to continue.");
    }
    const headers = new Headers(init.headers);
    headers.set("Authorization", "Bearer " + this.token);
    const response = await fetch(url, { ...init, headers });
    if (response.status === 401) {
      this.expired();
      throw Error("Google access expired. Sign in again to continue.");
    }
    if (!response.ok) {
      let message = "Google Drive request failed (" + response.status + ").";
      try {
        const body = await response.json();
        message = body.error?.message || message;
      } catch {}
      throw Error(message);
    }
    return response;
  }
  async list(q: string) {
    const files: DriveFile[] = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        q,
        fields: "nextPageToken,files(" + fields + ")",
        pageSize: "100",
        orderBy: "createdTime",
        ...(pageToken ? { pageToken } : {}),
      });
      const response = await this.request(
        "https://www.googleapis.com/drive/v3/files?" + params,
      );
      const data = await response.json();
      files.push(...(data.files || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
    return files;
  }
  private folder(
    key: string,
    name: string,
    property: string,
    value: string,
    parent?: string,
  ): Promise<DriveFile> {
    const existing = this.jobs.get(key);
    if (existing) return existing;
    const job = (async () => {
      const q =
        `trashed = false and mimeType = '${FOLDER}' and appProperties has { key='${quote(property)}' and value='${quote(value)}' }` +
        (parent ? ` and '${quote(parent)}' in parents` : "");
      const found = (await this.list(q))[0];
      if (found) return found;
      const response = await this.request(
        "https://www.googleapis.com/drive/v3/files?fields=" + fields,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            mimeType: FOLDER,
            appProperties: { [property]: value },
            ...(parent ? { parents: [parent] } : {}),
          }),
        },
      );
      return (await response.json()) as DriveFile;
    })();
    this.jobs.set(key, job);
    job.catch(() => this.jobs.delete(key));
    return job;
  }
  root() {
    return this.folder("root", "ResearchOS", "researchosRoot", "v1");
  }
  async ensureProject(project: { id: string; name: string }) {
    const root = await this.root();
    const folder = await this.folder(
      "project:" + project.id,
      project.name,
      "researchosProjectId",
      project.id,
      root.id,
    );
    if (folder.name !== project.name) {
      await this.request(
        "https://www.googleapis.com/drive/v3/files/" +
          encodeURIComponent(folder.id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: project.name }),
        },
      );
      folder.name = project.name;
    }
    await Promise.all(
      CATEGORIES.map((category) =>
        this.folder(
          "category:" + project.id + ":" + category,
          category,
          "researchosCategory",
          category,
          folder.id,
        ),
      ),
    );
    return folder;
  }
  async category(project: { id: string; name: string }, category: Category) {
    const parent = await this.ensureProject(project);
    return this.folder(
      "category:" + project.id + ":" + category,
      category,
      "researchosCategory",
      category,
      parent.id,
    );
  }
  async upload(
    project: { id: string; name: string },
    category: Category,
    file: Blob,
    name: string,
    localId: string,
  ) {
    // Check the idempotency marker after uncertain network errors, so retrying
    // an upload does not intentionally create another copy of the same file.
    const folder = await this.category(project, category);
    const found = (
      await this.list(
        `trashed = false and '${quote(folder.id)}' in parents and appProperties has { key='researchosDocumentId' and value='${quote(localId)}' }`,
      )
    )[0];
    if (found) return found;
    const metadata = {
      name,
      parents: [folder.id],
      appProperties: {
        researchosDocumentId: localId,
        researchosCategory: category,
      },
    };
    const boundary = "researchos-" + crypto.randomUUID();
    const body = new Blob([
      "--" +
        boundary +
        "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      "\r\n--" +
        boundary +
        "\r\nContent-Type: " +
        (file.type || "application/octet-stream") +
        "\r\n\r\n",
      file,
      "\r\n--" + boundary + "--\r\n",
    ]);
    const response = await this.request(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=" +
        fields,
      {
        method: "POST",
        headers: { "Content-Type": "multipart/related; boundary=" + boundary },
        body,
      },
    );
    return (await response.json()) as DriveFile;
  }
  async documents(project: { id: string; name: string }) {
    const result: ({ category: Category } & DriveFile)[] = [];
    for (const category of CATEGORIES) {
      const folder = await this.category(project, category);
      const files = await this.list(
        `trashed = false and '${quote(folder.id)}' in parents`,
      );
      for (const file of files)
        if (file.mimeType !== FOLDER) result.push({ ...file, category });
    }
    return result;
  }
  async download(id: string) {
    return (
      await this.request(
        "https://www.googleapis.com/drive/v3/files/" +
          encodeURIComponent(id) +
          "?alt=media",
      )
    ).blob();
  }
  async trash(id: string) {
    await this.request(
      "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true }),
      },
    );
  }
}
