# ArtQuest Art Bible

Visual language for the **art studio RPG** experience: calm studio surfaces, readable skill progression, and reward moments that feel earned—not arcade noise.

## Palette & tokens

All colors flow from CSS custom properties in `src/renderer/styles/variables.css`:

| Token | Role |
|-------|------|
| `--bg-deep`, `--bg-primary`, `--bg-secondary` | App surfaces |
| `--text-primary`, `--text-secondary` | Typography |
| `--accent`, category accents | Skill tracks & highlights |
| `--success`, `--warning`, `--danger` | Feedback states |

Themes (`modern`, `light`, `rpg`, `studio`) remap the same tokens—never hard-code hex in components except VFX presets.

## Icon grammar

- Skill tree icons use **SVG stroke icons** (`RpgSkillNodeIcon`) mapped via `NODE_SKILL_ICON_KEYS`.
- Stroke weight: 1.4px at 24×24 viewBox; round caps/joins.
- Category color tints the icon via `CATEGORY_INFO[category].color`.
- Empty states may use emoji temporarily; tree UI uses SVG only.

## Edge treatment

- Cards: `--radius-md`, subtle border `var(--border-subtle)`.
- RPG theme: optional gold edge on primary CTAs only—not every panel.

## Reward visual grammar

1. **Micro** — CSS pulse (`QuestScreenCelebration`) when `reduceMotion` or `vfxQuality: off`.
2. **Normal** — WebGL/canvas particle burst (`VfxWebglLayer`) + existing SFX.
3. **Enhanced** — Higher particle counts; same presets, category-accent colors.

## Motion

Respect `html[data-motion='reduce']` and `settings.reduceMotion`. No parallax on essential UI.

## Audio layers

1. **Micro-SFX** — UI clicks, phase ticks (`sound.ts`).
2. **Ambient bed** — Session loop crossfades (`ambientSound.ts`).
3. **Reward stingers** — Quest complete / level up; category material variants via `audioMaterialPalette.ts`.

## Typography

Use theme font stacks from variables; scale via `data-font-scale` (small / medium / large).

## Do / Don't

- **Do** keep dashboard sidebar density consistent at min 800×720.
- **Do** pair ObjectURLs with `revokeObjectURL` on unmount.
- **Don't** mix emoji skill icons in the tree (use SVG mapping).
- **Don't** add full-screen blocking overlays except onboarding and session finish.
