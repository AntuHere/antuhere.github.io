# ResearchOS on Antu's portfolio

Adapted from the supplied ResearchOS v0.2 workspace. The portfolio remains at `/` and ResearchOS lives at `/researchos/`. GitHub Pages redirects `/researchos` to that directory, so direct visits and reloads work without SPA rewrites. No separate domain or repository is required.

## Install and develop

From the repository root, use Node **22.23.3** (`nvm use` reads `.nvmrc`):

```sh
npm ci --legacy-peer-deps --ignore-scripts
npm --prefix researchos ci
npm start
```

The portfolio's development server includes a compiled ResearchOS preview at `/researchos/`. Restart it to rebuild that preview after editing ResearchOS. For ResearchOS hot reload instead:

```sh
npm run start:researchos
```

Open `/researchos/` on the Vite port printed in the terminal. The back-to-portfolio link is intended for the combined site; Vite alone does not serve the portfolio.

The portfolio's historical dependencies need `--legacy-peer-deps`. Lifecycle scripts are skipped only for that legacy install to avoid obsolete native development tooling in its Git dependency; its runtime files have been verified by the production build. ResearchOS has an independent lockfile and uses a normal frozen install. Node 24 can build the portfolio, but its old development server requires an API removed in Node 24. Node 22 supports both applications.

## Build and publish

From the repository root:

```sh
npm run build
```

This builds the original portfolio into `build/`, then ResearchOS into `build/researchos/`. ResearchOS asset URLs start with `/researchos/`. Publish the **whole `build/` folder** to the existing `antuhere.github.io` GitHub Pages site, preserving the portfolio at the root.

The existing deployment command now includes both applications:

```sh
npm run deploy
```

That command preserves the published portfolio's generated GitHub profile data when absent locally, builds both apps, and pushes `build/` to the `gh-pages` branch. It requires GitHub push access. In repository **Settings → Pages**, use that branch with folder `/ (root)` if using this deployment method. Building or editing locally does not publish the website. Do not deploy `researchos/` source files or just its subdirectory over the portfolio root.

## Use on a laptop and phone

After deployment, visit **https://antuhere.github.io/researchos/** from either device. The interface adapts to touch screens and has a collapsible navigation menu.

ResearchOS saves records locally first and **automatically syncs through Google Drive when connected**:

1. On the laptop that contains your notes, refresh ResearchOS, open **Settings**, and connect Drive as `nasfiqul.antu@gmail.com`.
2. Click **Sync now** and wait for **Workspace saved to Drive** before opening the other device.
3. On your phone, refresh ResearchOS, use the same admin login, and connect the same Google account in **Settings**. The workspace loads automatically; **Sync now** also checks immediately.
4. Open the same project and pipeline stage. Its custom work steps and sticky notes now appear on both devices.

Edits upload after a short pause. Connected, visible tabs check for other-device changes every 30 seconds and when brought back into focus. Your admin login does not itself connect Drive. Google access can expire; reconnect when prompted. See [Google setup and sync details](../docs/researchos-google-setup.md).

- Sync includes projects, tasks, literature tracking, notes, asset links, planned collaborators, and each project's nine stage workflows. Older stage working notes remain readable as sticky notes.
- Pending edits remain in the browser until Drive confirms the save. Independent edits merge; conflicting edits to the same field pause sync with explicit recovery choices in Settings.
- Without Drive, records remain local to that browser. **Settings → Export backup / Import backup** remains available for manual transfers. Import replaces local records and syncs that replacement if connected.
- Uploaded documents have a separate IndexedDB recovery copy and upload through the project's categorized Drive vault. Workspace JSON does **not** contain document bytes; pending local files are not available on another device until uploaded.
- Before applying a different cloud workspace, ResearchOS keeps a previous browser copy downloadable from Settings. Immutable JSON snapshots remain in the private Drive **Workspace sync** folder; do not delete or edit these while using sync. They currently accumulate without automatic cleanup.
- Browser storage can be cleared. Keep independent backups. The six starting projects and their progress are illustrative sample data, not verified research results.

The admin screen is a convenience lock on a public static site. Google authorization separately protects private Drive files; no sharing permissions are changed. Planned invitations do not send email or grant workspace access. This is a personal sync workspace, not a multi-user collaboration service.

## Checks

Build first, then run browser tests from the root:

```sh
cd researchos
npx playwright install chromium
cd ..
npm run test:researchos
```

The runner uses Python 3 to serve the production `build/` directory. For an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` instead of downloading a browser. Set `RESEARCHOS_TEST_PASSWORD` to the configured workspace password in your local test environment. Tests cover separate laptop/phone sessions sharing a simulated Drive, concurrent edits and conflict recovery, failed sync retries, desktop and phone navigation, direct URLs, project/task/note editing, local persistence, project-stage isolation, JSON export/import, invalid backup rejection, document upload/download and responsive layout. External fonts and analytics are excluded from these local browser checks.

The original portfolio's Jest suite has a pre-existing setup failure: undeclared `jest-canvas-mock`, `enzyme`, and `enzyme-adapter-react-16` imports. This integration does not disable or replace that test suite.
