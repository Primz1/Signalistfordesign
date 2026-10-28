---
name: motion-gsap-lenis-reactbits
description: "Implements the agency-grade web motion stack (@jackroberts___ reel DePLcw_Dbwo): Lenis for silky smooth scrolling, GSAP + ScrollTrigger for scroll-driven choreography, and React Bits (reactbits.dev / DavidHDev/react-bits) for animated text, backgrounds, and interactive components."
---
# Agency Motion Stack: GSAP + Lenis + React Bits

When building marketing pages, scrollytelling experiences, portfolios, or high-craft product launches that need rhythm and motion beyond basic CSS transitions:

## 1. Lenis (`lenis` / `lenis/react`) — Silky Smooth Scroll
- Install: `npm install lenis`
- Sync Lenis with GSAP's `ScrollTrigger` ticker so scroll-linked animations never jitter:
```tsx
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```
- **Rule:** Use Lenis on marketing/editorial scroll pages; **do not** hijack native scroll inside dense data tables or app panes with independent internal scrollbars unless scoped carefully.

## 2. GSAP (`gsap` + `ScrollTrigger`) — Scroll Choreography & Timelines
- Install: `npm install gsap @gsap/react`
- Use `useGSAP()` hook for automatic cleanup in React.
- Default ease for entrances: `power3.out` or `expo.out` (never `power1.in` on UI entrances).
- Use `ScrollTrigger` for pinned narrative sections, scrubbed progress timelines, and staggered section reveals (`stagger: 0.06` to `0.1`).

## 3. React Bits (`reactbits.dev` / `github.com/DavidHDev/react-bits`) — 215+ Animated React Components
- Pull source-owned components directly via CLI:
  - `npx shadcn@latest add @react-bits/SplitText-TS-TW`
  - `npx shadcn@latest add @react-bits/BlurText-TS-TW`
  - `npx shadcn@latest add @react-bits/CountUp-TS-TW`
  - `npx shadcn@latest add @react-bits/Magnet-TS-TW`
  - `npx shadcn@latest add @react-bits/SpotlightCard-TS-TW`
  - `npx shadcn@latest add @react-bits/Aurora-TS-TW`
- **Restraint Rule:** Pick 1–2 signature React Bits components per page (e.g., `SplitText` or `BlurText` on the hero headline + `CountUp` on real metrics). Never stack 5 competing shader backgrounds on the same screen.
