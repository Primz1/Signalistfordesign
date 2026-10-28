# Master UI Design Principles & Claude Code Skill Bundle

This master guide synthesizes Paul's core design rules (`/workspace/perfume-store/DESIGN_RULES.md`) with the Claude Code UI/UX skills extracted from Paul's saved Instagram reels:
1. **Emil Kowalski's Design Skills** (`emilkowalski/skills` — `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `mobile-native`, `break-ui`)
2. **Apple Design (`apple-design`)** (`emilkowalski/skills` — featured in `@aiwithremy`'s "Skill of the Week" reel `Dem22vaz4mc`)
3. **Impeccable** (`pbakaus/impeccable` — 24 commands & 61+ deterministic anti-slop rules, featured in `@petergriffin.ai`'s reel `DerxrOmTkCt`)
4. **Taste Skill** (`Leonxlnx/taste-skill` & `senlindesign/taste-skill` — 247 curated sites + 23 real product app screens/dashboards, featured in `@petergriffin.ai`'s reel `DerxrOmTkCt`)
5. **Material Depth & Real Browser Verification** (`expo-glass-effect` from `@guhmp4` reel `DdSm2VSsnKe` + Playwright MCP verification)

---

## 1. Core Foundation (Paul's Design Rules)
- **Layout & Spacing:** 8px scale only (`4, 8, 12, 16, 24, 32, 48, 64`). Generous whitespace. Tight groups, generous separation, and more space above a heading than below it. One focal point per section. Grid-aligned, left-aligned text. Max width `1100–1200px` for marketing/content; body measure `60–75ch`. Must work cleanly at `360px` mobile width with `16px` padding and zero horizontal scroll.
- **Typography:** Choose one purposeful typeface (or pairing with clear hierarchy), never raw unstyled browser defaults. Scale `12 / 14 / 16 / 20 / 24 / 32 / 48`. Body `16px` (`1rem`) with `line-height: 1.5`. Build hierarchy through **size + weight + leading**, never washed-out gray text. Weights `400 / 600 / 700` max. Headings use `line-height: 1.05–1.25` with size-specific negative tracking (`-0.02em` to `-0.04em`); small labels use slight positive tracking. Sentence case by default; `ALL CAPS` only for tiny micro-labels (`10–12px`).Tabular numerals (`font-variant-numeric: tabular-nums`) on all prices, tickers, deltas, tables, and timestamps.
- **Color:** Neutral near-white / near-black surfaces (never pure `#000000` or `#ffffff`) plus **ONE** intentional primary accent used sparingly (primary action, active state, or primary data series). Semantic colors (`positive`, `negative`, `warning`) are reserved strictly for meaning (e.g., market gains/losses or alerts), never decoration. WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text). Define CSS custom property tokens and support dark/light mode cleanly.
- **Components:** Consistent border-radius system (`6px–8px` for dense product UI). Subtle `1px` low-contrast borders OR soft offset shadows—never both heavy. One primary filled button per view; secondary actions outlined or ghost. Tap targets `>= 44px`. Complete interactive states (`:hover`, `:active`, `:focus-visible`, `:disabled`, loading, empty, error). Icons from one consistent stroke set only (e.g. Lucide SVG) or none.
- **Browser Surfaces:** Theme text selection (`::selection`), caret, scrollbars, focus rings, and tabular numerals to match the palette.

---

## 2. Anti-Slop Bans (from *Impeccable* & *Taste Skill*)
Never ship generic AI templates. Explicitly refuse and eliminate:
- **No purple-to-blue gradients**, neon glows, or decorative rainbow blurs.
- **No gradient text.** Emphasis comes from size, weight, and placement.
- **No eyebrow/kicker pills above every heading.** Let headings carry their own weight.
- **No 3-column identical icon-in-a-tinted-square cards** under a centered heading.
- **No cards nested inside cards** or heavy drop shadows paired with thick borders.
- **No colored `border-left` > 1px** on cards or callouts as a lazy accent.
- **No decorative emoji or Unicode glyphs** standing in for real UI iconography.
- **No placeholder/fake vanity metrics** or numbers that fail to reconcile (`parts must sum to totals`).

---

## 3. Product Dashboards & Financial/Data App Screens (from *Taste Skill v2.1 App Screens*)
For screens people work in (dashboards, stock trackers like **Signalist**, analytics, watchlists, portfolios):
1. **Color goes on data, not chrome:** Keep ~95% of the shell neutral. Spend color on the primary data series, live price deltas (green/red semantic), or the single most important status indicator.
2. **KPIs are typography, not tiles:** Never put an icon in a colored circle on a KPI card. Lead with the figure in `tabular-nums`, clear unit/currency, and a baseline-anchored delta (`+2.41% today` vs bare `+2.41%`).
3. **Surfaces are flat & structured:** Separate panels with `1px` structural hairline borders (`border-subtle`) or a single background tone step—not floating drop-shadow cards with wide gaps.
4. **No marketing hero header inside the app:** App screens answer their primary question in the first viewport (`1440x900` desktop, `360–390px` mobile) without giant marketing banners pushing data below the fold.
5. **Charts carry minimal chrome:** Single series needs no legend; use 3–5 faint gridlines max, clear axis labels, and a custom crosshair/tooltip with tabular figures.
6. **Navigation recedes:** Active nav items use a quiet surface pill or crisp foreground text contrast, not loud neon banners. On mobile, navigation folds cleanly away.
7. **Tables are rules and alignment:** No zebra striping, no heavy header bands. Left-align text/tickers, right-align all numbers/prices/percentages (`tabular-nums`), and keep row pitch scannable (`36–44px`).
8. **Honest data states:** Zeros print as `0.00`, missing values as an em-dash `—`, loading states use layout-matched skeletons, and empty states keep their frame and offer a direct action.

---

## 4. Motion, Interactions & Design Engineering (from *Emil Kowalski* & *Apple Design*)
1. **Frequency Gate — Should it animate at all?**
   - **100+ times/day** (keyboard shortcuts, command palette `Cmd+K`, ticker switching, list navigation): **0ms / instant.** Never animate keyboard-initiated actions.
   - **Occasional** (drawers, modals, popovers, toasts): Fast, purposeful transition (`150–250ms`).
2. **Easing & Duration Rules:**
   - **Never use `ease-in` on UI entrances.** Use strong custom `ease-out` curves so movement starts instantaneously:
     - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
     - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
     - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
   - **Keep UI transitions under `250–300ms`:** Button press `100–160ms`, tooltips/popovers `125–200ms`, dropdowns `150–220ms`, modals/sheets `200–350ms`.
3. **Tactile Component Details:**
   - **Buttons respond on pointer-down:** `.button:active { transform: scale(0.97); }`
   - **Never animate from `scale(0)`:** Enter from `scale(0.95)` + `opacity: 0`.
   - **Origin-aware popovers:** Scale dropdowns and popovers from their trigger (`transform-origin: var(--transform-origin)`), not `center`.
   - **Interruptibility:** Prefer CSS transitions or critically damped springs (`damping: 1.0, response: 0.35`) over `@keyframes` so rapid state changes re-target smoothly without jumping.
   - **Translucent Chrome (when used):** Use subtle `backdrop-filter: blur(16px) saturate(180%)` with a `1px` specular top/bottom border only on sticky headers/command bars where content scrolls underneath—never stack translucent layers on top of each other.
   - **Accessibility:** Always honor `@media (prefers-reduced-motion: reduce)` and `@media (prefers-reduced-transparency: reduce)`.

---

## 5. Verification Loop (Playwright Browser Check + Stress Test)
Before declaring any UI work complete:
1. **Multi-Viewport Browser Verification (Playwright):** Render and inspect the live app at Desktop (`1440×900`) and Mobile (`375×812` / `360×800`). Verify zero horizontal overflow, proper alignment, loaded fonts, and working interactive states.
2. **Break-UI Stress Test (`break-ui`):** Test with worst-case data—long company names, 6-character tickers, large market caps (`$3.42T`), negative double-digit percentages (`-14.82%`), empty watchlists, and slow network states.
3. **Squint Test:** Blur your eyes at the viewport—the primary hierarchy (current asset/market state, primary chart/watchlist, and primary action) must stand out immediately without visual clutter.
