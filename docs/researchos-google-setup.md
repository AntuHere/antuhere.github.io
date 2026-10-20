# Connect ResearchOS to your Google Drive

ResearchOS is published at https://antuhere.github.io/researchos/. The code is ready for Google sign-in and Drive uploads. **Google authentication and live uploads cannot work until you create a Web client ID.** No Google password, API key, service account, or client secret belongs in the site or in chat.

## One-time setup (your Google account)

1. Open [Google Cloud Console](https://console.cloud.google.com/) as `nasfiqul.antu@gmail.com`. Create or select a project, for example **ResearchOS**.
2. Open **APIs & Services → Library**, search for **Google Drive API**, and click **Enable**.
3. Open **Google Auth Platform**. If prompted, click **Get started** and complete the application information: name **ResearchOS**, your email as the support and developer contact, and **External** audience for a personal Gmail account.
4. In **Audience**, leave the application in **Testing** and add `nasfiqul.antu@gmail.com` under **Test users**.
5. In **Data Access**, add the scopes `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`, and `https://www.googleapis.com/auth/drive.file`. The app asks for these as `openid email profile` and `drive.file`. The Drive scope allows access to files this app creates or that are explicitly granted to it; it does not give this app all of your existing Drive files.
6. In **Clients**, create an OAuth client of type **Web application**. Under **Authorized JavaScript origins**, add exactly:
   ```text
   https://antuhere.github.io
   ```
   The origin has no `/researchos/` path or trailing slash. This implementation uses a Google popup/token flow, so **Authorized redirect URIs can be left empty**. For local development only, optionally add the exact local origin you use, e.g. `http://localhost:5173`.
7. Copy the **Client ID**, which ends in `.apps.googleusercontent.com`. Do not copy the client secret.
8. Visit [ResearchOS](https://antuhere.github.io/researchos/), paste the client ID into the one-time setup field, and click **Sign in with Google**. Choose `nasfiqul.antu@gmail.com` and grant Drive file access. Allow the Google popup. Changes in Google Cloud may take a few minutes to apply.

The public client ID is remembered after a successful sign-in. Repeat step 8 on your phone. For setup without entering it on every browser, put the public client ID in `researchos/public/google-config.json` and rebuild/deploy. **Never put a client secret in that file.** The owner account is fixed in `GoogleGate.tsx`; changing the JSON email does not change the permitted owner.

If Google reports `origin_mismatch`, check step 6. If access is blocked in Testing mode, check the test user and scopes. If Drive returns `accessNotConfigured`, enable Drive API in the same project that owns the client ID. A Testing application may require renewed consent after seven days; Google also expires short-lived access tokens, generally around an hour. ResearchOS asks you to sign in again when access expires. Google remembers its own account session; ResearchOS keeps access tokens only in memory, so a page reload also requires sign-in.

## Your project folders and documents

New projects create the following private folders. Existing projects create/discover theirs when you open **Documents vault**:

```text
ResearchOS/
  Your project name/
    Papers/
    Literature Review/
    Research Proposal/
    Spreadsheets/
    Data & Assets/
    Other/
```

Choose a category in the vault, then select one or more files (up to 50 MB each). A proposal selected during project creation goes into **Research Proposal**. Files are uploaded to Drive with their original bytes. Click **Refresh Drive** to reload files this app is authorized to access. The `drive.file` scope can hide files added independently in Drive: upload through ResearchOS, or add a Drive link for those files. Folder IDs are matched using private app metadata, so renaming a project updates its existing folder. The app does not make files public or change sharing permissions.

Uploads first save a browser recovery copy in IndexedDB. A failed upload stays **Pending upload** until **Retry pending uploads** succeeds. If an upload succeeds on Drive but the response is lost, retry searches its document marker before uploading another copy. This reduces duplicates; concurrent uploads from independent browser tabs are not a transactional operation. Existing browser-only vault files are preserved under **Other** and can be uploaded with the same retry button. **Remove local** removes only the browser copy; it never deletes the Drive original. Keep pending copies until Drive confirms success.

PDF files have an embedded browser preview (some mobile browsers may download instead). DOCX files have a safe text preview; open the Drive link for Google’s formatted preview/editor. Spreadsheets and other formats can be downloaded or opened in Drive. Files created with Google-native editors should be opened in Drive; this app downloads ordinary uploaded files, not Google-native document exports.

## Laptop and phone

Drive documents are shared through the signed-in account. Project records, sticky notes, tasks, stage checklists and paper-tracking cells still save **locally in each browser**. Use **Settings → Export backup**, transfer the JSON backup, then **Import backup** on the other device. This is a manual replacement, not automatic record merging; export the destination workspace first if it contains changes you want to retain. JSON does not contain document bytes. Once the same project IDs are restored, its vault discovers the same Drive folders and files. Editing only the folder name or creating a fresh project with the same title does not link it to an old project ID.

Sticky notes support direct editing, colors and pins. The paper sheet supports abstract summary, DOI, gap, methods, findings, relevance, authors, year, additional notes and reading status. Both are included in JSON backups; the paper sheet also exports CSV with formula-leading values escaped for spreadsheets.

## Access and AI limits

The sign-in screen mounts the workspace only after Google verifies the selected owner account. GitHub Pages still serves the application code publicly. A frontend gate cannot prevent someone modifying their own copy of the app, and it is not a server-protected private website. Google Drive independently checks OAuth authorization for every file request. Local browser data remains on your device after sign-out; use your own device/account, and export a backup before clearing browser storage. No research document contents or OAuth tokens are committed to the repository.

The **AI assistant** panel prepares and copies a project-context prompt. It makes no AI requests yet. A later connection needs a private backend that verifies user identity and stores AI service credentials on the server. Do not paste AI API keys into the frontend, public configuration, or browser storage.

## Validation

Run `npm run build`, the ResearchOS TypeScript check, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:researchos -- --workers=1`. Integration tests simulate Google sign-in and Drive responses: they verify owner rejection, access denial, folder/category creation, uploads, recovery/retry, original-byte downloads, previews, sticky-note persistence, sheet exports, and existing portfolio/workspace behavior. They do **not** prove live OAuth configuration or live Google Drive access. Complete the one-time setup above to validate those against your account.
