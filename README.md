# ArtQuest

Gamified desktop app for learning drawing and animation — structured quests, skill tree, daily practice, and local-first progress.

## Stack

- **Electron 42** + **React 19** + **TypeScript** + **Vite**
- **Zustand** stores, **SQLite** persistence, **Zod** schema validation
- **Vitest** + Testing Library

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Web-only Vite dev server |
| `npm run electron:dev` | Electron dev mode |
| `npm run test` | Run Vitest once |
| `npm run check` | Lint + typecheck + tests |
| `npm run electron:build` | Build and package Electron app |

## Data scripts

| Command | Description |
|---------|-------------|
| `npx tsx scripts/generate-quest-prerequisites.ts` | Rebuild quest prerequisite DAG |
| `npx tsx scripts/generate-micro-challenges.ts` | Add micro-challenges to novice/intermediate quests |
| `npx tsx scripts/validate-quest-json.ts` | Validate quest JSON integrity (CI) |

## Architecture

```
src/main/          Electron main process, IPC, SQLite, Google Drive
src/preload/       contextBridge API
src/shared/        Progress schema (Zod) + migrations
src/renderer/      React UI, Zustand stores, quest data
```

Progress auto-saves to SQLite (with `progress.json` legacy fallback). Gallery images stored under userData.

## Privacy

No external analytics by default. Practice events stay on device. Google Drive sync is opt-in.

## Learning flow

ArtQuest uses open quest progression (daily lineup, recommendations, skill tree, and spaced review).  
Legacy campaign-map mode is removed from the current app flow.

## Optional Rust module

`crates/quest-metrics/` — native quest metrics estimator. Build with `npm run build:rust` when Rust toolchain is installed.
