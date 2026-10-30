# Reference study — how premium sites design (for Signalist v3)

Sources reviewed 2026-10-29: apple.com, apple.com/iphone, meta.com, stripe.com, linear.app, robinhood.com, mercury.com (pro-finance reference), plus Paul's annotated screenshots of Signalist v2.

## 1. Typography does the structuring
- **Apple**: headline 56–80px (SF Pro Display, weight 600, tracking ≈ -0.015em to -0.03em, line-height 1.05). Sub-headline 21–28px weight 400–500, muted grey (#86868b). Body 17px/1.47. Copy is short: "Hello, hello." / "Pro further." Two lines max.
- **Linear**: one huge sentence hero (~64px, weight 500, tight tracking), one muted line beneath, then the product. Section titles are 2-line statements ("Planning\nand monitoring") with a small paragraph + "Learn more →".
- **Robinhood / Mercury**: the number IS the hero. Portfolio value at 40–64px, tabular figures; change in green/red directly underneath at ~15px; no label boxes.
- Takeaway: 3–4 sizes only (display 64–88, title 32–40, body 16–17, meta 13). Weight contrast over color contrast. Tabular-nums for all prices.

## 2. Sections separate with space and surface, not borders
- Apple alternates full-bleed surfaces (#000 / #fff / #f5f5f7) with 120–160px vertical padding; zero borders on the page.
- Linear uses one hairline between major sections at most and leaves 160px+ of air.
- Stripe groups content by alignment on a 12-col grid; cards appear only where an object is literally an object (a product screenshot).
- Takeaway: **no box unless the thing is an interactive object** (input, button, menu, modal). Lists = rows with whitespace and an optional 1px hairline at 6–8% opacity. KPIs = big numbers in a row, separated by gap.

## 3. Color restraint
- Apple: black/white/grey + product imagery supplies color. Links in one blue.
- Linear: near-black #08090a, text #f7f8f8 / #8a8f98, one accent used sparingly.
- Robinhood: one brand green used for the CTA and positive price; red only for losses.
- Takeaway: neutral base + one accent + green/red strictly for price direction. **No purple, no gradients-as-decoration, no glow blobs, no aurora, no dot grids.**

## 4. Motion restraint
- Apple: fade + 20–40px rise on scroll, 600–900ms, ease-out; sticky scrolly product reveals; nothing loops for attention.
- Linear: subtle opacity reveals, product UI animates "doing work".
- Takeaway: one reveal pattern (opacity+y, 0.7s, power3.out, stagger 0.06), number count-ups once, prefers-reduced-motion honored. No marquee tickers, no blinking "LIVE" pills, no magnetic gimmicks everywhere.

## 5. Imagery / product as hero
- Apple and Linear show the actual product big and crisp. For Signalist the product is the chart: one large, calm, native chart (our own SVG/canvas, themed), not a stack of mini widgets. Never embed a white third-party widget on a dark page.

## 6. Navigation
- Apple: thin 44–48px bar, plain text links 12–14px, no pills, no chips. Search is an icon. Linear: logo + 5 text links + 2 buttons.
- Takeaway: logo · 4 text links (active = full-contrast text, others muted) · search icon/⌘K · avatar. Market status as plain muted text at most (or not at all).

## 7. Forms (sign-in)
- Apple ID / Stripe sign-in: no card around the form; centered column 360–400px on a plain background, large title, underline-free inputs with soft fill, one primary button. No decorative side panel full of status chips.

## Signalist v2 problems found (Paul's circles + own audit)
1. Boxes around everything (KPI cards, form card, chart card, watchlist card, buttons-in-boxes).
2. Dot-grid backgrounds, aurora/glow blobs, purple/indigo accents (ATR bars, "AFTER-HOURS" dot, gradients).
3. Gimmick pills: AFTER-HOURS, "20ms · WS LIVE", "AI REGIME CONVICTION —/100" empty card, "Awaiting signals".
4. Typo "Good evening, Jogn" (preview data / name handling).
5. White TradingView mini widget on dark dashboard.
6. Noisy filled sparklines under every KPI; mixed lime/cyan/blue/yellow accents.
7. Landing hero: headline split around a floating terminal (text overlaps chart), 5+ accent colours, bento of boxes, ticker marquee.
8. Next.js dev "N" badge is dev-only (fine), but footer disclaimer was overlapping it on sign-in.
