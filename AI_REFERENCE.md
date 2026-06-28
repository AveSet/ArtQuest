# ArtQuest — AI Architecture Reference

**Primary map for AI assistants.** Read this file first; open source files only for the subsystem you are editing.

| Doc | When to use |
|-----|-------------|
| **This file (`AI_REFERENCE.md`)** | Architecture, stores, IPC, quests, persistence, UI map, build, conventions |
| [`AGENTS.md`](AGENTS.md) | Short commands, path aliases, commit-style conventions |
| [`src/renderer/utils/__tests__/productFlowRegression.md`](src/renderer/utils/__tests__/productFlowRegression.md) | Manual learning-loop regression checklist |

### How AI should work with this repo

1. **Start here** — identify subsystem from §21 (quick lookup) or TOC below.
2. **Do not full-repo scan** unless the task is unknown or this doc is stale; grep/read only listed files.
3. **Cross-store rule** — `useXStore.getState()` outside render only.
4. **Electron vs web** — guard every `window.electronAPI` call.
5. **Progress changes** — bump `CURRENT_PROGRESS_SCHEMA_VERSION` in `src/shared/progressSchema.ts` + migration in same file.
6. **Styling** — prefer CSS classes in `src/renderer/styles/` + CSS vars; Tailwind 4 is layout-only (`@theme` in `index.css`, `@tailwindcss/vite` plugin).
7. **Tests** — co-located `__tests__/`; run `npm test` or targeted `npm test -- path/to/file.test.ts`.
8. **Builds** — default `dist-build/`; isolated builds: `--config.directories.output=dist-build-YYYY-MM-DD-vN`.

**Last synced:** 2026-06-28 (v1.0.3, schema v20, stack upgrade: Vite 8, RR 8, Tailwind 4, Zod 4, Vitest 4).

---

## 1. Project Overview

**ArtQuest** is a gamified desktop app for learning drawing, anatomy, and animation.

| Layer | Stack |
|-------|-------|
| Shell | Electron 42 |
| UI | React 19 + TypeScript 6 + React Router 8 (`HashRouter`, import from `react-router`) |
| Bundler | Vite 8 (web: `vite.config.ts`; Electron: `electron.vite.config.ts` via electron-vite 6) |
| State | Zustand 5 |
| Styling | Tailwind 4 + CSS custom properties (`src/renderer/styles/`, 4 themes: modern, light, rpg, studio) |
| Validation | Zod 4 (progress payload) |
| Persistence | SQLite (`artquest.sqlite` in Electron `userData`) + optional Google Drive gallery sync |
| Tests | Vitest 4 + Playwright (web e2e + Electron e2e) |

---

## 2. Directory Structure

```
artquest/
├── index.html                  # Renderer entry (root; electron-vite renderer root = ".")
├── package.json
├── vite.config.ts              # Web-only Vite build → dist/
├── electron.vite.config.ts     # Electron build (main + preload + renderer) → out/
├── vitest.config.ts
├── postcss.config.js              # postcss-import only (Tailwind via @tailwindcss/vite)
├── tsconfig.json               # Renderer TS
├── tsconfig.electron.json      # Main process TS
├── tsconfig.preload.json       # Preload TS
├── playwright.config.ts        # Web e2e
├── playwright.electron.config.ts
├── electron-builder.yml
├── AGENTS.md                   # Short conventions (companion to this file)
│
├── scripts/                    # Build & codegen (NOT under src/)
│   ├── validate-quest-json.ts, fix-quest-l10n.ts
│   ├── generate-quest-prerequisites.ts, generate-micro-challenges.ts
│   ├── recalculate-quest-times.ts   # Catalog estimatedTime from progress export (median + shrinkage)
│   ├── generate-mmo-quests.ts, generate-youtube-quest-pack.ts
│   ├── curate-node-youtube-resources.ts, dedupe-youtube-resources.ts
│   ├── generate-sfx-wav.mjs, generate-portrait-assets.mjs, build-windows-icon.mjs
│   └── build-rust.mjs
│
├── crates/quest-metrics/       # Rust native addon (quest timing estimation)
│
├── src/
│   ├── main/                   # Electron main process
│   │   ├── main.ts             # Lifecycle, IPC, windows, tray, timers
│   │   ├── localDb.ts          # SQLite: progress, gallery, cloud queue
│   │   ├── progressSchema.ts   # Re-exports from shared/progressSchema.ts
│   │   ├── googleDrive.ts      # Google Drive OAuth + upload
│   │   ├── googleOAuth.config.ts
│   │   ├── activityTracker.ts  # Foreground app detection (Windows PowerShell)
│   │   ├── ipcTrustedSender.ts # IPC sender validation
│   │   └── __tests__/
│   │
│   ├── preload/
│   │   ├── preload.ts          # contextBridge → window.electronAPI
│   │   └── ipcTypes.ts
│   │
│   ├── shared/                 # Shared main ↔ renderer (no Electron/React)
│   │   ├── progressSchema.ts   # Zod schema v20, normalize/migrate/parse
│   │   ├── progressChunkMerge.ts
│   │   ├── progressLogCompression.ts
│   │   ├── storageMode.ts      # "local" | "local_and_cloud" | "cloud_only"
│   │   ├── artApps.ts          # Tracked art app process names
│   │   ├── questSessionShortcuts.ts
│   │   └── __tests__/
│   │
│   ├── renderer/
│   │   ├── main.tsx, App.tsx   # HashRouter, lazy routes, bootstrap
│   │   ├── types/electron.d.ts # electronAPI TypeScript surface
│   │   │
│   │   ├── store/              # Zustand stores (see §4)
│   │   ├── data/               # Static quest/skill JSON & TS
│   │   ├── i18n/               # en/ru base + ko/ja/zh locales
│   │   ├── pages/              # Route-level components
│   │   ├── components/         # Reusable UI + bridges (ActivityBridge, etc.)
│   │   ├── hooks/              # useFocusTrap, useAnimatedPresence, …
│   │   ├── styles/             # Theme CSS (variables.css, rpg-theme.css, …)
│   │   ├── utils/              # Business logic hooks & pure functions
│   │
│   └── test/
│       ├── setup.ts            # Mocks AudioContext + electronAPI
│       └── localized.ts
│
├── e2e/                        # Playwright web tests
├── e2e-electron/               # Playwright Electron smoke
├── out/                        # electron-vite build output
│   ├── main/, preload/, renderer/
└── test/main.js                # Node test entry for main process
```

**Path alias:** `@/*` → `src/renderer/*` (vite + tsconfig).

---

## 3. Core Technologies & Versions

| Library | Version | Purpose |
|---------|---------|---------|
| Electron | ^42.5.0 | Desktop shell |
| React | ^19.2.7 | UI |
| TypeScript | ^6.0.3 | Types |
| Vite | ^8.0.16 | Bundler |
| Zustand | ^5.0.13 | State |
| React Router | ^8.0.1 | Routing (`HashRouter`, import from `react-router`) |
| Tailwind CSS | ^4.1.11 | Utility CSS (`@tailwindcss/vite`) |
| Zod | ^4.0.0 | Progress schema |
| Vitest | ^4.1.9 | Unit tests |
| Playwright | ^1.61.0 | E2E |
| @testing-library/react | ^16.3.2 | Component tests |
| electron-vite | 6.0.0-beta.1 | Electron build |
| electron-builder | ^26.15.3 | Packaging |

---

## 4. State Management (Zustand)

All stores in `src/renderer/store/`. Created with `create()`. Cross-store access: `useXStore.getState()` — **never inside render**.

| Store | Role |
|-------|------|
| `useQuestStore` | Quest catalog, completion, dailies, weekly challenge, user quests, references |
| `useUIStore` | Settings, streak, save/load, import/export, review schedule, feedback stats |
| `useSkillStore` | Skill tree XP, unlocks, prestige, achievements (incl. hidden) |
| `useThemeStore` | Theme (`modern` \| `light` \| `rpg`), syncs `<html>` CSS vars |
| `useQuestSessionStore` | Active quest timer, phases, overtime mode, overlay sync |
| `useSessionRitualStore` | Phase-transition banner state (`PhaseTransitionCard`) |
| `useSkillPracticeStore` | Skill practice session (no quest) |
| `usePortraitStore` | Daily reward star streak + streak shield (no avatar dressing) |
| `useActivityStore` | Activity tracking bridge from main process |
| `xpFloatStore` | XP float animation queue |

**Key cross-store flows:**
- `completeQuest()` → `useSkillStore.addXP…`, `usePortraitStore`, `useUIStore.saveProgressSync()`
- `loadProgress()` in `useUIStore` hydrates all stores

---

## 5. Data Models (`src/renderer/store/models.ts`)

Key interfaces:
- **`Quest`**: `id`, `code`, `title` (multi-lang), `category`, `difficulty`, `xp`, `estimatedTime`, `prerequisites[]`, `tags`, `microChallenges[]`, `review_after_days`, `is_repeatable`, …
- **`CompletedWork`**: gallery entry with local/cloud sync fields
- **`QuestCompletionLog`**: per-completion record with feedback, practice minutes, speed-run flag
- **`SkillNode`**: tree node with XP, unlock, prestige, review interval
- **`Settings`**: sound, language, theme, `materialEngagement`, `learningProfile`, activity tracking, accessibility
- **`ProgressData`**: full saved state (`schemaVersion`, all store fields)
- **`HIDDEN_ACHIEVEMENTS`**: condition strings evaluated in `useSkillStore.checkHiddenAchievements()` (deterministic, not random)

---

## 6. Progress Schema (`src/shared/progressSchema.ts`)

- **Version 20** — `CURRENT_PROGRESS_SCHEMA_VERSION = 20`
- Single source of truth: Zod `progressPayloadSchema`, `normalizeProgressPayload`, `parseProgressPayload`, `migrateProgressPayload`, `pickLoadedProgressFields`
- `src/main/progressSchema.ts` **re-exports** from shared (no duplicate logic)
- Unknown keys stripped via `.strip()`
- v15+ fields: `questReviewSchedule`, `feedbackStats`, `materialEngagement`, `lastExportAt`, `lastWarmupCompletedDate`
- Removed from settings on migrate: `campaign`, `learningPath`, `campaignMode*`, `portraitAnimation`, `selectedLearningPathId`
- `questCompletionLogs` unbounded (was capped at 500)
- Persisted sessions: `activeQuestSession`, `activeSkillPracticeSession` (in `core` chunk)

---

## 7. Persistence & Auto-save

### SQLite (`src/main/localDb.ts`)

Database file: `{userData}/artquest.sqlite` (local DB schema version **3**, separate from progress JSON schema v20).

| Table | Purpose |
|-------|---------|
| `progress_snapshot` | Full progress JSON snapshot (id=1) |
| `progress_chunk` | Incremental chunk rows keyed by chunk name |
| `gallery_item` | Gallery media metadata + sync status |
| `upload_queue` | Cloud upload retry queue |
| `cloud_account` | Google Drive connection state |
| `event_log` | Audit events (`progress_saved`, `gallery_imported`, …) |

Media files on disk:
- Gallery: `{userData}/gallery/`
- Quest reference attachments: saved via `save-quest-reference` IPC

Load candidates: rebuilt SQLite chunks (`mergeProgressChunks` over snapshot base), SQLite snapshot, `progress.json`, then `.bak`. Degraded partial chunks (missing keys without a snapshot or corrupt rows) are lower priority than complete snapshot/JSON candidates so sparse chunk sets do not silently replace full progress.

### Incremental save (`incrementalSave.ts` + `autoSave.ts`)

Chunk keys (`PROGRESS_CHUNK_KEYS`): `core`, `quests`, `skills`, `gallery`, `cosmetics`.

| Chunk | Fields (summary) |
|-------|------------------|
| `core` | settings, streak, dailies, sessions, review schedule, feedback |
| `quests` | userQuests, logs, completedQuests, references, overrides |
| `skills` | skillNodes, legacySkills, achievements |
| `gallery` | completedWorks |
| `cosmetics` | `portraitProgress` — daily star streak + streak shield only (legacy chunk key) |

**Auto-save flow (`initAutoSave()` in App.tsx):**
1. Store subscriptions mark dirty chunks (`markChunkDirty`)
2. Debounced 2s (`SAVE_DELAY_MS`) → save dirty chunks via `saveProgress` IPC
3. Every **24** incremental saves → full `saveProgress()` snapshot
4. Critical mutations call `saveProgressSync()` immediately (sync IPC for beforeunload)
5. Session timer tick does **NOT** trigger save every second — session persisted on meaningful state changes only
6. Incremental chunk saves carry a creation timestamp; main ignores stale chunk writes created before the latest full save and validates the merged preview with Zod before writing SQLite.
7. **Browser fallback** (`browserProgress.ts`): merges chunks into `localStorage` when no Electron, then validates the merged payload before save.

### Import / export
- `progressExport.ts` — full JSON export/import in renderer; `parseImportEnvelope()` expands compressed completion logs and rejects prototype-pollution keys for web imports
- `export-progress-file` / `import-progress-file` IPC — native file dialogs
- `progressLogCompression.ts` (shared) — compress large completion logs in exports (≥80 logs)

---

## 8. IPC & Preload

Preload: `src/preload/preload.ts` → `window.electronAPI` (types in `src/renderer/types/electron.d.ts`).  
Main handlers: `src/main/main.ts`. Sender guard: `ipcTrustedSender.ts`.

**Naming:** preload uses camelCase; main process channels use kebab-case.

### Progress & data

| electronAPI (preload) | IPC channel (main) |
|----------------------|-------------------|
| `saveProgress(data)` | `save-progress` (async) |
| `saveProgressSync(data)` | `save-progress-sync` (sync `sendSync`) |
| `loadProgress()` | `load-progress` |
| `clearProgress()` | `clear-progress` |
| `exportProgressFile(json)` | `export-progress-file` |
| `importProgressFile()` | `import-progress-file` |

Chunk saves use the same `saveProgress` channel with payload `{ _chunkKey, schemaVersion, chunkVersion, _createdAtMs, data }`; batch saves use `{ _chunkBatch, schemaVersion, chunkVersion }`.

### Gallery & media

| electronAPI | IPC channel |
|-------------|-------------|
| `saveImage(base64, questId)` | `save-image` |
| `getSavedImages()` | `get-saved-images` |
| `readImage(path)` | `read-image` |
| `getLocalMediaUrl(path)` | `get-local-media-url` |
| `saveQuestReference(base64, questId)` | `save-quest-reference` |
| `deleteQuestReference(path)` | `delete-quest-reference` |
| `syncGallery()` | `artquest:v1:gallery:sync` |
| `retryGalleryUpload(id)` | `artquest:v1:gallery:retryUpload` |
| `retryAllGalleryUploads()` | `artquest:v1:gallery:retryAllUploads` |
| `onGallerySyncUpdated(handler)` | event from main |

### Cloud storage

| electronAPI | IPC channel |
|-------------|-------------|
| `getStorageMode()` | `artquest:v1:storage:getMode` |
| `setStorageMode(mode)` | `artquest:v1:storage:setMode` |
| `connectGoogleDrive()` | `artquest:v1:cloud:google:connect` |
| `disconnectGoogleDrive()` | `artquest:v1:cloud:google:disconnect` |
| `setGoogleDrivePath(path)` | `artquest:v1:cloud:google:setPath` |
| `getGoogleDriveStatus()` | `artquest:v1:cloud:google:getStatus` |

Storage modes (`storageMode.ts`): `local`, `local_and_cloud`, `cloud_only`.

### Quest session & overlay

| electronAPI | IPC channel / event |
|-------------|----------------------|
| `dispatchQuestSessionCommand(cmd)` | `artquest:v1:quest-session:dispatch-command` |
| `onQuestSessionCommand(handler)` | event `artquest:v1:quest-session:command` |
| `setQuestOverlayPayload(payload)` / `setQuestOverlayPatch(patch)` | `artquest:v1:overlay:set-payload` / `artquest:v1:overlay:set-patch` |
| `openSessionOverlay` / `hideSessionOverlay` / `toggleQuestOverlay` / … | overlay IPC handlers |
| `openReferenceWindow(params)` | `artquest:v1:reference-window:open` |
| `onReferenceWindowNavigate(handler)` | event `artquest:v1:reference-window:navigate` |

Session commands: `advancePhase`, `toggleOverlay`, `openReferences`, `showMainWindow`, `openQuestFinish`, `cancelQuestSession`, `finishPractice`, `cancelPractice`.

### Desktop integration

| electronAPI | Purpose |
|-------------|---------|
| `onActivityUpdate(handler)` | Foreground app / idle state |
| `onSessionTick(handler)` | 1 Hz timer pulse (Electron) |
| `onNavigate(handler)` | Main → renderer route changes |
| `syncDesktopSettings(payload)` | Reminders, break notifications |
| `onAppBeforeQuit(handler)` | Flush before exit |
| `openExternal(url)` | Safe external URL open |
| `showItemInFolder(path)` | Reveal file in Explorer |

**Convention:** always guard with `window.electronAPI?.method` for web-only mode.

**Sender validation:** all renderer-invokable privileged channels are guarded by `ipcTrustedSender.ts`, including quit ack (`app-before-quit-done`), overlay payload/ready, and session tick activation.

---

## 9. Quest System Logic

### Loading
- `quests_data.ts` → `loadAllQuests()` lazy-imports 7 JSON files, dedupes by `id`
- Called once in `useQuestStore.loadQuests()`

### Completion (`useQuestStore.completeQuest`)
1. Validate quest + repeatability
2. XP via `distributeQuestXp()` (`questXpReward.ts` + `progressionBalance.ts`):
   - **Track (legacy category bar):** `computeQuestTrackXp()` — **full face value** on completion. **Overtime** (main timer hit 0 before submit): ×0.75 on track only (`OVERTIME_TRACK_XP_MULTIPLIER`). `computePracticeRatio()` remains for analytics/adaptive only.
   - **Node:** `computeQuestNodeXp()` — ~20% of face value + practice-minute bonus (`computePracticeBonusXp`). Speed-run halves practice bonus only (not overtime).
   - `practiceMinutes` from session (`getSessionPracticeMinutes`); submit clamps to `0..estimatedTime*3`. Direct `completeQuest()` calls without minutes default to catalog `estimatedTime` to avoid zero-minute logs.
3. Append `QuestCompletionLog` with feedback, practice minutes, `isSpeedRun` (`isSpeedRun` is never true for `practiceMinutes <= 0`)
4. Update `completedQuests`, `completedToday`, streak
5. Achievements, weekly challenge, XP float
6. `saveProgressSync()`

**XP display (Dashboard):** category skill bars always use `legacySkills` totals, not aggregated node XP (node share alone can look like ~20% of quest face value).

**Session phases:** every catalog quest has 3 `microChallenges` (warmup / core / polish). Phases run **during** the quest session only. **`completeMicroChallenge`** awards **partial node XP** via `distributePhaseNodeXp()` + `microChallengeXp.ts` (weighted warmup/core/polish, cap 30% of quest face XP). Session restore uses `skipXp: true` on reconciled phases.

### `estimatedTime` — catalog, personalization, recalibration

| Layer | Module | Role |
|-------|--------|------|
| Catalog JSON | 7× `quests_*.json` | `estimatedTime` in minutes; **must equal** sum of `microChallenges[].estimatedTime` (validated in `validate-quest-json.ts`) |
| Display / session | `questPersonalizedTime.ts`, `usePersonalizedQuestMinutes.ts`, `QuestTimeMeta.tsx` | Per-user estimate from `questCompletionLogs` (quest median → cohort → global pace → catalog). Shown in cards/dashboard; **session timer** uses personalized minutes (phases scaled in `questSessionPlan.ts`). |
| XP / speed-run | Catalog `estimatedTime` only | Practice ratio and `isSpeedRun` always use **catalog** time — personalized display does not change rewards. |
| User quests | `questMetricsEstimator.ts` | Title complexity + catalog neighbors (`addUserQuest` in `useQuestStore`) |
| Static recalibration | `scripts/recalculate-quest-times.ts` | Reads export `questCompletionLogs`, median per `questId` (n≥5), shrinkage 0.7/0.3, rescales micro-challenges; `--dry-run` / `--write` |
| Pure helpers | `questTimeCalibration.ts` | Median, anomaly filter (1–300 min), shrinkage, MC rescale — shared by script + tests |

**Rust `crates/quest-metrics/`:** not wired in renderer (wellness model only). JS estimator is the live path for custom quests.

**Recommendations / energy mode:** `recommendedQuest.ts` and `soloChapters.ts` accept optional `resolveMinutes()` (wired from `nextBestAction.ts` via `getPersonalizedQuestMinutes`).

### Prerequisites (`questPrerequisites.ts`)
- `getSatisfiedQuestIds()`: satisfied if in `completedQuests` **or** non-timeout `questCompletionLogs`
- `isQuestUnlocked()`: all prerequisites + `min_level`

### Daily quests
- **Rotation** (`dailyQuestRotation.ts`): in `(category, difficulty)` bucket, completed quests weight 0 until all siblings have ≥1 non-timeout log
- **Generation** (`dailyQuestGenerator.ts`): 3 quests from unlocked pool; warmup option
- **Replacement** (`pickDailyQuestReplacement`): first tries same `(category, difficulty)` bucket, then falls back to any eligible unlocked quest when that bucket is empty
- **Recovery day** (`dailyQuests.ts`): if `streakRecoveryDueDate === today` → require **4** dailies instead of 3

### Spaced review (`questSpacedReview.ts`)
- Primary: `questReviewSchedule` map (`nextReviewAt`, `intervalDays`, `easeFactor`)
- Fallback: legacy `review_after_days` + logs
- Date math uses local calendar helpers (`getLocalDateStr` / `calendarDaysBetween`) to stay aligned with daily streaks across timezones.
- `pickReviewQuestForDaily()` — one spaced-review slot per day; optional one skill-review quest ID may be added in `checkAndGenerateDailyQuests` (not all due IDs)

### Recommendations
- **`useNextBestAction.ts`**: warmup → dailies → review → recommended (weakest category + mistake tags)
- **`adaptiveDifficulty.ts`**: `updateAdaptiveWeights()` boosts tags from `mistakeTags[]`
- **`recommendedQuest.ts`**: weighted pick by weakness + adaptive weights

### Hidden achievements
Defined in `models.ts` (`HIDDEN_ACHIEVEMENTS`). Checked deterministically in `useSkillStore` via condition parsers:
- `complete_quest_tag:perspective count>=50`
- `complete_quest hour>=23 count>=5`
- `streak_current>=100`
- etc.

---

## 10. Quest Session & Overlay

**Store:** `useQuestSessionStore` — phases, timers, **overtime mode**, reference bonus minutes.

**Plan:** `questSessionPlan.ts` builds phase list from quest `microChallenges` + optional reference phase. `getQuestSessionMainMinutes()` / optional `mainMinutesOverride` for personalized session length; exercise phase durations scale when override ≠ catalog sum.

**Timer lifecycle:**
1. Countdown `remainingSec` (main + optional reference pool).
2. At 0 → `isExpired: true`, `overtimeElapsedSec` counts **up** (`+MM:SS` in overlay). Session **does not auto-fail**; player submits manually.
3. Submit with `isExpired` → `completeQuest({ isOvertime: true })` → track XP penalty; node XP from real `practiceMinutes`.
4. Legacy fields `graceRemainingSec` / `graceExpired` remain in persisted session schema for migration only; new sessions never auto-set `graceExpired`.

**Practice minutes:** `getSessionPracticeMinutes()` — prefers `activeElapsedSec` when present; otherwise falls back to scheduled elapsed + overtime seconds. Brand-new tracked sessions return a minimum of 1 minute so completion logs do not become zero-minute false speed-runs.

**Timer ticks:**
- Electron: main process sends `artquest:v1:session:tick` every 1s → `SessionTickBridge` → `useQuestSessionStore.tick()`
- Web: local `setInterval` fallback in store

**Windows (main process):**
- `mainWindow` — primary UI
- `overlayWindow` — PiP session widget (`QuestOverlay` route)
- `referenceWindow` — reference materials panel
- Tray menu — quick actions

**Bridges (renderer):** `QuestSessionCommandBridge`, `ActivityBridge`, `NavigateBridge`, `SessionTickBridge`.

**Persistence:** active session serialized into `core` chunk (`sessionPersistence.ts`). Persisted fields include `overtimeElapsedSec` (v15+ optional on `activeQuestSession`).

### Portrait & avatar

- **Static raster portrait** — gender-based WebP/PNG from `public/portraits/` (generated via `scripts/generate-portrait-assets.mjs`), with inline SVG fallback in `CharacterPortrait.tsx`.
- **Custom upload** — click portrait on Dashboard → crop modal → saved via IPC (`saveCustomAvatar`) or browser data URL in settings.
- **No Spine 2D** — no skeletal animation pipeline; legacy `settings.portraitAnimation` is stripped on save/load.
- **No accessories / wardrobe** — hats, glasses, cosmetic chest, and equip UI removed. Portrait is not dressable.
- **Daily reward stars** — 5-day streak cycle when all dailies are completed (`usePortraitStore`, `portraitChestProgress.ts`); streak shield for one missed day per month.

---

## 11. Activity Tracking

When `settings.activityTrackingEnabled`:
- Main process polls foreground window every **1s** (`startActivityTimer` in `main.ts`)
- `activityTracker.ts` runs PowerShell on Windows (process name + idle seconds); non-Windows returns always-active stub
- Internal cache refresh if stale > **900ms**
- Matches process names against `artApps.ts` (photoshop, clipstudio, sai, tvpaint, toonboom, …)
- Broadcasts `artquest:v1:activity:update` → `useActivityStore` → session XP counting via `shouldCountSessionTime`

---

## 12. UI — Pages & Components

### Pages (lazy-loaded in `App.tsx`)
| Page | Role |
|------|------|
| `Dashboard` | **Desktop (≥1024px):** fixed viewport — left sidebar (portrait/skills), **only right column scrolls**; main: next best action, daily checklist, weekly challenge. Mobile: normal page scroll |
| `Quests` / `QuestDetail` | Catalog, session, upload, references |
| `Gallery` | Works, compare, review notes; lightbox with **wheel zoom + drag pan** (`GalleryLightboxZoomMedia`) |
| `Skills` | Skill tree, prestige, review |
| `Achievements` | Achievement list |
| `Settings` | Language, theme, shortcuts, cloud, activity |
| `Statistics` | Stats, streaks |
| `Resources` | Video materials ("Learning now" / "Full catalog") |
| `ProgressLayout` / `ProgressTimeline` | Progress views |
| `QuestOverlay` | PiP overlay route |
| `ReferenceMaterialsWindow` | Dedicated reference window |

### Notable components
`Navbar`, `NextBestActionCard`, `AchievementPopup`, `XpRewardToast`, `XPFloat`, `SaveErrorBanner`, `OnboardingTour`, `LearningProfileModal`, `StreakRecoveryHint`, `ReferencePanelToggle`, `WeeklyChallengeCard`, `GalleryLightbox`, `GalleryLightboxZoomMedia`, `GalleryWorkReview`, `PhaseTransitionCard`, `SubmitStepBackdrop`, celebration effects (`QuestScreenCelebration`, `LevelUpCelebration`, `PortraitQuestCelebration`).

### Dashboard layout (`dashboard.css` + `Dashboard.tsx`)
- Classes: `dashboard-page`, `dashboard-layout__body` (grid), `dashboard-layout__side`, `dashboard-layout__main` (scroll container on desktop)
- `useDashboardOverlays` — day-complete modal timing
- `useNextBestAction` + `NextBestActionCard` — 3-step plan, warmup CTA; loading/empty states prevent blank next-action panels during progressive quest load
- Daily / Next action panel switching uses explicit buttons; the main scroll column is not wheel-hijacked.
- Desktop: `body:has(.dashboard-page) { overflow: hidden }`, flex chain `app-main` → `motion-page-enter` → `dashboard-page`

### Quest session UI (`QuestDetail.tsx` + related)
- **Focus mode:** `isThisQuestSession || showSubmitModal` — hides overview, shows timer + CTA
- **Sounds:** `playSessionSound()` map in `sound.ts`; `playUiClick()` on session controls
- **Game feel (2026-06):** `btn-session-primary`, `session-difficulty-pill`, `quest-session-card--enter`, calm `PhaseTransitionCard` (not `animate-celebrate`)
- **Submit:** `SubmitStepBackdrop` + `useQuestSubmit`; upload via `WorkUploadZone` / `WorkUploadPreview`
- **Reference:** `ReferencePanel` + FAB `ReferencePanelToggle`; external refs via `openReferenceWindow`
- **Overlay:** `collapseSessionToOverlay` / `QuestOverlay` route; sync via `sessionOverlaySync.ts`
- **No explicit pause** — activity tracking gates `activeElapsedSec`; wall clock still runs

### Gallery lightbox (`GalleryLightbox.tsx` + `GalleryLightboxZoomMedia.tsx`)
- Portal fullscreen viewer; overlay click zones via `galleryLightboxClick.ts` (prev/next/close)
- Zoom: wheel on `.gallery-lightbox-zoom` (scale 1–4)
- Pan: pointer drag when `scale > 1`; `pointer-events: none` on img/video in pan mode (fixes native image drag)
- `GalleryMedia`: `draggable={false}`; notes/tags in `GalleryWorkReview`

---

## 13. i18n

Languages: **en**, **ru**, **zh**, **zh-tw**, **ja**, **ko**.

- Base: `translations.ts` (`en`, `ru`)
- `createTranslationFallback()` — deep-merge missing RU from EN
- Full overrides: `locales/ko.ts`, `ja.ts`, `zh.ts`, `zh-tw.ts`
- Coverage check: `npm run i18n:check` audits missing/empty keys and likely untranslated strings across all supported UI languages.
- `I18nProvider` + `useI18n()` → `t()`, `language`
- Helpers: `getQuestTitle()`, `getQuestDescription()`, `getCategoryLabel()`, `getDifficultyLabel()`

---

## 14. Themes & Styling

Four themes via `useThemeStore`: `modern` (dark), `light`, `rpg` (fantasy), `studio` (low-chrome dark — `studio-theme.css`, maps to `data-theme=modern` + `studio-theme` class).

- CSS vars on `:root[data-theme="…"]` — `src/renderer/styles/variables.css`
- Import order: `src/renderer/styles/index.css` (variables → components → `dashboard.css`, `quest-detail.css`, `effects.css`, `motion.css`, …)
- **Motion:** `motion.css`, `effects.css`, `celebration-effects.css`, `ritual-effects.css`; respect `html[data-motion='reduce']`
- **Z-index tokens:** `--z-nav` 160, `--z-reference` 175, `--z-overlay-modal` 190, `--z-overlay-celebration` 200, `--z-toast` 210, `--z-onboarding` 320
- Accessibility attrs on `<html>`: `data-font-scale`, `data-contrast`, `data-motion`
- Theme persisted in progress JSON **and** localStorage (pre-load flash prevention)

### Sound (`src/renderer/utils/sound.ts`)
- 16 WAV types in `public/sounds/`; procedural fallback if missing
- `playUiClick()` → `uiTap`; `playSessionSound(event)` → `SESSION_SOUND_MAP` (sessionEnter, phaseComplete, debriefConfirm, …)
- Gated by `settings.soundEnabled`, `soundVolume`; volume/pitch scaled when `reduceMotion`
- Sample loading uses shared per-sound promises to avoid duplicate fetch/decode races.
- Ambient loops: `ambientSound.ts` (rain/cafe/fireplace); missing preset assets fall back to `cafe` before going silent
- Feedback hub: `feedbackOrchestrator.ts` — `dispatchFeedbackMoment({ kind })` for complete/daily/achievement/levelup/xp_float

---

## 15. Native Addon (Rust)

`crates/quest-metrics/` — Rust crate built via `npm run build:rust` (`scripts/build-rust.mjs`). Exports wellness-style metrics (`time_required_minutes = estimated_time × difficulty_mult`). **Not imported** by renderer today. Live timing for **user-created quests**: `questMetricsEstimator.ts`. Catalog timing: JSON + optional `recalculate-quest-times.ts` + runtime personalization (`questPersonalizedTime.ts`).

---

## 16. Testing

| Layer | Location | Command |
|-------|----------|---------|
| Unit | Co-located `__tests__/` (~107 files, 490+ tests) | `npm test` |
| Setup | `src/test/setup.ts` | mocks AudioContext + electronAPI |
| Web e2e | `e2e/` | `npm run test:e2e` |
| Electron e2e | `e2e-electron/` | `npm run test:e2e:electron` |

Vitest globals mode (`describe`/`it`/`expect` without import).

Key test areas: daily rotation, prerequisites, spaced review, next best action, adaptive difficulty, progress export, product flow.

---

## 17. Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Web-only Vite dev server |
| `npm run electron:dev` | Electron dev (electron-vite) |
| `npm run build` | Web build → `dist/` |
| `npm run electron:build` | Build + NSIS + zip → `dist-build/` (see `electron-builder.yml`) |
| `npm run electron:build:release` | Same → `dist-release/` |
| `npm run electron:build:portable` | + portable exe (more AV false positives) |
| Custom output folder | `npx electron-builder --config.directories.output=dist-build-YYYY-MM-DD-vN` after `electron-vite build` |
| `npm run test` | Vitest single run |
| `npm run test:watch` | Vitest watch |
| `npm run test:e2e` | Playwright web |
| `npm run test:e2e:electron` | Playwright Electron smoke |
| `npm run lint` | ESLint (max 0 warnings) |
| `npm run check` | lint + tsc + test |
| `npm run generate:assets` | SFX wav + portrait assets |
| `npm run validate:quests` | Validate quest JSON (incl. MC time sum = `estimatedTime`) |
| `npx tsx scripts/recalculate-quest-times.ts --progress <export.json> --dry-run` | Preview catalog time recalibration from logs |
| `npm run build:rust` | Build quest-metrics native addon |

Windows signing (optional): `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` before build.

---

## 18. Key Utilities (`src/renderer/utils/`)

| File | Purpose |
|------|---------|
| `useNextBestAction.ts` | Dashboard quest recommendations |
| `useDashboardQuestState.ts` | Dashboard orchestration |
| `dailyQuestRotation.ts` | Bucket fairness rotation |
| `dailyQuestGenerator.ts` | Generate 3 daily quests |
| `dailyQuests.ts` | Daily count (3 or 4 on recovery) |
| `questPrerequisites.ts` | Unlock logic |
| `questSpacedReview.ts` | Spaced repetition schedule |
| `skillReview.ts` | Skill node review due dates |
| `recommendedQuest.ts` | Weakest-category recommendation |
| `adaptiveDifficulty.ts` | Mistake-tag weight adjustment |
| `questXpReward.ts` | XP distribution to skill nodes |
| `progressionBalance.ts` | Track/node XP formulas, practice ratio, overtime track penalty |
| `microChallengeXp.ts` | Weighted partial phase XP (cap 30% of quest face) |
| `questPersonalizedTime.ts` | Per-user `estimatedTime` from completion logs |
| `questTimeCalibration.ts` | Median/shrinkage/rescale for catalog recalibration script |
| `questTimeDisplay.ts` | UI labels for catalog vs personalized minutes |
| `questMetricsEstimator.ts` | Metrics for user-created quests (not catalog recalibration) |
| `incrementalSave.ts` | Chunk build + dirty save |
| `autoSave.ts` | Store subscriptions + debounced save |
| `browserProgress.ts` | localStorage fallback |
| `progressExport.ts` | Export/import progress JSON |
| `progressLogExport.ts` | Completion log export helpers |
| `questSessionPlan.ts` | Session phase planning |
| `sessionPersistence.ts` | Serialize/deserialize sessions |
| `sessionOverlayActions.ts` | Overlay open/hide helpers |
| `desktopIntegration.ts` | Push settings to main for reminders |
| `learningProfile.ts` | Learning profile modal logic |
| `hydrateGallery.ts` | Gallery image cache warming |
| `refreshGallerySync.ts` | Trigger cloud gallery sync |
| `useVideoCatalog.ts` | Video resource search |
| `youtubeLinks.ts` | YouTube URL parsing |
| `warmupQuest.ts` | Warmup quest logic |
| `weeklyChallenge.ts` | Weekly challenge state |
| `streakCalculations.ts` | Streak math |
| `categoryMastery.ts` | Category mastery % |
| `sound.ts` / `ambientSound.ts` | Audio playback + `playUiClick`, `playSessionSound` |
| `feedbackOrchestrator.ts` | Reward moment sound + XP float |
| `galleryLightboxClick.ts` | Lightbox overlay click zones |
| `useDashboardOverlays.ts` | Dashboard modal overlays (day complete) |
| `useQuestSubmit.ts` | Upload → completeQuest → feedback pipeline |
| `questCompletionPipeline.ts` | Post-complete rewards + celebrations |

Shared (not under utils): `src/shared/progressLogCompression.ts`, `progressChunkMerge.ts`.

---

## 19. Important Nuances & Conventions

1. **Quest unlock via logs** — prerequisites satisfied by `completedQuests` OR non-timeout `questCompletionLogs` (repeatable quests unlock dependents).

2. **Daily rotation fairness** — weight 0 for completed quests in bucket until all siblings have ≥1 non-timeout log.

3. **Spaced review** — `questReviewSchedule` (v15+) primary; legacy `review_after_days` fallback.

4. **Streak recovery** — missed day → `streakRecoveryDueDate` set; user completes **4** dailies that day to keep streak.

5. **Hidden achievements** — deterministic condition strings in `HIDDEN_ACHIEVEMENTS`, parsed in `useSkillStore` (not random/probabilistic).

6. **Mistake tags → recommendations** — `updateAdaptiveWeights()` increases weight for tags in feedback `mistakeTags[]`.

7. **Progress schema v20** — `campaign`/`learningPath` removed; `questCompletionLogs` unbounded; fields listed in §6.

8. **Auto-save** — debounced incremental chunks (2s); full snapshot every 24 incrementals; chunk writes are stale-write guarded and schema-validated; `saveProgressSync()` on critical mutations; timer ticks do not save every second.

9. **Persistence is SQLite** — not flat `progress.json`; chunks in `progress_chunk` table, snapshot in `progress_snapshot`.

10. **IPC fallback** — guard all `electronAPI` calls; web mode uses `browserProgress` + reduced features.

11. **ObjectURL cleanup** — pair `createObjectURL` with `revokeObjectURL` on unmount/removal.

12. **`materialEngagement`** — per-video `viewed` \| `helpful` \| `applied` in settings; survives import/export.

13. **Migration** — `normalizeProgressPayload` in shared handles older schema versions.

14. **Activity tracking** — 1s poll interval; Windows-only real detection; idle timeout configurable (default 60s). Quest completion falls back to scheduled elapsed/minimum 1 minute when tracked active time is still 0.

15. **Portrait** — static image or custom upload only; no Spine 2D animation; no accessories/wardrobe.

16. **Themes** — progress JSON is source of truth; localStorage mirror prevents flash before load.

17. **HashRouter** — used instead of BrowserRouter (Electron file:// compatibility).

18. **Gallery cloud sync** — upload queue with retry; `syncGallery()` reconciles local ↔ Google Drive based on `storageMode`.

19. **Overtime sessions** — timer at 0 starts unlimited extra time; no `failQuestTimeout` auto-flow. Track XP ×0.75 if submitted after main timer; node XP uses actual practice minutes.

20. **Personalized vs catalog time** — UI/session can show shorter/longer estimates from logs; XP and `adaptiveDifficulty` ratios still use **catalog** `estimatedTime` unless JSON is recalibrated via script.

21. **Micro-challenge time invariant** — `sum(microChallenges[].estimatedTime) === quest.estimatedTime` enforced in `validate-quest-json.ts`; recalibration script rescales phases together.

22. **Dashboard desktop scroll** — page chrome fixed; `.dashboard-layout__main` and the left sidebar can scroll independently (`dashboard.css` @media ≥1024px); panel switching uses explicit buttons, not wheel hijacking.

23. **Gallery lightbox pan** — requires zoom > 1; disable native img drag via CSS + `draggable={false}`; pan logic in `GalleryLightboxZoomMedia.tsx`.

24. **Session game feel** — micro-animations in `quest-detail.css` / `effects.css` / `buttons.css`; sounds via `playUiClick` + `playSessionSound`; all respect `data-motion='reduce'`.

---

## 20. Build Artifacts (Windows)

| Output | Path | Notes |
|--------|------|-------|
| Default | `dist-build/` | `ArtQuest Setup 1.0.3.exe`, `ArtQuest-1.0.3-win.zip`, `win-unpacked/ArtQuest.exe` |
| Release | `dist-release/` | `electron:build:release` script |
| Dated isolated | `dist-build-2026-06-10-vN/` | Manual `--config.directories.output=…` (keeps prior builds) |
| electron-vite out | `out/main`, `out/preload`, `out/renderer` | Intermediate before electron-builder |
| Web only | `dist/` | `npm run build` |

Config: `electron-builder.yml` — NSIS + zip x64; optional portable via `ARTQUEST_BUILD_PORTABLE=1`. Signing: `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD`. Custom icon: `scripts/build-windows-icon.mjs` → `build/icon.ico`.

---

## 21. Quick Lookup — «где править X»

| Task | Primary files |
|------|----------------|
| Dashboard / next action / dailies | `pages/Dashboard.tsx`, `components/NextBestActionCard.tsx`, `components/dashboard/*`, `utils/useNextBestAction.ts`, `styles/dashboard.css` |
| Quest session / timer / submit | `pages/QuestDetail.tsx`, `store/useQuestSessionStore.ts`, `utils/questSessionPlan.ts`, `utils/useQuestSubmit.ts`, `styles/quest-detail.css` |
| Session sounds / game feel | `utils/sound.ts`, `components/PhaseTransitionCard.tsx`, `store/useSessionRitualStore.ts`, `styles/effects.css`, `styles/buttons.css` |
| Gallery / lightbox / zoom-pan | `pages/Gallery.tsx`, `components/GalleryLightbox.tsx`, `components/GalleryLightboxZoomMedia.tsx`, `components/GalleryMedia.tsx`, `styles/effects.css` |
| Quest catalog / completion / XP | `store/useQuestStore.ts`, `utils/questXpReward.ts`, `utils/progressionBalance.ts`, `data/quests_*.json` |
| Daily quests | `utils/dailyQuestGenerator.ts`, `utils/dailyQuestRotation.ts`, `utils/dailyQuests.ts` |
| Prerequisites / unlock | `utils/questPrerequisites.ts` |
| Spaced review | `utils/questSpacedReview.ts`, `store/useUIStore.ts` (`questReviewSchedule`) |
| Skill tree / prestige | `pages/Skills.tsx`, `store/useSkillStore.ts`, `data/skillTree.ts` |
| Progress save/load | `utils/autoSave.ts`, `utils/incrementalSave.ts`, `main/localDb.ts`, `shared/progressSchema.ts`, `persistence/progressHydrator.ts` |
| IPC / preload | `preload/preload.ts`, `main/main.ts`, `types/electron.d.ts` |
| i18n | `i18n/translations.ts`, `i18n/locales/{ko,ja,zh}.ts` |
| Themes | `store/useThemeStore.ts`, `styles/variables.css`, `styles/light-theme.css`, `styles/rpg-theme.css`, `styles/studio-theme.css` |
| Reference panel | `components/Quest/ReferencePanel.tsx`, `ReferencePanelToggle.tsx`, `utils/openReferenceWindow.ts` |
| Electron overlay | `pages/QuestOverlay.tsx`, `utils/sessionOverlaySync.ts`, `utils/sessionOverlayActions.ts` |
| Materials / videos | `pages/Resources.tsx`, `utils/useVideoCatalog.ts`, `data/videoResources.ts` |
| Achievements | `store/useSkillStore.ts`, `data/achievements-data.ts`, `pages/Achievements.tsx` |
| Settings / cloud | `pages/Settings.tsx`, `main/googleDrive.ts`, `shared/storageMode.ts` |
| Tests setup | `src/test/setup.ts`, `vitest.config.ts` |
| Quest JSON validation | `scripts/validate-quest-json.ts` |

---

## 22. Routes (`App.tsx`, `HashRouter`)

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/quests`, `/quests/:id` | Quests, QuestDetail |
| `/gallery` | Gallery |
| `/skills` | Skills |
| `/progress/stats` | Statistics (timeline redirects here) |
| `/progress/goals` | ProgressGoals |
| `/progress/achievements` | Achievements |
| `/resources` | Resources (materials) |
| `/settings` | Settings |
| `/overlay` (separate window) | QuestOverlay |
| `/reference-materials` | ReferenceMaterialsWindow |

Legacy redirects: `/statistics` → `/progress/stats`, `/achievements` → `/progress/achievements`.

---

## 23. Quest data files

Loaded by `loadAllQuests()` in `quests_data.ts`:

- `quests_drawing.json`, `quests_anatomy.json`, `quests_animation.json`, `quests_effects.json`, `quests_storytelling.json`, `quests_character_design.json`, `quests_environment.json`
- Warmup: `warmupQuests.ts` (not in main 7 files)
- User quests: stored in progress (`userQuests` chunk)
