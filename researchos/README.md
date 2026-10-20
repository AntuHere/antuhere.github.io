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

This first version uses **local storage with manual backup**, as requested:

- Projects, tasks, literature, notes and planned collaborators live in this browser's localStorage.
- Each project's nine pipeline stages have separate custom work steps and sticky notes. Add your own to-dos; no fixed checklist is shown. Existing working notes become editable stage sticky notes.
- Uploaded documents live in this browser's IndexedDB. They survive reloads, but they are not uploaded to a server.
- **Settings → Export backup** downloads JSON containing records and stage workflows. On another device, use **Settings → Import backup**. Import replaces that device's workspace; it does not merge changes.
- JSON backup does **not** contain uploaded document contents. Keep originals in Drive or another file store and attach their links for use across devices.
- Browser storage can be cleared. Export backups regularly. The six starting projects and their progress are illustrative sample data, not verified research results.

Hosting does not enable automatic synchronization, accounts, shared permissions, or live collaboration. Planned invitations remain local records and do not send email. Cloud synchronization can be added separately when an authentication/storage service is selected. Portfolio and ResearchOS use the same website origin; local browser data is not an authenticated private cloud workspace.

## Checks

Build first, then run browser tests from the root:

```sh
cd researchos
npx playwright install chromium
cd ..
npm run test:researchos
```

The runner uses Python 3 to serve the production `build/` directory. For an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` instead of downloading a browser. Tests cover desktop and phone navigation, direct URLs, project/task/note editing, local persistence, project-stage isolation, JSON export/import, invalid backup rejection, document upload/download and responsive layout. External fonts and analytics are excluded from these local browser checks.

The original portfolio's Jest suite has a pre-existing setup failure: undeclared `jest-canvas-mock`, `enzyme`, and `enzyme-adapter-react-16` imports. This integration does not disable or replace that test suite.
