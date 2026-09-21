# Mini Cyber Heist

A browser-based cyberpunk stealth game. Infiltrate a futuristic digital facility, steal encrypted data, hack security systems, and escape before the alarms lock you down.

---

## Features

- 3 hand-crafted levels with escalating difficulty
- Security cameras with rotating vision cones
- Guard AI with patrol routes and player pursuit
- Hacking mechanic — hold `E` to disable cameras or unlock doors
- Alert meter (0–100%) with four escalating states
- Data node collection objective
- Locked doors requiring terminal hacks to open
- Score and rank system (S / A / B / C / D)
- High score persistence via localStorage
- Victory and Game Over screens
- Pause / resume support
- Optional Web Audio API sound effects
- Full cyberpunk visual theme — dark environment, neon accents

---

## Gameplay

You are an operative infiltrating a corporate facility to steal encrypted data. Each level requires you to:

1. Navigate the facility while avoiding camera vision cones and guard patrol routes
2. Hack cameras to disable them temporarily (8 seconds)
3. Hack terminals to unlock locked doors
4. Collect all required data nodes
5. Reach the **EXTRACTION ZONE** once enough data is collected

If the alert meter reaches 100%, the facility goes into **LOCKDOWN** — mission failed. If a guard catches you, it's also over.

---

## Controls

| Action | Key |
|---|---|
| Move | `W A S D` or Arrow Keys |
| Hack (hold) | `E` — hold for 1.5 seconds near a target |
| Pause / Resume | `Escape` or `P` |

Mouse is used only for menu buttons. No touch/mobile support.

---

## Levels

| Level | Name | Description |
|---|---|---|
| 1 | Entry Point | Simple server room. Learn movement, hacking, and data collection. No guards. |
| 2 | Security Wing | Multiple rooms with guards and locked doors. Introduces alert escalation. |
| 3 | Core Vault | Dense layout with overlapping patrol zones and 3 locked doors. All mechanics combined. |

Level 2 unlocks after completing Level 1. Level 3 unlocks after completing Level 2.

---

## Alert System

| State | Alert % | Effect |
|---|---|---|
| CLEAR | 0–39% | Normal — alert falls at 5%/s when undetected |
| CAUTION | 40–59% | Partial detection — stay hidden |
| ALERT | 60–99% | Guards pursue when they see you |
| LOCKDOWN | 100% | Mission failed |

- Camera detection: **+15% per second**
- Guard detection: **+30% per second**
- Recovery (undetected): **−5% per second**

Hack cameras to remove their detection contribution for 8 seconds.

---

## Scoring

Score is calculated on level completion:

```
base      = 1000 × level number
dataBonus = (nodes collected / total nodes) × 500
alertPen  = (peak alert %) × 4
timeBonus = max(0, 300 − elapsed seconds)
score     = (base + dataBonus − alertPen + timeBonus) × level number
```

Ranks: **S** (≥90%) · **A** (75–89%) · **B** (55–74%) · **C** (35–54%) · **D** (<35%)

High scores are saved per level in `localStorage`.

---

## Technology

- Vanilla JavaScript (ES Modules) — no framework, no bundler
- HTML5 Canvas — all gameplay rendering
- HTML + CSS — menus, HUD, overlays
- `localStorage` — score and unlock persistence
- Web Audio API — procedural sound effects (optional; game runs silently if unavailable)
- Zero external dependencies

---

## Project Structure

```
Mini-Cyber-Heist/
├── index.html          Shell, canvas, all overlay divs
├── style.css           Cyberpunk theme, screens, HUD
├── README.md
│
├── js/
│   ├── main.js         Entry point, event listeners, button wiring
│   ├── constants.js    All numeric/colour constants
│   ├── game.js         Game state machine, loop, rendering, alert, score
│   ├── player.js       Player movement and collision
│   ├── security.js     Cameras, guards, vision cones, patrol AI
│   ├── hacking.js      Hacking state machine and progress
│   ├── levels.js       Level data (tile maps, entities, objectives)
│   ├── storage.js      localStorage abstraction
│   └── ui.js           Screen/HUD management
│
└── .kiro/
    └── ai-dlc/
        ├── intent.md
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

---

## How to Run

**Option A — Direct file open (most browsers):**
```
Open index.html in Chrome, Firefox, or Edge
```
> Note: Some browsers block ES modules on the `file://` protocol. If the game doesn't load, use Option B.

**Option B — Local HTTP server (recommended):**

Using Python:
```bash
python -m http.server 8080
# then open http://localhost:8080
```

Using Node.js (`npx serve`):
```bash
npx serve .
```

Using VS Code: install the **Live Server** extension, right-click `index.html` → Open with Live Server.

---

## Known Limitations

- No mobile or touch controls (keyboard only)
- No line-of-sight occlusion — vision cones penetrate walls (cone overlap detection only)
- No procedurally generated levels — 3 hand-crafted maps only
- Web Audio may require a user gesture (click/keypress) before audio context initialises in some browsers
- No background music — sound effects only

---

## Future Improvements

- Wall-occluded vision cones (ray casting)
- More levels or procedural generation
- Player animation frames
- Background ambient music
- Mobile/touch control support
- Global leaderboard (would require a backend)
- Guard takedown mechanic
