---
name: single-accent-color
description: "Applies the Single High-Contrast Accent Color principle (@uxui_shrut reel DfAAFTxIjlP): pair a cohesive 2-tone base palette (90-95% of the UI) with ONE unforgettable accent color (5-10%) reserved strictly for primary CTAs, focal highlights, and active data."
---
# Single Accent Color Architecture (@uxui_shrut)

A good layout becomes unforgettable when 90–95% of the surface stays in a disciplined 2-tone base palette (background canvas + elevated surface/muted structure) and **ONE unmistakable accent color** commands the remaining 5–10% (primary CTA, focal graphic highlight, or primary chart series).

## Proven 3-Token Palette Archetypes (from `DfAAFTxIjlP`)
1. **Dark Tech / Fintech Precision ("Electric Blue & Acid Green"):**
   - Base Canvas: Midnight Black `#090909`
   - Secondary Surface / Depth: Muted Steel Blue `#182A4D` (or `#111622`)
   - Single Accent: Acid Green `#CCFF00` (or Electric Emerald `#10B981`)
2. **Bold Editorial / Creative ("Deep Purple & Vibrant Orange"):**
   - Base Canvas: Vivacious Orchid `#D6A8E1` (or Warm Ivory `#F6F4F0`)
   - Secondary Surface / Ink: Deep Aubergine `#4A1E4A`
   - Single Accent: Vibrant Orange `#FF4D00`
3. **Timeless Luxury / Earthy Craft ("Dusk Sage & Rich Burgundy"):**
   - Base Canvas: Dune Taupe `#C4B299` / Warm Stone `#F4F1EA`
   - Secondary Surface: Muted Sage Leaf `#8F9779`
   - Single Accent: Rich Burgundy `#6B1111`

## Strict Enforcement Rules
- **Never dilute the accent:** If everything is highlighted, nothing is. Use the accent on the 1 primary CTA per viewport, active indicator, and primary data line.
- **Secondary text on colored/dark surfaces:** Tint secondary text slightly toward the surface hue rather than using dead flat `#808080` gray.
- **Semantic vs. Brand Accent:** In financial/analytics dashboards, keep semantic positive/negative (`emerald` / `rose`) strictly on price deltas and status badges, while the shell chrome remains neutral near-black/near-white.
