---
name: alive-motion-ugoki
description: "Fixes robotic UI and motion-graphic animations using the 3 Moves from @ugoki.ai (reel De-LYA1xhDV): Anticipation (pull back 4-6 frames before moving), Offset/Stagger (delay grouped items by 2-4 frames into a wave), and Directional Motion Blur (stretch/blur along the motion vector, land sharp)."
---
# 3 Moves to Fix Robotic Animation (@ugoki.ai)

Even with clean bezier curves, animations feel "robotic" when objects move as rigid blocks without physical intent. Apply these three principles when crafting hero animations, motion graphics, or expressive transitions:

1. **Move 1 — Anticipation ("It pulls back before it moves"):**
   - Before a major spatial movement or launch, pull the element slightly backward in the opposite direction (~3–6% scale/translation over `60–100ms` / ~4–6 frames at 60fps), like bending at the knees before jumping.
2. **Move 2 — Offset / Stagger ("Offset by 2 to 4 frames"):**
   - When multiple elements (letters in a headline, cards in a row, rows in a list) enter together, simultaneous arrival reads like a rigid block. Offset each item by `30–65ms` (2–4 frames at 60fps) so the group moves as a fluid wave.
3. **Move 3 — Directional Motion Blur & Stretch ("Blur in the direction of motion, land sharp"):**
   - Fast-moving elements without blur look stuttery to the human eye. Apply subtle velocity-proportional blur (`filter: blur(1.5px–3px)`) or micro-stretch along the axis of motion during peak velocity, and snap to `blur(0px)` the exact frame it settles.
