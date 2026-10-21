# Connect ResearchOS to your Google Drive

ResearchOS is published at https://antuhere.github.io/researchos/. Open it on your phone or laptop and log in with username **antuhere** and your configured workspace password. **Remember me on this browser** is enabled by default. This is a convenience lock on a public static site, not secure server authentication. Signing out clears the remembered login without deleting your local workspace.

Google is optional: notes, project records, the tracker and local file uploads work without it. Connect Google Drive in **Settings** (or a project’s **Documents vault**) when you want cloud file uploads or automatic workspace sync. Google authentication and live Drive uploads require a Web client ID. No Google password, API key, service account, or client secret belongs in the site or in chat.

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
8. Visit [ResearchOS](https://antuhere.github.io/researchos/), log in with your workspace username and password, open **Settings**, paste the client ID into the Drive setup field, and click **Sign in with Google**. Choose `nasfiqul.antu@gmail.com` and grant Drive file access. Allow the Google popup. Changes in Google Cloud may take a few minutes to apply.

The public client ID is remembered after a successful sign-in. Repeat step 8 on your phone. For setup without entering it on every browser, put the public client ID in `researchos/public/google-config.json` and rebuild/deploy. **Never put a client secret in that file.** The owner account is fixed in `GoogleGate.tsx`; changing the JSON email does not change the permitted owner.

If Google reports `origin_mismatch`, check step 6. If access is blocked in Testing mode, check the test user and scopes. If Drive returns `accessNotConfigured`, enable Drive API in the same project that owns the client ID. A Testing application may require renewed consent after seven days; Google also expires short-lived access tokens, generally around an hour. ResearchOS disconnects Drive when access expires. Your admin login and local workspace remain available. Google remembers its own account session; ResearchOS keeps short-lived Google access in this tab’s session storage and verifies it with Google when restoring after a reload. Refreshing or navigating away and back in the same tab reuses access until its original expiry. Closing the tab, expired access, revoked access, or choosing **Disconnect Drive** requires reconnecting. Reconnecting reuses the hinted Google account and existing consent where Google allows; popups, renewed consent, and Google account sign-in can still be required. Staying connected over multiple days needs a private backend that securely stores and renews Google authorization; GitHub Pages alone cannot provide that.

## Your project folders and documents

New projects create the following private folders. Existing projects create/discover theirs when you open **Documents vault**:

```text
ResearchOS/
  Workspace sync/  (private workspace history; managed by ResearchOS)
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

Drive now synchronizes both uploaded documents and workspace records. To bring **existing laptop notes** to your phone:

1. Refresh ResearchOS on the laptop containing your notes. Open **Settings**, connect `nasfiqul.antu@gmail.com`, click **Sync now**, and wait for **Workspace saved to Drive**.
2. Refresh ResearchOS on your phone, log in normally, then connect the same Google account in **Settings**. Its projects, stage work steps, stage sticky notes, project notes, tasks, paper tracking, asset links and planned collaborators load automatically.
3. Open the same project and the same pipeline stage. Use **Sync now** to check immediately if needed.

Your username/password login stays unchanged. It opens the app; it does not authorize Google access. Both devices must connect Drive for automatic sync. Disconnected devices continue saving locally until they reconnect. Uploads start after a short editing pause; connected visible tabs check every 30 seconds and on focus/returning online. Background mobile tabs cannot sync while the browser suspends them. Google access expiry still requires reconnecting as described above.

Independent additions and edits merge. If two devices change the same field differently, sync pauses and keeps each browser's copy. In **Settings → Sync across devices**, export your browser backup before choosing **Load latest Drive copy** or **Keep this browser copy**. Those choices apply to the whole workspace. Before applying a changed cloud workspace, a previous browser copy is saved and can be downloaded from Settings. Drive uploads create immutable JSON snapshots with parent markers so simultaneous writes remain recoverable. Old snapshots are retained in **ResearchOS/Workspace sync** without automatic cleanup; do not manually edit or delete this folder while sync is in use. Snapshot metadata is app-private, and Drive sharing permissions remain unchanged.

Manual **Export backup / Import backup** remains available. Import replaces local records and syncs that replacement when Drive is connected. JSON does not contain document bytes, OAuth tokens or login credentials. File bytes upload separately through the vault; a pending browser-only file is unavailable on another device until its upload succeeds. Synchronized project IDs allow the phone's vault to discover the same project folders.

Project pages open directly into the pipeline without a separate Next steps list, status/progress summary cards, research-objective card or project-contents tiles. Existing project fields remain editable in Edit project, and earlier task records are still available in the Task board.

Each of the nine pipeline stages has its own editable to-do/work-step list and sticky notes. Add, edit, complete or delete work steps; there are no fixed checklist templates. Older working notes appear as one editable sticky note within their original stage. New stage notes stay separate from the project-wide notebook. Older checklist completion values are retained in backups but are not displayed as tasks.

Sticky notes support direct editing, colors and pins. The paper sheet supports abstract summary, DOI, gap, methods, findings, relevance, authors, year, additional notes and reading status. Both are included in JSON backups; the paper sheet also exports CSV with formula-leading values escaped for spreadsheets.

## Access and AI limits

The admin screen checks the configured username and password digest in the browser and remembers a login flag when selected; it does not save the password. Anyone can inspect the public app code or bypass this convenience lock. It cannot enforce private access on GitHub Pages. Google independently verifies the owner account `nasfiqul.antu@gmail.com` and checks OAuth authorization for Drive file requests. Admin login alone never grants access to Drive. Signing out or disconnecting Drive clears the cached short-lived access token, while local notes and browser file copies remain on your device. No research file contents or Google access tokens are committed to the repository.

The **AI assistant** panel prepares and copies a project-context prompt. It makes no AI requests yet. A later connection needs a private backend that verifies user identity and stores AI service credentials on the server. Do not paste AI API keys into the frontend, public configuration, or browser storage.

## Validation

Set `RESEARCHOS_TEST_PASSWORD` to the configured workspace password in your local test environment (do not commit it). Run `npm run build`, the ResearchOS TypeScript check, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:researchos -- --workers=1`. Integration tests simulate Google sign-in and Drive responses: they verify admin login, remembered access, sign-out, optional Drive connection, owner rejection, access denial, folder/category creation, uploads, recovery/retry, original-byte downloads, previews, sticky-note persistence, two isolated laptop/phone sessions syncing through a shared simulated Drive, concurrent snapshot merging, conflict recovery, interrupted sync retry, sheet exports, and existing portfolio/workspace behavior. They do **not** prove live OAuth configuration or live Google Drive access. Complete the one-time setup above to validate those against your account.
