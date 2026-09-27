# GROK_BUILD — instructions for Grok Build (and similar coding agents)

Paste a **task prompt** from Niki/dodo into Grok Build. This file is the standing rulebook for every session on `Dodojo94/arcade-golf`. Cold-read it **before** coding.

## Repo

- **GitHub:** https://github.com/Dodojo94/arcade-golf
- **Default branch:** `main`
- **Stack (locked):** Vite + TypeScript + `three` + `cannon-es` (Rapier OK only if the task explicitly switches; do not add React / R3F unless asked)
- **Genre:** Mario Golf 64 / Powerstar Golf — arcade, not a sim

## Before you touch code

1. Read [VISION.md](./VISION.md) (V0 in/out is law).
2. Read [FOLDERS.md](./FOLDERS.md) and grow toward that layout; do not invent parallel trees.
3. Read [AGENTS.md](./AGENTS.md) — **bots never merge**.
4. `git pull` / clone latest `main`, then create a **feature branch**:
   ```bash
   git checkout main && git pull
   git checkout -b work/<short-slug>
   ```
5. Prove baseline: `npm install && npm run build`

## Hard rules

| Do | Don't |
|----|--------|
| Stay inside VISION V0 **In** | Ship career, multiplayer, power-ups, 9/18 holes, full spin UI, unlocks |
| Small, demoable PR | Huge kitchen-sink branches |
| `npm run build` must pass | Push with failing `tsc` / vite build |
| Open a PR to `main` with how to playtest | Merge the PR yourself |
| Prefer keyboard/mouse: Space or click for 3-click meter | Require gamepad for V0 |
| Keep HUD readable (Lazy owns polish later) | Fancy UI frameworks |

## 3-click swing (canonical)

1. **Click 1** — start meter (cursor moves toward max power).
2. **Click 2** — set power (stop near the power target / left edge for full).
3. **Click 3** — set accuracy in the meet / strike zone (center = Nice Shot; miss = hook/slice or duff).

Putting may omit the accuracy click (power + aim only) — Powerstar-style.

## Physics / feel

- Wire `cannon-es` (already a dependency) unless the task says otherwise.
- Ball must leave the tee with velocity from power × club; wind can be a simple horizontal force in V0.
- Arcade > realistic. Prefer readable arcs and snappy stop on green over Tour-accurate spin.

## Deliverable checklist (every Grok Build task)

- [ ] Branch `work/<slug>` from latest `main`
- [ ] Implements **only** what the paste prompt asks
- [ ] `npm run build` succeeds
- [ ] `npm run dev` — short “how to try it” in the PR body
- [ ] PR opened against `main` (title + summary); **do not merge**
- [ ] Comment in PR: files touched, leftover TODOs, decisions needing human/Niki

## Handoff back to the team

After the PR is up, tell the human (dodo) the **PR URL**. Sacred / Liesye / Lazy / Mesh review in **Arcade Golf — Build**; Consult only if feel/scope is contested. Niki tracks acceptance; **dodo merges**.

## Out of scope unless the paste prompt says so

Art pipeline, Blender exports, full 3-hole course data, scorecard persistence, audio, mobile layout, React.

## If blocked

Stop, list the blocker in the PR or a comment, and do not invent product locks. Escalate via Niki → dodo.
