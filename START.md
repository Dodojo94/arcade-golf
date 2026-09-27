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

1. Hole 1 blockout: dark rough, fairway, bright green, a left greenside bunker, water on the right, a gold tee, and a red pin
2. HUD: **Arcade Golf V0 — Hole 1**, Par 3 · 22m, the lie (Tee / On the green / In the hole / …), and an 8 mph wind arrow
3. A power bar and a strike zone (Duff / Hook / Nice / Slice / Duff)

### Controls

| Key | Action |
|-----|--------|
| A / D or Left / Right | Aim (only while addressing the ball) |
| Space or left click | 3-click swing: start → power → accuracy |
| R | Put the ball back on the tee |

Hit the green center of the strike bar for **Nice Shot**. A full driver should finish **on the green**, a couple of meters right of the cup because of the crosswind. Stopping inside the black cup reads **In the hole** (aim a little left and don’t overcook it). A big slice finds the water; aiming hard left can plug the bunker. **R** replays from the tee. Holes 2 and 3 are not in yet.

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
- Ball doesn't move: click or press Space three times (start, power, accuracy). `R` returns it to the tee.
