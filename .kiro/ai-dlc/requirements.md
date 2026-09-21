# Mini Cyber Heist — Requirements

**AI-DLC Artifact: Requirements**
**Version:** 1.0
**Date:** 2026-09-20
**Status:** Draft
**Source of truth:** `.kiro/ai-dlc/intent.md`

---

## Open Questions Resolved

The following decisions from Intent §13 are resolved here and become binding for design and implementation:

| # | Question | Decision |
|---|---|---|
| 1 | Grid vs. free movement | **Free pixel movement.** The player moves smoothly at a fixed pixel-per-second speed. No tile snapping. |
| 2 | Instant hack vs. progress bar | **Progress bar.** Holding `E` near a hackable device fills a 1.5-second progress bar. Releasing early cancels the hack. |
| 3 | Limited vs. unlimited hack charges | **Unlimited.** No charge limit. Hacking is gated by proximity and time, not a resource pool. |
| 4 | Guard re-patrol after losing player | **Guards return to patrol after 5 seconds of not detecting the player.** Alert meter continues to fall after guards resume patrol. |
| 5 | Visual language for hacked cameras | **Hacked cameras render in cyan/blue tint; active cameras render in red/orange. The vision cone color matches the camera state.** |
| 6 | Takedown mechanic | **No takedown.** Pure avoidance only. The player cannot neutralise guards. |

---

## Requirements

### REQ-01 — Main Menu Screen

The game must display a main menu when `index.html` is opened in a browser. The menu must contain:
- A game title ("Mini Cyber Heist").
- A "Play" button that navigates to the level-select screen.
- A "How to Play" button that opens the instructions overlay.
- A "High Scores" button that opens the high-score overlay.
- A mute/unmute toggle button.

**Acceptance criteria:** All five elements are visible without scrolling at 1280×720. Clicking each button produces the described navigation or overlay. The mute button's visual state reflects the current audio preference.

---

### REQ-02 — Level Select Screen

The level-select screen must display exactly 3 level entries. Each entry shows the level name, a lock icon if locked, and the player's stored high score for that level (or "—" if never completed).

- Level 1 is always unlocked.
- Level 2 is unlocked only after Level 1 has been completed at least once.
- Level 3 is unlocked only after Level 2 has been completed at least once.
- Clicking a locked level entry does nothing.
- Clicking an unlocked level entry starts that level.

**Acceptance criteria:** On a fresh session (no localStorage), only Level 1 is clickable. After completing Level 1, Level 2 becomes clickable without refreshing the page.

---

### REQ-03 — Game Start

When the player selects a level, the game must:
1. Load the corresponding level layout.
2. Reset the alert meter to 0%.
3. Reset the level timer to 0.
4. Place the player at the level's defined spawn position.
5. Display the HUD.
6. Begin the game loop.

**Acceptance criteria:** All five states are in their initial values within one animation frame of level start. No data from a previous run persists into a new run.

---

### REQ-04 — Player Movement

The player character must move in four directions (up, down, left, right) using both WASD and arrow keys. Movement is continuous (held key = continuous motion) at a fixed speed of **120 pixels per second**. Diagonal movement (two keys held) is permitted but must not exceed the single-direction speed (i.e., velocity is normalised).

**Acceptance criteria:** Holding a single direction key moves the player at exactly 120 px/s. Holding two perpendicular keys moves the player at 120 px/s in the diagonal direction, not 170 px/s.

---

### REQ-05 — Wall and Obstacle Collision

The player must not be able to move through wall tiles or solid obstacle tiles. On collision, the player's movement in the blocked axis is stopped; sliding along a wall in the non-blocked axis is permitted.

**Acceptance criteria:** The player cannot reach any coordinate outside the walkable area of the level map. When moving diagonally into a corner, the player slides along the non-blocked wall rather than stopping completely.

---

### REQ-06 — Security Cameras

Each level must contain at least one security camera entity. Each camera has:
- A fixed position.
- A rotation speed (degrees per second), which may be oscillating (back-and-forth arc) or full 360°.
- A vision cone defined by an angle (width) and a range (length in pixels).

Cameras must be rendered on the canvas with a distinct sprite or shape. The vision cone must be rendered as a filled, semi-transparent triangle or sector in front of the camera.

**Acceptance criteria:** The cone rotates at the defined speed. The cone's geometry accurately matches the camera's angle and range parameters. The cone is visible to the player at all times.

---

### REQ-07 — Camera Detection

If any portion of the player's hitbox overlaps the active vision cone of a camera, the camera is detecting the player. Detection must be checked every game frame. While the player is inside an active cone, the alert meter rises (see REQ-10).

**Acceptance criteria:** Alert meter rises while the player stands inside a cone. Alert meter does not rise when the player stands outside all cones. Detection is not blocked by the player being behind a wall from the camera's perspective only if line-of-sight checking is implemented; otherwise, cone overlap alone is sufficient (line-of-sight is a stretch goal, not a requirement).

---

### REQ-08 — Camera Hacking

The player can hack a camera by standing within **48 pixels** of it and holding `E` for **1.5 seconds** without releasing. A visible progress bar must appear on-screen during the hold. Releasing `E` before 1.5 seconds resets the progress bar to zero.

On successful hack:
- The camera is disabled for **8 seconds**.
- Its vision cone disappears.
- The camera sprite changes to a cyan/blue tint.
- The alert meter does not rise from that camera while it is disabled.

After 8 seconds the camera automatically reactivates and returns to its original rotation.

**Acceptance criteria:** Progress bar appears when `E` is held within range. Releasing early resets it. Camera vision cone is absent for exactly 8 seconds after a successful hack. Camera resumes rotation after 8 seconds.

---

### REQ-09 — Guard Patrol

Each guard follows a fixed, pre-defined patrol path composed of waypoints. Guards move at **80 pixels per second** between waypoints. On reaching a waypoint the guard pauses for **0.5 seconds** then moves toward the next waypoint, looping indefinitely.

Guards are not present in Level 1. Level 2 must contain at least 2 guards. Level 3 must contain at least 4 guards.

**Acceptance criteria:** Guards traverse their waypoint list in order and loop. Guards pause 0.5 s at each waypoint. Guard count meets the minimums per level.

---

### REQ-10 — Guard Detection

Each guard has a forward-facing vision cone: **60° wide**, **100 pixels** long. If the player's hitbox overlaps a guard's vision cone, the guard detects the player. While a guard detects the player, the alert meter rises at **double the rate** of a camera detection.

Detected guards do not pursue immediately; pursuit begins when the alert meter crosses the pursuit threshold (see REQ-12).

**Acceptance criteria:** Alert rises at double rate during guard cone overlap vs. camera cone overlap. Vision cone rotates with the guard's movement direction.

---

### REQ-11 — Guard Pursuit

When the alert meter is at or above **60%**, all guards that are currently detecting the player switch from patrol to pursuit mode. In pursuit mode guards move toward the player's current position at **140 pixels per second**.

If a guard in pursuit mode does not detect the player for **5 continuous seconds**, the guard returns to its patrol path at patrol speed, resuming from the nearest waypoint.

If a guard's position overlaps the player's hitbox (contact), the game immediately transitions to the Game Over state.

**Acceptance criteria:** Guards switch to pursuit at 60% alert. Guards return to patrol after 5 s without detection. Player-guard contact triggers Game Over.

---

### REQ-12 — Alert Meter

The alert meter is a value between **0 and 100** (inclusive), displayed as a percentage on the HUD.

- **Rise rate (camera):** +15 per second while inside a camera cone.
- **Rise rate (guard cone):** +30 per second while inside a guard's vision cone.
- **Fall rate:** −5 per second when no detection source is active.
- The meter never falls below 0 or rises above 100.
- The meter resets to 0 at the start of each level.

**Acceptance criteria:** Starting a level shows 0%. Standing in a camera cone for 1 second increases the value by 15 (±1 for frame timing). Alert falls at 5/s when undetected. Values are clamped to [0, 100].

---

### REQ-13 — Alert States

The alert meter defines three visible states communicated through HUD colour and on-screen label:

| State | Threshold | HUD colour | Label |
|---|---|---|---|
| Clear | 0–39% | Green | CLEAR |
| Caution | 40–59% | Yellow | CAUTION |
| Alert | 60–99% | Orange | ALERT |
| Lockdown | 100% | Red (flashing) | LOCKDOWN |

Entering **Lockdown** (100%) immediately triggers the Game Over state.

**Acceptance criteria:** HUD colour and label change at exactly the defined thresholds. Reaching 100% transitions to Game Over within one frame.

---

### REQ-14 — Data Nodes

Each level contains a set of collectible data nodes placed at fixed positions. The number of required data nodes per level is:

| Level | Total nodes | Required to unlock extraction |
|---|---|---|
| 1 | 3 | 3 |
| 2 | 5 | 4 |
| 3 | 7 | 6 |

A data node is collected when the player's hitbox overlaps the node's position. Collected nodes are removed from the canvas immediately. The HUD must display "X / Y data collected".

**Acceptance criteria:** Nodes disappear on player contact. HUD counter increments. Collecting the required number unlocks the extraction zone (see REQ-17).

---

### REQ-15 — Hacking Terminals (Doors)

Certain doors in Levels 2 and 3 are locked by default and must be hacked open. A locked door blocks player movement. The player hacks a terminal adjacent to the door by standing within **48 pixels** of the terminal and holding `E` for **1.5 seconds** (same mechanic as REQ-08). On success, the door opens permanently for the remainder of the level. A hacked-open door cannot be re-locked and does not close.

**Acceptance criteria:** Player cannot pass through a locked door. After a successful terminal hack the door opens and remains open. Re-attempting to hack an already-open terminal does nothing.

---

### REQ-16 — Hacking Feedback

During any hacking action (`E` held in range), a progress bar is rendered on the canvas above or near the target device. The bar fills from 0% to 100% over 1.5 seconds. If the hold is released early, the bar resets to 0% with no other effect. On completion, the bar disappears and the hack effect applies.

**Acceptance criteria:** Progress bar is visible and animates during the hold. Releasing early visually resets it to empty. No partial effects are applied on cancel.

---

### REQ-17 — Extraction Zone

Each level has exactly one extraction zone. The extraction zone is **inactive** (visually dimmed or locked) until the player has collected the required number of data nodes (REQ-14). Once active, it is rendered with a distinct colour (e.g., bright green pulse). When the player's hitbox overlaps an active extraction zone, the level ends with a victory (see REQ-20).

**Acceptance criteria:** Extraction zone is visually distinct in both inactive and active states. Entering the inactive zone does not trigger victory. Entering the active zone immediately triggers the victory sequence.

---

### REQ-18 — Level Completion Conditions

A level is considered complete when the player reaches an active extraction zone (REQ-17). On completion:
1. The game loop pauses.
2. The final score is calculated (REQ-21).
3. If the score exceeds the stored high score for that level, the new score is saved to localStorage.
4. Level progression is updated in localStorage (next level unlocked if applicable).
5. The Victory screen is displayed (REQ-20).

**Acceptance criteria:** Score is saved only on completion, not on Game Over. The next level becomes selectable from the menu after completion. Victory screen displays within one frame of extraction zone entry.

---

### REQ-19 — Three Levels with Escalating Difficulty

Exactly 3 levels must be implemented, each with a unique hand-crafted layout. Difficulty escalates as follows:

| Level | Cameras | Guards | Locked doors | Required data | Map complexity |
|---|---|---|---|---|---|
| 1 — Entry Point | 2–3 | 0 | 0 | 3 of 3 | Simple, few corridors |
| 2 — Security Wing | 4–5 | 2 | 1–2 | 4 of 5 | Medium; multiple rooms |
| 3 — Core Vault | 6–8 | 4+ | 2–3 | 6 of 7 | Dense; overlapping patrol zones |

No level may reuse the same layout as another.

**Acceptance criteria:** Each level loads a distinct map. Entity counts are within the defined ranges. Each level is completable without requiring more entities than the maximums listed.

---

### REQ-20 — Level Timer

A timer starts counting up (in seconds) from 0 when the level begins and stops when the level ends (victory or game over). The elapsed time is displayed on the HUD in `MM:SS` format.

**Acceptance criteria:** Timer starts at 00:00 on level start. Timer stops on Game Over or Victory. Displayed value matches wall-clock elapsed time within ±0.1 seconds.

---

### REQ-21 — Score Calculation

Score is calculated at level completion using the following formula:

```
baseScore    = 1000 × levelNumber
dataBonus    = (nodesCollected / totalNodes) × 500
alertPenalty = (peakAlertPercent / 100) × 400
timeBonus    = max(0, 300 − elapsedSeconds)
finalScore   = (baseScore + dataBonus − alertPenalty + timeBonus) × levelNumber
```

All intermediate values are floored to integers. `peakAlertPercent` is the highest alert value reached during the level (not the value at exit). `finalScore` has a minimum value of 0.

**Acceptance criteria:** Given known inputs (e.g., Level 1, 3/3 nodes, 0% peak alert, 120 s elapsed), the output score matches manual calculation. Score displayed on Victory screen equals the stored value.

---

### REQ-22 — Rank Calculation

At level completion, a single-letter rank is assigned based on `finalScore` relative to the level's maximum achievable score:

| Rank | Threshold |
|---|---|
| S | ≥ 90% of max score |
| A | 75–89% |
| B | 55–74% |
| C | 35–54% |
| D | < 35% |

The rank is displayed on the Victory screen.

**Acceptance criteria:** Given a score at each boundary, the correct rank letter is assigned. Maximum achievable score per level is a fixed, known constant used for the calculation.

---

### REQ-23 — Game Over State

The Game Over state is triggered by either:
- The alert meter reaching 100% (lockdown), or
- A guard making physical contact with the player.

On Game Over the game loop pauses and a Game Over screen is displayed containing:
- "GAME OVER" heading.
- The level name.
- The elapsed time at the moment of failure.
- The alert level at the moment of failure.
- A "Retry" button (restarts the current level from scratch).
- A "Main Menu" button.

No score is saved on Game Over.

**Acceptance criteria:** Both triggers produce the Game Over screen. Retry resets all level state. Main Menu returns to the main menu. No score is written to localStorage.

---

### REQ-24 — Victory State

The Victory screen is displayed on level completion and contains:
- "MISSION COMPLETE" heading.
- The level name.
- Final score (integer).
- Rank letter (REQ-22).
- Elapsed time in `MM:SS`.
- Whether a new high score was set ("NEW BEST!" label if applicable).
- A "Next Level" button (visible and enabled only if a next level exists and is now unlocked).
- A "Retry" button (replays same level).
- A "Main Menu" button.

**Acceptance criteria:** All listed elements are present. "NEW BEST!" appears only when the score exceeds the previously stored high score. "Next Level" is absent on Level 3.

---

### REQ-25 — Pause and Restart

While a level is active, pressing `Escape` or `P` pauses the game. While paused:
- The game loop halts (timer stops, entities freeze).
- A pause overlay is displayed over the canvas with "PAUSED" text, a "Resume" button, a "Restart" button, and a "Main Menu" button.

Pressing `Escape` or `P` again, or clicking "Resume", resumes the game. "Restart" resets the level from scratch. "Main Menu" exits to the main menu without saving a score.

**Acceptance criteria:** Timer stops incrementing while paused. Entities do not move while paused. Resume restores the exact game state at the moment of pause.

---

### REQ-26 — HUD Layout

During gameplay, the HUD must be rendered on or adjacent to the canvas and display all of the following simultaneously:
- Alert meter (numeric percentage + colour-coded bar).
- Alert state label (CLEAR / CAUTION / ALERT / LOCKDOWN).
- Data nodes collected counter (X / Y format).
- Level timer (MM:SS).
- Current level name.

The HUD must not obscure the playable area of the canvas.

**Acceptance criteria:** All five elements are visible during gameplay. HUD elements update in real time each frame. The playable canvas area is not covered by HUD elements.

---

### REQ-27 — Instructions Screen

A "How to Play" overlay must be accessible from the main menu. It must display:
- Movement controls (WASD / arrow keys).
- Hacking control (hold `E` near device).
- Pause control (`Escape` / `P`).
- A description of the alert meter and its states.
- A description of the objective (collect data, reach extraction zone).
- A "Close" button that returns to the main menu.

**Acceptance criteria:** All listed information is present. The overlay can be closed and re-opened without reloading the page.

---

### REQ-28 — High Score Persistence

High scores and level unlock state must be stored in `localStorage` under a consistent key namespace (e.g., `mch_level1_score`, `mch_level2_unlocked`). Data is written on level completion and read on game start.

If `localStorage` is unavailable or throws an exception (e.g., private browsing with storage blocked), the game must catch the exception silently and continue operating without persistence. No error must be shown to the player.

**Acceptance criteria:** Completing a level and refreshing the page shows the saved score on the level-select screen. Disabling `localStorage` (via browser settings or by mocking a throwing implementation) does not crash the game or display an error.

---

### REQ-29 — Mute and Audio Preference

The game must include audio feedback using the Web Audio API for the following events: camera detection start, hack complete, data node collected, alert state change, and game over. No external audio files are required; all audio must be generated via Web Audio API oscillators/buffers.

A mute toggle must be accessible from the main menu and the pause screen. The mute preference must be persisted in `localStorage` and restored on reload.

If the browser does not support Web Audio API, the game must run silently without errors.

**Acceptance criteria:** Each listed event produces a distinct audible tone when unmuted. Toggling mute silences all audio immediately. Mute state survives a page reload. Absence of Web Audio API does not produce a console error or visible failure.

---

### REQ-30 — Canvas Rendering

All gameplay elements (player, guards, cameras, vision cones, walls, data nodes, extraction zone, doors) must be drawn on a single `<canvas>` element. The canvas resolution must be **960 × 640 pixels** (logical). The canvas must be cleared and fully redrawn every frame via `requestAnimationFrame`.

**Acceptance criteria:** No gameplay element is rendered outside the canvas. The game does not use DOM elements for gameplay rendering (HUD may use DOM overlay). Frame rate is at least 30 fps on a mid-range laptop running the latest Chrome.

---

### REQ-31 — Responsive Browser Layout

The game's layout must fit within the browser viewport at widths from **960 px to 1920 px** without horizontal scrolling. At viewports narrower than 960 px, the canvas may be scaled down via CSS (`max-width: 100%`) to fit without clipping. The aspect ratio must be preserved during any scaling.

**Acceptance criteria:** At 1280×720 viewport, no horizontal or vertical scrollbar appears. At 800 px viewport width, the canvas scales down and remains fully visible. Aspect ratio remains 3:2 (960×640) at all sizes.

---

### REQ-32 — Keyboard Controls

All gameplay actions must be operable exclusively via keyboard. Required bindings:

| Action | Keys |
|---|---|
| Move up | `W`, `ArrowUp` |
| Move down | `S`, `ArrowDown` |
| Move left | `A`, `ArrowLeft` |
| Move right | `D`, `ArrowRight` |
| Hack (hold) | `E` |
| Pause / Resume | `Escape`, `P` |

No mouse input is required for gameplay. Mouse clicks are only used for menu buttons. Touch input is not supported.

**Acceptance criteria:** Every gameplay action can be completed without using a mouse. All listed key bindings function correctly. No action requires a key not listed above.

---

### REQ-33 — No External Dependencies

The game must load and run correctly by opening `index.html` directly in a browser (via `file://` protocol or a plain HTTP server). No npm install, no bundler, no CDN-loaded libraries, and no network requests are permitted at runtime.

**Acceptance criteria:** Opening `index.html` with no internet connection produces a fully functional game. The browser's network tab shows zero external requests after initial page load.

---

### REQ-34 — Error-Free Startup

The browser console must contain zero uncaught errors and zero unhandled promise rejections on initial page load and during normal gameplay. Warnings are permitted but must not indicate broken functionality.

**Acceptance criteria:** Opening the browser console during a full Level 1 playthrough (start → collect all data → extract) shows no red error entries.

---

### REQ-35 — Cyberpunk Visual Theme

All canvas-rendered elements and HTML/CSS UI must use a consistent cyberpunk colour palette. The required palette constraints are:

- Background / walls: dark tones (near-black, dark grey, dark blue).
- UI accent / active elements: neon cyan (`#00FFFF` or similar), neon green (`#00FF41` or similar), neon magenta.
- Alert / danger elements: neon red or orange.
- No use of warm neutrals (beige, tan, white) as primary colours.

Fonts used in HTML/CSS UI must be monospace or near-monospace to reinforce the aesthetic.

**Acceptance criteria:** No element uses a warm neutral as its primary colour. At least two neon accent colours are present in the UI. A monospace font is applied to all HUD and menu text.

---

## Coverage Verification

| Intent feature | Covered by |
|---|---|
| Main menu | REQ-01 |
| Level select and progression unlock | REQ-02 |
| Game start / reset | REQ-03 |
| Player movement (WASD / arrows) | REQ-04, REQ-32 |
| Wall collision | REQ-05 |
| Security cameras and vision cones | REQ-06, REQ-07 |
| Camera hacking | REQ-08, REQ-16 |
| Guard patrol routes | REQ-09 |
| Guard detection and pursuit | REQ-10, REQ-11 |
| Alert meter 0–100 | REQ-12 |
| Alert states and lockdown / Game Over | REQ-13, REQ-23 |
| Data node collection | REQ-14 |
| Hacking terminals (locked doors) | REQ-15, REQ-16 |
| Extraction zone | REQ-17 |
| Level completion | REQ-18 |
| Three distinct levels | REQ-19 |
| Level timer | REQ-20 |
| Score calculation | REQ-21 |
| Rank calculation | REQ-22 |
| Game Over screen | REQ-23 |
| Victory screen | REQ-24 |
| Pause and restart | REQ-25 |
| HUD | REQ-26 |
| Instructions / help screen | REQ-27 |
| High score persistence | REQ-28 |
| Mute / audio preference | REQ-29 |
| Canvas rendering | REQ-30 |
| Responsive browser layout | REQ-31 |
| Keyboard-only controls | REQ-32 |
| No external dependencies | REQ-33 |
| Error-free startup / localStorage failure | REQ-34, REQ-28 |
| Cyberpunk visual theme | REQ-35 |

No requirement introduces a feature outside the scope defined in Intent §5 and §12.

---

*End of Requirements artifact. Next artifact: Design.*
