# Signalist — UI craft for this repository

Before any visual, layout, motion, or component work, read these and follow them. They override generic UI habits.

1. `UI_DESIGN_PRINCIPLES.md` (repo root) — Paul's rules plus the skill synthesis for this product.
2. `.claude/skills/taste-skill/references/app-screens.md` — dashboards, tables, charts, empty states.
3. `.claude/skills/impeccable/reference/craft-floor.md` — bans and the craft floor.
4. `.claude/skills/apple-design/SKILL.md` — type, feedback, materials, reduced motion.
5. `.claude/skills/emil-design-eng/SKILL.md` — motion frequency, easing, press states, popover origin.
6. `.claude/skills/mobile-native/SKILL.md` — touch, 16px inputs, safe areas, 360px.
7. `.claude/skills/break-ui/SKILL.md` — worst-case names, caps, deltas, empty lists.

Also available in `.claude/skills/`: `animate`, `review-animations`, `improve-animations`.

## Non-negotiables

- Spatial scale only: 4, 8, 12, 16, 24, 32, 48, 64. Marketing content max width 1120px. 16px page padding. No horizontal scroll at 360px.
- Type scale only: 12 / 14 / 16 / 20 / 24 / 32 / 48. Weights 400 / 600 / 700. Headings tracking -0.02em to -0.04em. Body line-height 1.5. Sentence case. ALL CAPS only on 12px micro-labels with positive tracking.
- `font-variant-numeric: tabular-nums` on every price, ticker, delta, axis, timestamp, and table cell.
- Near-black and near-white surfaces (never `#000` or `#fff`). Separate with 1px `border-subtle`, not drop shadows or nested cards. About 95% of the chrome stays neutral. Color is for the primary chart series, emerald/crimson deltas, and one primary action per view.
- Radius 8px. Tap targets at least 44px. `:active { transform: scale(0.97) }`. Popovers and sheets use `cubic-bezier(0.23, 1, 0.32, 1)` and stay under 200ms. Command palette (`Cmd+K`) and ticker switches are 0ms.
- Both light and dark modes, WCAG AA.
- No purple gradients, gradient text, neon glow, eyebrow pills, icon-in-a-tinted-circle KPI tiles, zebra tables, or decorative emoji.
- Empty states keep their frame and offer one action. Missing numbers are an em dash. Loading skeletons match the layout they replace.

The product face is IBM Plex Sans for the product, Newsreader for marketing display, and IBM Plex Mono for code. Amber is the single signal (primary button, alert level, main series). It is not a link color or a nav highlight.
