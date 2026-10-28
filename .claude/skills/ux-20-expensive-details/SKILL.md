---
name: ux-20-expensive-details
description: "Audits and implements the 20 micro-UX details from Apple, Linear, Gmail, Stripe, and Amazon (@murphmaxxing reel De-D3TxhKCs) that make web & mobile apps feel expensive. Use when building, polishing, or auditing any product UI, dashboard, table, form, navigation shell, or interactive workflow."
---
# 20 Expensive UX Details Audit & Implementation Skill

Audit every application against these 20 concrete engineering details from Apple, Linear, Gmail, Stripe, and Amazon, and implement the ones applicable to the current surface:

## Data, Perceived Speed & Network Resilience
1. **Skeleton Loaders:** Never show a blank white screen or centered spinner for page/panel loads. Render layout-matched shimmering skeleton blocks that mirror the exact geometry of the incoming content.
2. **Optimistic Updates:** Update the UI state on the exact frame the user clicks (e.g., watchlist toggle, bookmark, status change, archive), then reconcile with the server in the background and roll back with an error toast only on failure.
3. **Stale-While-Revalidate (SWR):** Show cached data immediately on navigation and quietly refresh in the background without flashing loading spinners.
4. **Pre-rendering / Prefetching:** Prefetch route data and assets on link `:hover` / `pointerenter` (or viewport intersection) so page transitions feel instantaneous.
5. **BlurHash / LQIP Placeholders:** Decode a compact BlurHash or low-quality image placeholder while high-res photos/avatars load so images never pop in from empty space.
6. **Idempotency Keys:** Attach an idempotency key (`crypto.randomUUID()`) and disable/lock in-flight mutation triggers on payment, order, or form submission buttons so double-clicks never create duplicate records.

## Navigation, Menus & Spatial Ergonomics
7. **Command Menu (`Cmd+K` / `Ctrl+K`):** Provide an instant (`0ms` open), keyboard-first Spotlight/Linear-style command palette with fuzzy search, grouped actions, and visible keyboard shortcut badges.
8. **Shortcut Hints:** Display subtle keyboard shortcut badges (`G` then `H`, `Cmd+K`, `/`, `Esc`) inside tooltips, buttons, and menus to teach power users effortlessly.
9. **Undo Toasts (Gmail style):** For non-catastrophic destructive or archiving actions, execute immediately and show a crisp bottom toast with an `Undo` action button instead of interrupting with a confirmation modal.
10. **Context Menus:** Support clean right-click / `⋯` floating context menus with generous padding, `1px` inner border, keyboard arrow navigation, and red-tinted destructive items separated by a hairline divider.
11. **Amazon Safe Triangle:** In hover-triggered submenus, popovers, or chart crosshairs, compute a diagonal safe-triangle corridor from the trigger toward the submenu so moving the cursor diagonally never accidentally closes the menu.
12. **View Transitions:** Use the View Transitions API (`document.startViewTransition`) or shared-layout morphing so shared elements (cards, headers, avatars) transition smoothly across routes/views.

## Touch, Physics & Mobile Polish
13. **Swipe-to-Dismiss Sheets:** Mobile drawers and modals use bottom sheets with drag-to-dismiss velocity projection and rubber-banding at boundaries.
14. **Interruptible Animations:** Use CSS transitions or velocity-preserving springs—never locked `@keyframes`—so grabbing or reversing an element mid-flight smoothly redirects from its live on-screen position.
15. **Predictive Back:** Preview the underlying screen or scale down the current sheet continuously as the user drags back.
16. **Hit Slop (`>= 44px`):** Expand the invisible tap/click target (`::after` inset `-8px` to `-10px`) around small icon buttons, close buttons, and checkboxes so users never miss a click.
17. **Safe Area Insets:** Respect `env(safe-area-inset-top/bottom/left/right)` on fixed toolbars, bottom navs, and sheets so notches and home indicators never clip controls.
18. **One-Time Code Autofill:** On OTP/2FA and verification inputs, set `autocomplete="one-time-code"` and `inputmode="numeric"`, and handle multi-character paste across slots automatically.

## Visual Craft & Typography
19. **Tabular Numbers (`tabular-nums`):** Apply `font-variant-numeric: tabular-nums` to all prices, tickers, percentages, counters, timers, and table columns so digits align vertically and never jitter when live-updating.
20. **Balanced Headlines & Continuous Corners:** Apply `text-wrap: balance` on headings (`text-wrap: pretty` on body copy), use concentric/continuous border radii (`outer_radius = inner_radius + padding`), and layer a `1px` subtle inner border (`rgba(255,255,255,0.08)` dark / `rgba(0,0,0,0.06)` light) with a soft diffused shadow instead of flat harsh outlines.
