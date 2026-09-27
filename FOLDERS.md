# FOLDERS — proposed `src/` layout

Seed keeps a flat `src/main.ts` for the first runnable scene. Grow toward this layout as systems land.

```
src/
  main.ts                 # entry: bootstrap renderer, scene, HUD mount
  style.css               # global + HUD chrome
  vite-env.d.ts

  core/
    Game.ts               # high-level loop / hole state machine
    Input.ts              # click / pointer for 3-click swing
    Time.ts               # clock helpers

  render/
    createRenderer.ts
    createScene.ts
    camera/
      ChaseCamera.ts      # fixed chase stub → tunable chase / orbit later
    materials/
      fairway.ts

  physics/
    world.ts              # cannon-es world; stepped from the animate loop
    ballBody.ts           # ball rigid body + sync to Three mesh

  gameplay/
    swing/
      SwingMeter.ts       # 3-click power / accuracy
    clubs/
      Club.ts             # driver | iron | wedge | putter
    wind/
      Wind.ts
    lie/
      LieModifier.ts
    putting/
      Putting.ts
    scoring/
      Scorecard.ts

  course/
    Hole.ts               # tee, green, pin, par, yardage
    holes/
      hole1.ts
      hole2.ts
      hole3.ts
    hazards/              # bunkers, water stubs later

  ui/
    hud/
      HudRoot.ts          # title, hole, strokes
      SwingMeterView.ts
      ScorecardView.ts

  assets/                 # optional later (models, textures)
```

## Seed mapping (today)

| Now | Later |
|-----|--------|
| `src/main.ts` scene + ball + light + chase stub | `render/` + `physics/` + `gameplay/` |
| `#hud` in `main.ts` / `style.css` | `ui/hud/` |
| Single fairway plane | `course/holes/hole1.ts` blockout. Holes 2–3 TODO |

Keep modules boring and importable; avoid premature abstraction until the swing loop exists.
