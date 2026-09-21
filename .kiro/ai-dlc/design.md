# Mini Cyber Heist — Design

**AI-DLC Artifact: Design**
**Version:** 1.0
**Date:** 2026-09-20
**Status:** Draft
**Sources:** `intent.md`, `requirements.md`

---

## 1. Architecture Overview

The game is a single-page vanilla JavaScript application. All modules are ES modules loaded via `<script type="module">` in `index.html`. There is no build step.

```
index.html          — shell, canvas, HUD/menu DOM elements
style.css           — cyberpunk theme, menus, overlays, HUD
js/
  constants.js      — all numeric/string constants and palette
  storage.js        — localStorage abstraction with try/catch guard
  levels.js         — level data definitions (maps, entities)
  player.js         — player state and movement
  security.js       — cameras, guards, vision-cone math, patrol FSM
  hacking.js        — hacking state machine and progress tracking
  ui.js             — all screen renderers (DOM overlays + canvas UI)
  game.js           — game state machine, game loop, all system wiring
  main.js           — entry point: bootstrap and event listener setup
```

No class-based inheritance chains. Each module exports a small set of plain objects/functions. State is held in module-level variables and passed by reference where needed.

---

## 2. Game Loop and Timing

`game.js` owns the main loop:

```js
let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // seconds, capped at 50ms
  lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
```

`dt` is capped at 50 ms to prevent large jumps on tab re-focus. All movement, detection rates, and timer increments are multiplied by `dt` to be frame-rate independent.

The loop runs continuously. When the game is in a non-gameplay state (menu, pause, game over, victory), `update()` is a no-op and `render()` draws the appropriate overlay.

---

## 3. Game States

A single `gameState` string drives all branching in `update()` and `render()`:

| State string | Description |
|---|---|
| `'MENU'` | Main menu |
| `'LEVEL_SELECT'` | Level selection screen |
| `'INSTRUCTIONS'` | How to Play overlay |
| `'HIGH_SCORES'` | High scores overlay |
| `'PLAYING'` | Active gameplay |
| `'PAUSED'` | Pause overlay |
| `'GAME_OVER'` | Game over screen |
| `'VICTORY'` | Victory screen |

State transitions are triggered by user input (button clicks, `Escape`/`P`) or game events (alert → 100%, guard contact, extraction zone entry).

---

## 4. Player System (`player.js`)

```js
export const player = {
  x, y,           // position (centre of sprite)
  width: 16,      // hitbox width
  height: 16,     // hitbox height
  speed: 120,     // px/s (REQ-04)
  vx: 0, vy: 0    // current frame velocity
};
```

### Movement (`player.js` → `update(dt)`)

Each frame:
1. Read held keys from a `keys` Set maintained by `main.js` keydown/keyup listeners.
2. Build a raw velocity vector from WASD / arrow keys.
3. Normalise if diagonal (divide by √2).
4. Multiply by `speed × dt`.
5. Apply collision resolution before committing position (see §5).

---

## 5. Collision System (`game.js` with helpers from `levels.js`)

Level maps are stored as a 2D array of tile IDs. Tile size: **32 px**. Solid tiles (walls, obstacles) block movement.

### Resolution (axis-separated AABB)

1. Move player on X axis. If new bounding box overlaps any solid tile → revert X.
2. Move player on Y axis. If new bounding box overlaps any solid tile → revert Y.

This gives wall-slide behaviour automatically (REQ-05).

Helper: `getSolidTilesInRect(x, y, w, h, levelData)` returns all solid tiles overlapping a rectangle.

---

## 6. Camera Detection System (`security.js`)

Each camera:
```js
{
  x, y,             // fixed position
  angle,            // current facing angle (radians)
  rotSpeed,         // radians/s (positive = CW, negative = CCW)
  arcMin, arcMax,   // oscillation bounds (null = full 360°)
  range,            // cone length (px)
  fov,              // cone half-angle (radians)
  hacked,           // bool
  hackTimer,        // seconds remaining on hack disable
  color             // 'red' | 'cyan' (derived from hacked state)
}
```

### Vision Cone Geometry

A point P is inside a camera's cone if:
1. Distance from camera to P ≤ `range`.
2. Angle between `camera.angle` and direction to P ≤ `fov` (half-angle check).

Player detection: check all four corners + centre of player hitbox against every active (non-hacked) camera cone each frame.

### Camera Update

Each frame: advance `angle` by `rotSpeed × dt`. If oscillating, reverse `rotSpeed` when `angle` reaches `arcMin` or `arcMax`. Count down `hackTimer`; when it reaches 0, re-activate camera.

---

## 7. Guard Patrol / Detection System (`security.js`)

Each guard:
```js
{
  x, y,
  width: 16, height: 16,
  speed: 80,          // patrol px/s
  pursuitSpeed: 140,  // px/s
  waypoints: [{x,y}],
  waypointIndex: 0,
  pauseTimer: 0,      // countdown for 0.5s pause at waypoints
  mode: 'patrol',     // 'patrol' | 'pursue'
  lostTimer: 0,       // countdown for 5s return-to-patrol
  angle: 0,           // facing direction (for vision cone)
  fov: Math.PI/3,     // 60° half-angle = 30° each side
  range: 100
}
```

### Patrol FSM

```
[patrol] → move toward waypoints[waypointIndex]
         → on arrival: pauseTimer = 0.5, advance index
         → while pauseTimer > 0: decrement, stay still
         → if alert >= 60 AND detecting player → switch to [pursue]

[pursue] → move toward player.x, player.y at pursuitSpeed
         → update angle to face player
         → if NOT detecting player: lostTimer counts down
         → lostTimer reaches 0 → switch to [patrol], resume nearest waypoint

contact check: if guard AABB overlaps player AABB → Game Over
```

---

## 8. Alert System (`game.js`)

```js
let alertLevel = 0;       // 0–100
let peakAlert  = 0;       // highest value reached this level
```

Per frame:
```
detecting = any camera or guard cone overlaps player
if detecting:
  rate = sum of camera rates (15/s each) + sum of guard rates (30/s each)
  alertLevel += rate * dt
else:
  alertLevel -= 5 * dt
alertLevel = clamp(alertLevel, 0, 100)
peakAlert  = max(peakAlert, alertLevel)
if alertLevel >= 100 → triggerGameOver()
```

Alert state thresholds (REQ-13):

```js
function getAlertState(a) {
  if (a < 40)  return 'CLEAR';
  if (a < 60)  return 'CAUTION';
  if (a < 100) return 'ALERT';
  return 'LOCKDOWN';
}
```

---

## 9. Hacking System (`hacking.js`)

```js
export const hackState = {
  active: false,
  target: null,      // camera or door terminal object
  progress: 0,       // 0–1
  duration: 1.5      // seconds (REQ-08)
};
```

### Update logic (called from `game.js`)

```
if E key held AND not already hacking:
  find nearest hackable target within 48px of player centre
  if found: hackState.active = true, hackState.target = target

if hackState.active:
  if E key released: reset hackState
  else:
    hackState.progress += dt / hackState.duration
    if progress >= 1:
      applyHack(target)
      reset hackState
```

### `applyHack(target)`

- Camera: set `camera.hacked = true`, `camera.hackTimer = 8`.
- Door terminal: set `door.open = true` permanently.

---

## 10. Data Node System (`game.js`)

Each level defines an array of data node positions. Nodes are stored in `levelState.nodes[]`, each with `{x, y, collected: false}`.

Each frame: check if player AABB overlaps any uncollected node (node treated as 16×16 centred at its position). On overlap: `node.collected = true`, increment `collectedCount`.

When `collectedCount >= requiredNodes`: activate extraction zone (`levelState.extractionActive = true`).

---

## 11. Door System (`levels.js` + `game.js`)

Doors are solid tiles by default. Each door has an associated terminal at a nearby position. When the terminal is successfully hacked (`door.open = true`), the door tile is removed from the solid-tile set so the player can pass through.

Locked doors are drawn as distinct tiles (dark red/orange). Open doors are drawn as floor tiles or a passage.

---

## 12. Extraction System (`game.js`)

Each level defines one extraction zone: `{x, y, width, height}`.

- Inactive: rendered as a dimmed rectangle with a "LOCKED" label.
- Active: rendered as a pulsing green rectangle with an "EXTRACT" label.

Each frame (when active): if player AABB overlaps extraction zone → `triggerVictory()`.

---

## 13. Three-Level Structure (`levels.js`)

Levels are defined as plain JS objects and exported as an array `LEVELS[0..2]`.

Each level object:
```js
{
  name: 'Entry Point',
  mapWidth, mapHeight,   // in tiles
  tiles: [...],          // flat 2D array, 0=floor, 1=wall, 2=locked-door
  playerStart: {x, y},
  cameras: [...],
  guards: [...],
  nodes: [...],          // data nodes
  doors: [...],          // locked doors with terminal positions
  extraction: {x, y, width, height},
  requiredNodes: N,
  totalNodes: N,
  timeLimitHint: N       // for score time bonus reference
}
```

Level difficulty escalation per REQ-19.

---

## 14. Score / Rank System (`game.js`)

### Score formula (REQ-21)

```js
function calcScore(levelNum, nodesCollected, totalNodes, peakAlert, elapsed) {
  const base      = 1000 * levelNum;
  const dataBonus = Math.floor((nodesCollected / totalNodes) * 500);
  const alertPen  = Math.floor((peakAlert / 100) * 400);
  const timeBonus = Math.max(0, 300 - Math.floor(elapsed));
  const raw       = base + dataBonus - alertPen + timeBonus;
  return Math.max(0, raw) * levelNum;
}
```

### Rank table (REQ-22)

```js
const MAX_SCORES = [3600, 7200, 10800]; // per level (L1, L2, L3) — precomputed for best run
function calcRank(score, levelIndex) {
  const pct = score / MAX_SCORES[levelIndex];
  if (pct >= 0.90) return 'S';
  if (pct >= 0.75) return 'A';
  if (pct >= 0.55) return 'B';
  if (pct >= 0.35) return 'C';
  return 'D';
}
```

---

## 15. Rendering Strategy (`game.js` + `ui.js`)

All gameplay is drawn on a single `<canvas>` (960×640, REQ-30) each frame:

1. **Clear** canvas with dark background.
2. **Tiles** — draw floor and wall tiles from level map.
3. **Doors** — draw locked (red) or open (transparent) tiles.
4. **Extraction zone** — pulsing glow if active.
5. **Data nodes** — glowing cyan hexagon sprites.
6. **Camera vision cones** — semi-transparent filled arc (red=active, cyan=hacked).
7. **Cameras** — small rectangle + direction indicator.
8. **Guards** — coloured rectangle + facing direction arrow.
9. **Player** — distinct colour rectangle with a direction indicator.
10. **Hacking progress bar** — rendered near target if active.
11. **HUD** — drawn as DOM elements overlaid over canvas (REQ-26).

All menu/overlay screens (`MENU`, `PAUSED`, `GAME_OVER`, `VICTORY`, etc.) are rendered as HTML/CSS `<div>` overlays shown/hidden via CSS classes, not drawn on canvas.

---

## 16. HUD / UI Architecture (`ui.js`)

HUD is a fixed-position HTML element above the canvas, updated each frame by `ui.updateHUD(state)`. It contains:
- Alert bar (`<div>` with dynamic width and colour class).
- Alert state label.
- Data counter.
- Timer.
- Level name.

Menus/overlays are pre-rendered in HTML, toggled with `display: none / block` or a CSS class. `ui.js` exports `show(screenId)` / `hide(screenId)` helpers and functions to populate dynamic content (scores, rank, etc.).

Button click handlers are registered once in `main.js` at startup.

---

## 17. localStorage Persistence (`storage.js`)

```js
const PREFIX = 'mch_';

export function saveScore(levelIndex, score) { /* try/catch */ }
export function loadScore(levelIndex) { /* returns 0 on failure */ }
export function saveLevelUnlock(levelIndex) { /* try/catch */ }
export function isLevelUnlocked(levelIndex) { /* returns bool */ }
export function saveMute(muted) { /* try/catch */ }
export function loadMute() { /* returns false on failure */ }
```

All functions are wrapped in `try/catch`. On `localStorage` unavailability, functions silently return defaults (REQ-28).

Key names: `mch_score_0`, `mch_score_1`, `mch_score_2`, `mch_unlock_1`, `mch_unlock_2`, `mch_mute`.

---

## 18. Audio Approach (`game.js`)

Web Audio API — generated tones only, no audio files (REQ-29).

```js
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx && window.AudioContext) audioCtx = new AudioContext();
  return audioCtx;
}
function playTone(freq, duration, type = 'sine') { ... }
```

Events and tones:
| Event | Frequency | Type |
|---|---|---|
| Detection start | 440 Hz, 0.2s | square |
| Hack complete | 880 Hz, 0.3s | sine |
| Data collected | 660 Hz, 0.15s | sine |
| Alert state change | 330 Hz, 0.4s | sawtooth |
| Game over | 220 Hz, 0.8s | sawtooth |

All calls wrapped in try/catch. If `AudioContext` is undefined, tones are silently skipped.

---

## 19. File / Module Responsibilities

| File | Owns | Imports |
|---|---|---|
| `index.html` | DOM structure, canvas, overlay divs | — |
| `style.css` | All visual styles | — |
| `constants.js` | Numbers, colours, strings | nothing |
| `storage.js` | localStorage | `constants.js` |
| `levels.js` | Level data arrays | `constants.js` |
| `player.js` | Player object, key state, movement calc | `constants.js` |
| `security.js` | Cameras, guards, vision math | `constants.js` |
| `hacking.js` | Hack state machine | `constants.js` |
| `ui.js` | Show/hide overlays, populate content | `constants.js`, `storage.js` |
| `game.js` | Game state machine, loop, all wiring | all above modules |
| `main.js` | Bootstrap, canvas ref, event listeners | `game.js`, `ui.js`, `player.js` |

Circular imports are avoided: `game.js` imports all sub-modules but none of them import `game.js`.

---

## 20. Requirement-to-Design Traceability

| REQ | Design section |
|---|---|
| REQ-01 Main menu | §3 (MENU state), §16 |
| REQ-02 Level select | §3 (LEVEL_SELECT), §16 |
| REQ-03 Game start | §3, §13 |
| REQ-04 Player movement | §4 |
| REQ-05 Wall collision | §5 |
| REQ-06 Security cameras | §6 |
| REQ-07 Camera detection | §6 |
| REQ-08 Camera hacking | §9 |
| REQ-09 Guard patrol | §7 |
| REQ-10 Guard detection | §7 |
| REQ-11 Guard pursuit | §7 |
| REQ-12 Alert meter | §8 |
| REQ-13 Alert states | §8 |
| REQ-14 Data nodes | §10 |
| REQ-15 Hacking terminals (doors) | §9, §11 |
| REQ-16 Hacking feedback | §9, §15 |
| REQ-17 Extraction zone | §12 |
| REQ-18 Level completion | §12, §14 |
| REQ-19 Three levels | §13 |
| REQ-20 Level timer | §8 (levelTime var in game.js) |
| REQ-21 Score calculation | §14 |
| REQ-22 Rank calculation | §14 |
| REQ-23 Game over | §3, §16 |
| REQ-24 Victory state | §3, §16 |
| REQ-25 Pause/restart | §3 |
| REQ-26 HUD | §16 |
| REQ-27 Instructions | §3, §16 |
| REQ-28 High score persistence | §17 |
| REQ-29 Mute/audio | §18 |
| REQ-30 Canvas rendering | §15 |
| REQ-31 Responsive layout | §15 (CSS max-width) |
| REQ-32 Keyboard controls | §4, §25 |
| REQ-33 No dependencies | §1 |
| REQ-34 Error-free startup | §17, §18 (try/catch) |
| REQ-35 Cyberpunk theme | §15, §16 |

---

*End of Design artifact. Next artifact: Tasks.*
