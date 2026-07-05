# ACCELQ QuickTrigger

A dashboard for triggering ACCELQ template job runs and watching them through to completion, without leaving the browser. Built with Vite + React (JavaScript) + Tailwind CSS, and shippable either as a static site or as a Chrome extension.

## What it does

- **Tiles**: each tile holds the connection details for one ACCELQ template job — Base URL, Tenant Code, Project Name, Template Job ID, User ID, API Key, and a per-tile poll frequency (default 10s). Tiles are saved in `localStorage`, and the dashboard groups them into sections by Tenant Code.
- **Run**: the Run button `POST`s to the template's run endpoint, captures the returned `jobPid`, then automatically polls the job status endpoint at the configured interval.
- **Auto-stop**: polling stops on its own once the job reaches a terminal status (`completed`, `aborted`, `failed`, `error`, `cancelled`, etc. — case-insensitive). It also resumes automatically if you reload the page mid-run.
- **Paste-a-curl**: instead of filling the tile form by hand, paste a curl command (either the "run template" or the "job status" curl ACCELQ gives you) and click **Fill fields from curl** to auto-populate Base URL, Tenant Code, Project Name, Template Job ID, User ID, and API Key.
- **Details view**: clicking a tile opens a readable summary of the latest run — status, pass/fail/not-run counts, scenario/dataset info, agent/platform, test case list, and a link to the full ACCELQ result page — with the raw request/response JSON for both API calls available behind a "View request & raw response" toggle.

## Getting started

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

This runs three steps and produces three outputs:

| Output | What it is |
|---|---|
| `plugin_assets/` | The plain Vite/React production build (a static site) |
| `plugin/build/` | The same build merged with the Chrome extension scaffolding (`manifest.json`, `background.js`, icons) — load this unpacked via `chrome://extensions` |
| `plugin/dist/accelq-quicktrigger-<version>.zip` | `plugin/build/` zipped up, ready to share or upload |

## Why a Chrome extension?

`app.accelq.io` doesn't return CORS headers, so a browser calling it directly from a normal web page (including this app hosted as a static site) will have its requests blocked — this affects every hosting option (GitHub Pages, localhost, etc.) equally, since CORS is enforced by the browser based on the *server's* response headers, not where the page is hosted.

Chrome extension pages are exempt from this restriction for any host listed in `host_permissions` (see `plugin/src/manifest.json`, currently `https://*.accelq.io/*`). So the same dashboard code, when opened as `chrome-extension://<id>/index.html` instead of `https://...`, can call the ACCELQ APIs directly with no proxy required.

### Installing the extension

1. `npm run build`
2. Open `chrome://extensions`, enable **Developer mode**
3. Click **Load unpacked** and select `plugin/build/`
4. Click the extension's icon — it opens the dashboard in a new tab (not a popup)

Alternatively, distribute `plugin/dist/accelq-quicktrigger-<version>.zip` and have others load it the same way (unzip first) or upload it to the Chrome Web Store.

## Project structure

```
src/                      React app source
  components/             TileCard, TileForm, JobDetailsModal, RunSummary, Icons
  hooks/useTiles.js        localStorage-backed state + trigger/poll orchestration
  utils/
    api.js                 request builders, fetch execution, terminal-status check
    curl.js                 curl command parser (paste-to-fill feature)
    storage.js               localStorage read/write
    format.js, statusStyles.js   display helpers

plugin/
  src/                     Chrome extension source (manifest.json, background.js, icons/)
  build/                   generated: extension-ready folder (plugin_assets + plugin/src merged)
  dist/                    generated: zipped extension package

scripts/
  build-plugin.mjs         merges plugin_assets/ + plugin/src/ into plugin/build/
  zip-plugin.mjs           zips plugin/build/ into plugin/dist/
  generate-icons.mjs       one-off PNG icon generator for the extension (no image deps)
```

## Tech stack

Vite, React (JS, no TypeScript), Tailwind CSS. No backend — all state lives in the browser's `localStorage`.
