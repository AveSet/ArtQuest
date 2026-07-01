# ArtQuest — Dev Conventions

**Full architecture map:** [`AI_REFERENCE.md`](AI_REFERENCE.md) — read first for AI-assisted work.

## Stack
- Electron 42 + React 19 + TypeScript 6 + Vite 8 + Zustand 5
- React Router 8 (`HashRouter`, import from `react-router`)
- Tailwind 4 + `@tailwindcss/vite` + CSS custom properties (4 themes: modern, light, rpg, studio)
- Vitest 4 + jsdom + @testing-library/react
- electron-builder 26 for packaging
- Node.js >= 22.12.0 required

## Commands
- `npm run dev` — web-only Vite dev server
- `npm run electron:dev` — Electron dev mode
- `npm run test` — Vitest (single run)
- `npm run test:watch` — Vitest watch mode
- `npm run build` — web-only build
- `npm run electron:build` — Electron build + package (NSIS installer + zip)
- `npm run electron:build:portable` — same + portable exe (more AV false positives)
- Windows code signing (optional): set `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` before build

## Git LFS
- Binary assets (`*.png`, `*.webp`, `*.wav`, `*.ico`, video) are tracked with **Git LFS** (see [`.gitattributes`](.gitattributes)).
- After clone: `git lfs install` (once per machine) — hooks fetch real files instead of pointer stubs.
- CI checks out with `lfs: true` in GitHub Actions.

## Path Aliases
- `@/*` → `src/renderer/*`

## State Management
- Zustand stores: `useQuestStore`, `useSkillStore`, `useUIStore`, `useThemeStore`
- Cross-store access: `useXStore.getState()` (never inside render)
- Auto-save: `initAutoSave()` in App.tsx; quest session store saves on lifecycle changes only (not per-second timer ticks)

## IPC (Electron)
- Preload exposes `window.electronAPI` via contextBridge
- All IPC handlers in `main.ts` with input validation
- `saveProgress` (async), `saveProgressSync` (sync, for beforeunload)
- Browser fallback: always guard with `window.electronAPI?.method`

## Data Files
- Quests: 7 JSON files in `src/renderer/data/`, loaded via `loadAllQuests()`
- Lazy-loaded in the quest store, deduplicated by `id`

## i18n
- `translations.ts`: `Translations` interface + `en`/`ru` records
- `createTranslationFallback()` deep-merges missing RU keys from EN
- Helper functions: `getQuestTitle()`, `getQuestDescription()`, `getCategoryLabel()`, `getDifficultyLabel()`

## Testing
- Setup file: `src/test/setup.ts` — mocks AudioContext + electronAPI
- Test files co-located in `__tests__/` dirs
- Use `globals: true` in vitest config (describe/it/expect)

## ObjectURL Cleanup
- Always pair `URL.createObjectURL()` with `URL.revokeObjectURL()` on unmount or file removal
- Use refs to track URLs for cleanup

## Achievement Tracking
- `questCompletionLogs` array is unbounded (was previously capped at 500)
- Achievements count from `questCompletionLogs.length` — keep them all
- Progress schema **v27** (`src/shared/progressSchema.ts`): `questReviewSchedule`, `feedbackStats`, `materialEngagement`, `lastExportAt`, `preferredReferenceSource`, `windowBounds`, `longAbsenceReturnDate`, `vfxQuality`, etc. (campaign/learningPath removed)

## Quest unlock & review
- Prerequisites: satisfied if quest id is in `completedQuests` **or** appears in `questCompletionLogs` (`getSatisfiedQuestIds` in `questPrerequisites.ts`)
- Spaced review: `getQuestsDueForReview(schedule, logs, quests)` reads `questReviewSchedule` first, then legacy `review_after_days` + logs
- Daily rotation: `dailyQuestRotation.ts` — within `(category, difficulty)` bucket, completed quests get weight 0 until all bucket quests have ≥1 log

## Manual regression checklist
See [`src/renderer/utils/__tests__/productFlowRegression.md`](src/renderer/utils/__tests__/productFlowRegression.md) for the full learning-loop checklist.

Core checks:
1. Repeatable prereq in logs unlocks dependent quest
2. Dashboard **Next best action** + 3-step plan; review count when due
3. Daily does not repeat same bucket quest until siblings done
4. Feedback/mistake tags influence recommended quest (not only weakest category)
5. Materials: **Learning now** vs **Full catalog**; engagement chips persist
6. Gallery: work review notes, before/after compare, **Next practice** from lightbox
7. Mobile nav **More** → Materials + Progress
8. Reference panel above navbar; keyboard focus on buttons
