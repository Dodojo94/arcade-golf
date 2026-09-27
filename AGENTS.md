# AGENTS — Arcade Golf

Roles and rules for humans and bots working on this repo.

## Roles

| Role | Who | Focus |
|------|-----|--------|
| **PM** | Niki | Scope, priorities, acceptance, keeping V0 locked |
| **Lead coder** | Sacred | Architecture, core gameplay loop, physics wiring, merges coordination |
| **3D** | Mesh | Course geometry, materials, camera, readable fairway presentation |
| **Design / HUD** | Lazy | UI chrome, swing meter presentation, scorecard, readability |
| **Review** | Liesye | PR review, quality bar, catching scope creep |

## Collaboration rules

1. **Bots never merge.** Agents open PRs; humans (or an explicitly designated human) merge.
2. Day-to-day discussion lives in the **Arcade Golf Build** and **Arcade Golf Consult** rooms — not buried only in PR threads.
3. Stay inside [VISION.md](./VISION.md) V0 in/out. If something is “Out”, park it or ask Niki before coding it.
4. Prefer small PRs with a clear demo path (`npm run dev` / screenshot / short note).
5. Do not rewrite the stack (e.g. forcing R3F) without PM + lead coder alignment.

## Suggested workflow

1. Read START → VISION → FOLDERS → this file.
2. Branch from `main` for feature work (greenfield seed was an exception: direct push to `main` OK once).
3. Implement, run `npm run build`, open PR.
4. Liesye (or peer) reviews; Sacred / Niki unblock; human merges.

## Seed exception

The initial greenfield seed may push directly to `main`. After that, use PRs.
