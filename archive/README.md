# Archived artifacts

## `legacy-electron-main.js`

Superseded Electron main process from an earlier project layout. The canonical entry is:

- Source: `src/main/main.ts`
- Build output: `out/main/main.js` (see `package.json` `"main"`)

Do not run this file directly. It lacks current IPC handlers (`sync-desktop-settings`, `open-external`, strict `progress.json` validation, tray integration, etc.).

## `campaign-pixel/`

Legacy RPG pixel art pack (curated via `scripts/curate-rpg-pixel-assets.mjs`). **Not used at runtime** — files are kept for reference only and are not copied to `public/`. Safe to delete if disk space matters; regenerate from the script if needed.
