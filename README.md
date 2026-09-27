# Arcade Golf

Browser arcade golf with a Mario Golf 64 / Powerstar Golf vibe — cheerful, readable courses and a classic **3-click swing meter**.

**V0:** Three.js + physics · 3 holes · 1-player stroke play.

## Play / develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). You should see a fairway, a ball on the tee, a pin downrange, and a live 3-click swing meter.

| Control | Action |
|---------|--------|
| A / D or ← / → | Aim left / right (before the swing) |
| Space or click | Swing: start, set power, set accuracy |
| R | Reset the ball to the tee |

Center of the strike bar is **Nice Shot**. A miss hooks, slices, or duffs. A light crosswind shows in the top-right HUD and nudges the ball in the air.

| Script | What it does |
|--------|----------------|
| `npm run dev` | Local Vite dev server with HMR |
| `npm run build` | Typecheck (`tsc`) + production bundle → `dist/` |
| `npm run preview` | Serve the production build locally |

### Stack (V0)

- [Vite](https://vitejs.dev/) + TypeScript
- [three](https://threejs.org/) for the 3D scene
- [cannon-es](https://github.com/pmndrs/cannon-es) steps the ball each frame (driver impulse, wind, roll)

Plain Vite + three is intentional; `@react-three/fiber` is optional later, not required for V0.

### Windows notes

- Use Node.js 20+ LTS from [nodejs.org](https://nodejs.org/) or `nvm-windows`.
- Prefer PowerShell or Git Bash; `npm run dev` works the same as on macOS/Linux.
- If the port is busy: `npx vite --port 5174`.

## Docs (cold-read)

| File | Purpose |
|------|---------|
| [START.md](./START.md) | First-run for humans and bots |
| [VISION.md](./VISION.md) | North star + V0 in/out |
| [AGENTS.md](./AGENTS.md) | Roles and collaboration rules |
| [FOLDERS.md](./FOLDERS.md) | Proposed `src/` layout |

## Repo

- GitHub: https://github.com/Dodojo94/arcade-golf
- Branch for greenfield seed: `main`
