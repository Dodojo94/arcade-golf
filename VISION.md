# VISION — Arcade Golf

## North star

Arcade **3-click golf** in the browser: cheerful, readable courses with a Mario Golf 64 / Powerstar Golf vibe. Instant feel, clear feedback, fun in a short session — not a sim.

## V0 (locked)

**Stack:** Three.js + physics (plain Vite + three + cannon-es or Rapier). `@react-three/fiber` is optional, not required.

**Gameplay:**

- 3 holes
- 3-click swing meter
- 1-player stroke play

### In scope (V0)

- 3 holes
- 3-click swing
- Aim + wind
- Clubs: driver / iron / wedge / putter
- Lie modifiers
- Simple putting
- Scorecard

### Out of scope (V0)

- Career mode
- Multiplayer
- Power-ups
- 9 / 18 holes
- Full spin UI
- Character unlocks

## Design intent

- Readable fairways and hazards at a glance
- Punchy arcade timing on the swing meter
- One sitting = a full 3-hole round with a scorecard

## Success for the seed

- `npm install && npm run build` succeeds
- `npm run dev` serves a page with a Three.js canvas + HUD stub
- Cold-read docs present; repo pushed to `origin/main`
