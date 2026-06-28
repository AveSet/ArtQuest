# ArtQuest — product flow regression

Manual checklist for the learning loop (run after UX/learning changes).

## Beginner fundamentals gate

1. Set experience tier to **Beginner** (or fresh profile) — Dashboard **«Основы»** card shows progress 0/10.
2. Next best action is a fundamentals exercise (not warm-up); daily checklist shows locked hint.
3. Complete 7 fundamentals exercises in order — daily quests unlock; catalog banner on `/quests` disappears.
4. `/fundamentals` lists all 10 exercises grouped by tier; locked items cannot start until previous is done.

## Full practice day

1. Open Dashboard — **«Сегодня лучше всего»** shows a clear next step with reason.
2. Complete fundamentals step (beginner) or 5-minute warm-up (intermediate+) — returns to dashboard without errors.
3. Take a daily quest — session timer runs, work upload works.
4. Submit self-feedback with mistake tags — dashboard weak-focus / recommendation updates.
5. Gallery — work shows; add notes + improvement notes + tags; compare before/after if 2+ versions.
6. Dashboard sidebar shows portrait, skill bars, and reward stars; daily progress bar is in the «Today» checklist; weekly challenge card is below dailies.
7. Materials → **«Учусь сейчас»** shows up to 3 contextual videos; engagement chips persist after reload (automated: `materials engagement chip persists` in product-flow).

## Session extras

8. Start a quest → session runs directly; optional **Focus mode** (Nav hidden, `F` toggles).
9. Complete phases → **phase transition** banner appears between micro-challenges.
10. Submit work with inline difficulty + mistake tags → returns home without extra debrief modals.
11. Dashboard **Review Shelf** lists overdue spaced-review quests.
12. Fill 5 reward stars → **Chest Reveal** modal (not on avatar).
13. Gallery **Growth wall** view; Statistics **monthly summary** block.
14. Settings: focus mode, energy mode, ambient preset, studio theme.
15. Dashboard **Share progress** opens save dialog (Electron) or downloads PNG (web).

## Review & skills

8. Spaced review quest appears in next-action when due (after dailies done).
9. Skills node panel shows **recommended practice** hint when node is due.
10. Materials opens from skill node in **learn** mode (`view=learn` in URL).

## Mobile nav

11. Bottom bar **«Ещё»** exposes Materials and Progress on narrow screens.

## Persistence

12. Export/import progress JSON — `materialEngagement`, `improvementNotes` on works preserved.
13. Web fallback: no crash without `electronAPI`; save still works.

## Automated smoke

```bash
npm run test
npm run test:e2e          # Playwright web (product-flow + smoke)
npm run test:e2e:electron # Real Electron IPC + session tick
```

Unit tests cover: `nextBestAction`, `recommendedQuest`, `reviewShelf`, `fundamentalsProgress`, `questCompletionService` (catalog/warmup/micro-challenge/timeout helpers).

Playwright (`e2e/product-flow.spec.ts`): dashboard dailies, quests, materials `view=learn` + engagement hint, materials engagement persistence, statistics + monthly summary + recurring mistake from feedback, skills, gallery + growth wall + lightbox review notes, mobile More → Materials/Progress, goals history link, beginner fundamentals gate, fundamentals page tiers, review shelf overdue item, quest submit → persisted log, dashboard **Also practice** when weak line feedback, quest session focus page, export envelope shape, share progress PNG web fallback, chest reveal modal.
Playwright (`e2e/onboarding.spec.ts`): first-launch profile setup through avatar → quick tour welcome dialog.
Electron (`e2e-electron/electron-smoke.spec.ts`): overlay payload sync, overlay advance/cancel quest session commands.

Playwright (`e2e/onboarding.spec.ts`): first-launch profile setup through avatar to dashboard dailies.

Playwright (`e2e/smoke.spec.ts`): settings persistence after reload.

Electron (`e2e-electron/electron-smoke.spec.ts`): preload IPC, corrupt save rejection, chunk merge load, gallery IPC, session tick pulses, overlay payload sync, quest session command dispatch.
