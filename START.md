# START — Arcade Golf

How humans and bots get a running game on day one.

## Prerequisites

- **Node.js 20+** (LTS recommended) and npm
- Git
- A modern browser (Chrome / Edge / Firefox / Safari)

Check:

```bash
node -v
npm -v
```

## Clone and run

```bash
git clone https://github.com/Dodojo94/arcade-golf.git
cd arcade-golf
npm install
npm run dev
```

Open `http://localhost:5173` (or the URL Vite prints).

You should see:

1. A Three.js canvas with sky + green fairway + white ball
2. HUD text: **Arcade Golf V0 — Hole 1**
3. A stub swing meter bar at the bottom (non-functional chrome is OK for seed)

## Common commands

```bash
npm run build    # must succeed (tsc + vite build)
npm run preview  # serve dist/
```

## Windows notes

- Install Node from https://nodejs.org/ or use nvm-windows.
- Run the same `npm` commands in PowerShell, cmd, or Git Bash.
- Antivirus sometimes locks `node_modules`; retry `npm install` or exclude the project folder.
- WSL2 is fine and often smoother for Git + Node workflows.

## Bot / agent quick path

1. Read [VISION.md](./VISION.md) and [AGENTS.md](./AGENTS.md) before coding.
2. Work under `/workspace/arcade-golf` (or your clone) on a feature branch unless the task says otherwise.
3. Prove the seed still works: `npm install && npm run build`.
4. **Bots never merge** — open a PR; humans merge.

## If something fails

- Blank page: check the browser console; confirm `#game-canvas` exists.
- `tsc` errors: fix TypeScript before pushing; `build` runs `tsc`.
- Physics not moving the ball: expected in seed — see TODO in `src/main.ts`.
