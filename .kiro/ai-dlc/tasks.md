# Mini Cyber Heist — Tasks

**AI-DLC Artifact: Tasks**
**Version:** 1.0
**Date:** 2026-09-20
**Status:** Draft
**Sources:** `design.md`, `requirements.md`

---

## Group A — Project Foundation

### T-01 — Project scaffold and index.html
**Requirements:** REQ-30, REQ-31, REQ-33, REQ-34
**Description:** Create the directory structure. Write `index.html` with: `<canvas id="gameCanvas" width="960" height="640">`, all overlay `<div>` elements for every game screen (menu, level-select, instructions, high-scores, pause, game-over, victory), HUD `<div>`, mute button, and `<script type="module" src="js/main.js">`. Link `style.css`.
**Expected result:** Opening `index.html` in a browser loads without errors. Canvas element is present. All overlay divs exist in DOM.

### T-02 — style.css
**Requirements:** REQ-31, REQ-35
**Description:** Write full cyberpunk CSS. Dark background (`#0a0a12`). Neon cyan (`#00FFFF`) and neon green (`#00FF41`) accents. Monospace font throughout. Canvas is centred, `max-width: 100%`, aspect-ratio preserved. HUD is fixed overlay above canvas. All screen overlays use `display:none` by default; `.visible` class shows them. Buttons styled with neon border, hover glow effect.
**Expected result:** Page displays dark background, neon-accented UI, monospace text. No horizontal scrollbar at 1280×720 or 800px viewport widths.

### T-03 — js/constants.js
**Requirements:** REQ-04, REQ-06, REQ-08, REQ-09, REQ-10, REQ-11, REQ-12, REQ-20, REQ-21, REQ-22, REQ-30
**Description:** Export all named numeric and string constants: `CANVAS_W`, `CANVAS_H`, `TILE_SIZE`, `PLAYER_SPEED`, `GUARD_PATROL_SPEED`, `GUARD_PURSUIT_SPEED`, `CAMERA_HACK_DURATION`, `HACK_DURATION`, `HACK_RANGE`, `ALERT_RISE_CAMERA`, `ALERT_RISE_GUARD`, `ALERT_FALL_RATE`, `ALERT_PURSUIT_THRESHOLD`, `GUARD_LOST_TIME`, `GUARD_WAYPOINT_PAUSE`, `DATA_NODE_SIZE`, `MAX_SCORES` array, `COLORS` palette object, tile ID constants (`TILE_FLOOR`, `TILE_WALL`, `TILE_DOOR`).
**Expected result:** Module imports cleanly. All values match the numbers in design.md and requirements.md.

---

## Group B — Canvas and Game Loop

### T-04 — js/main.js (bootstrap and event listeners)
**Requirements:** REQ-32, REQ-34
**Description:** Entry point. Get canvas and 2D context. Register `keydown`/`keyup` listeners that maintain a `Set` of held keys, exported as `keys`. Register all button click handlers (delegated to `game.js` state-transition functions). Call `game.init()` then start the loop via `requestAnimationFrame`.
**Expected result:** Page loads, game loop starts, key presses register in the `keys` Set without errors.

### T-05 — Game loop and state machine in js/game.js
**Requirements:** REQ-03, REQ-25, REQ-34
**Description:** Implement `init()`, `loop(timestamp)`, `update(dt)`, `render()`. `update` and `render` switch on `gameState`. Implement all state transitions: `startLevel(n)`, `pauseGame()`, `resumeGame()`, `restartLevel()`, `triggerGameOver()`, `triggerVictory()`, `goToMenu()`. Cap `dt` at 0.05.
**Expected result:** Loop runs at ≥30 fps. State transitions work without errors. Timer increments during `PLAYING` state and freezes in other states.

---

## Group C — Player

### T-06 — js/player.js
**Requirements:** REQ-04, REQ-05, REQ-32
**Description:** Export `player` object with `x`, `y`, `width=16`, `height=16`, `speed=120`. Export `updatePlayer(dt, keys, levelData)` that: reads WASD/arrow keys from `keys` Set, builds velocity vector, normalises diagonal movement, applies axis-separated AABB collision against solid tiles, commits position.
**Expected result:** Player moves at 120 px/s in cardinal directions, 120 px/s (not ~170) diagonally. Cannot pass through wall tiles. Slides along walls.

---

## Group D — Collision

### T-07 — Tile collision helpers in js/game.js or js/levels.js
**Requirements:** REQ-05
**Description:** Implement `isSolidAt(tileX, tileY, level)` and `getSolidTilesOverlapping(rect, level)`. A tile is solid if its ID is `TILE_WALL` or (`TILE_DOOR` and `door.open === false`). Used by player movement and door state checks.
**Expected result:** Player correctly blocked by walls and closed doors. Player passes through open doors.

---

## Group E — Security Cameras

### T-08 — Camera data structures and update in js/security.js
**Requirements:** REQ-06, REQ-07
**Description:** Export `updateCameras(cameras, dt)`. Each frame: advance `angle` by `rotSpeed × dt`; if oscillating (`arcMin`/`arcMax` set), reverse direction at bounds; decrement `hackTimer`, set `hacked = false` when it reaches 0.
**Expected result:** Cameras rotate continuously. Hacked cameras re-activate after 8 seconds.

### T-09 — Vision cone detection in js/security.js
**Requirements:** REQ-07
**Description:** Export `isPointInCone(px, py, cam)` (distance + angle check). Export `playerInCameraCones(player, cameras)` returning array of detecting cameras. Only checks non-hacked cameras.
**Expected result:** Function returns true when player overlaps cone, false when outside. No detection from hacked cameras.

### T-10 — Camera rendering in js/game.js render path
**Requirements:** REQ-06, REQ-07, REQ-35
**Description:** For each camera: draw the camera body (small square). Draw filled arc (sector) for vision cone using `ctx.arc`. Active cone: semi-transparent red/orange (`rgba(255,80,0,0.25)`). Hacked cone: semi-transparent cyan (`rgba(0,255,255,0.15)`). Camera body tint matches state.
**Expected result:** Cones are visible at all times. Colour changes immediately on hack/re-activate.

---

## Group F — Guards

### T-11 — Guard patrol and pursuit FSM in js/security.js
**Requirements:** REQ-09, REQ-10, REQ-11
**Description:** Export `updateGuards(guards, player, alertLevel, dt)`. Implement patrol → waypoint movement with 0.5 s pause. Implement pursuit: move toward player at `pursuitSpeed`, update facing angle. Implement lost-player timer (5 s). Switch modes based on `alertLevel >= ALERT_PURSUIT_THRESHOLD` AND detecting player. Guard vision cone: 60° total (30° half-angle), 100 px range, forward-facing.
**Expected result:** Guards loop through waypoints with pauses. Switch to pursuit at 60% alert when they detect player. Return to patrol 5 s after losing player.

### T-12 — Guard–player contact check in js/game.js
**Requirements:** REQ-11
**Description:** After `updateGuards`, check AABB overlap between each guard and player. On any overlap → `triggerGameOver()`.
**Expected result:** Walking into a guard immediately triggers Game Over.

### T-13 — Guard rendering
**Requirements:** REQ-09, REQ-10
**Description:** Draw each guard as a filled rectangle (neon red `#FF3333`). Draw a small triangle/arrow in the facing direction. Draw vision cone as semi-transparent red arc (smaller/narrower than camera cone). In pursuit mode change fill to brighter red or add a glow outline.
**Expected result:** Guards visually distinct from player. Patrol and pursuit modes are visually distinguishable.

---

## Group G — Alert System

### T-14 — Alert meter logic in js/game.js
**Requirements:** REQ-12, REQ-13, REQ-23
**Description:** Each frame during `PLAYING`: collect detecting cameras and guards. Compute rise rate. Apply rise or fall. Clamp 0–100. Track `peakAlert`. Detect state transitions (CLEAR/CAUTION/ALERT/LOCKDOWN); on new state, play tone. On reaching 100 → `triggerGameOver()`.
**Expected result:** Alert rises at 15/s per camera, 30/s per guard. Falls at 5/s undetected. Triggers Game Over at 100%.

### T-15 — Alert HUD update
**Requirements:** REQ-13, REQ-26
**Description:** Every frame call `ui.updateHUD` with current alert value, state string, data counts, elapsed time, level name. HUD alert bar changes colour: green/yellow/orange/red per state. Label changes text. LOCKDOWN state flashes.
**Expected result:** All five HUD elements update in real time. Colour and label match the correct thresholds.

---

## Group H — Hacking

### T-16 — Hacking state machine in js/hacking.js
**Requirements:** REQ-08, REQ-15, REQ-16
**Description:** Export `hackState` object and `updateHacking(dt, eHeld, player, cameras, doors)`. Proximity check (48 px from player centre to target centre). Progress advances at `dt / HACK_DURATION`. Release cancels. On completion call `applyHack(target)`: camera → `hacked=true, hackTimer=8`; door terminal → `door.open=true`.
**Expected result:** Holding E near a hackable target fills progress to 1.0 over 1.5 s. Releasing early resets to 0. Target affected only on full completion.

### T-17 — Hacking progress bar rendering
**Requirements:** REQ-16
**Description:** In render path: if `hackState.active`, draw a progress bar (100px wide, 8px tall) above the target entity. Background dark, fill neon cyan, proportional to `hackState.progress`.
**Expected result:** Bar appears and fills during hold. Disappears on completion or cancel.

---

## Group I — Data, Doors, Extraction

### T-18 — Data node collection in js/game.js
**Requirements:** REQ-14
**Description:** Each frame check player AABB against each uncollected node (treat node as 16×16 centred square). On overlap: `node.collected = true`, increment `levelState.collectedCount`. If `collectedCount >= level.requiredNodes`: set `levelState.extractionActive = true`. Play data-collected tone.
**Expected result:** Nodes collected on contact. HUD counter increments. Extraction activates when threshold met.

### T-19 — Data node rendering
**Requirements:** REQ-14, REQ-35
**Description:** Draw uncollected nodes as glowing hexagons or small diamonds in neon cyan with a subtle pulse animation (oscillate alpha using `levelState.time`). Collected nodes are not drawn.
**Expected result:** Nodes are clearly visible. Disappear when collected.

### T-20 — Door state and rendering in js/game.js
**Requirements:** REQ-15, REQ-05
**Description:** Closed doors drawn as red/orange tile. Open doors drawn as floor tile (or transparent). Door solid-status feeds into tile collision check. Terminals drawn as small green squares adjacent to their door.
**Expected result:** Player blocked by closed door. Player passes through after hack. Visual changes immediately on open.

### T-21 — Extraction zone rendering and trigger
**Requirements:** REQ-17, REQ-18
**Description:** Inactive: dim grey rectangle, "LOCKED" label in red. Active: pulsing green rectangle (`rgba(0,255,65, 0.4 + 0.2*sin(time))`), "EXTRACT" label in bright green. On player AABB overlap when active → `triggerVictory()`.
**Expected result:** Zone is visually distinct in both states. Victory only triggers when active and overlapped.

---

## Group J — Levels

### T-22 — Level 1 data: Entry Point
**Requirements:** REQ-19
**Description:** Define a ~20×13 tile map with simple corridors and rooms. 0 guards. 2–3 cameras with oscillating cones. 3 data nodes. 0 locked doors. 1 extraction zone. Player starts bottom-left area.
**Expected result:** Level 1 is completable: collect 3 nodes, reach extraction. No guards to avoid.

### T-23 — Level 2 data: Security Wing
**Requirements:** REQ-19
**Description:** Define a more complex ~25×16 tile map with multiple rooms. 2 guards with patrol routes. 4–5 cameras. 5 data nodes (4 required). 1–2 locked doors with terminals. 1 extraction zone.
**Expected result:** Level 2 introduces guard avoidance and locked doors. Completable with careful routing.

### T-24 — Level 3 data: Core Vault
**Requirements:** REQ-19
**Description:** Define a dense ~28×18 tile map with overlapping patrol zones. 4+ guards. 6–8 cameras. 7 data nodes (6 required). 2–3 locked doors. 1 extraction zone in the heavily guarded core.
**Expected result:** Level 3 uses all mechanics simultaneously. Harder than Level 2 but still completable.

---

## Group K — Scoring

### T-25 — Score and rank calculation in js/game.js
**Requirements:** REQ-21, REQ-22
**Description:** Implement `calcScore(levelNum, collected, total, peakAlert, elapsed)` using the formula from design §14. Implement `calcRank(score, levelIndex)` using `MAX_SCORES` thresholds. Call both in `triggerVictory()`.
**Expected result:** Given known inputs the correct score and rank are produced. Score minimum is 0.

---

## Group L — UI and Game States

### T-26 — Main menu screen
**Requirements:** REQ-01
**Description:** Show `#screen-menu` div. Wire "Play" → show level-select, "How to Play" → show instructions, "High Scores" → show high-scores overlay, mute button → toggle audio.
**Expected result:** All five menu elements present and functional.

### T-27 — Level select screen
**Requirements:** REQ-02
**Description:** Populate 3 level entries from `LEVELS` array and `storage` data. Apply locked/unlocked styling. Show stored high score or "—". Clicking unlocked level calls `game.startLevel(index)`. Clicking locked level does nothing. Back button returns to main menu.
**Expected result:** On fresh load only Level 1 is clickable. After completing Level 1, Level 2 becomes clickable without page refresh.

### T-28 — Instructions overlay
**Requirements:** REQ-27
**Description:** Show `#screen-instructions` with all required content: movement keys, E key, Escape/P, alert description, objective. "Close" button returns to menu.
**Expected result:** All required information present. Opens and closes without page reload.

### T-29 — High scores overlay
**Requirements:** REQ-01, REQ-28
**Description:** Show `#screen-highscores` populated with per-level best scores from `storage`. "Close" button returns to menu.
**Expected result:** Shows stored scores. Updates after a new best is set and re-opened.

### T-30 — Pause overlay
**Requirements:** REQ-25
**Description:** Show `#screen-pause` on `Escape`/`P` during `PLAYING`. "Resume" / `Escape` → resume. "Restart" → restart level. "Main Menu" → go to menu. Timer frozen while paused.
**Expected result:** Pause/resume cycle works. Timer does not increment while paused.

### T-31 — Game over screen
**Requirements:** REQ-23
**Description:** Show `#screen-gameover` with level name, elapsed time, alert level at moment of failure. "Retry" restarts current level. "Main Menu" goes to menu. No score saved.
**Expected result:** Both triggers (100% alert, guard contact) show this screen. Score not written to storage.

### T-32 — Victory screen
**Requirements:** REQ-24
**Description:** Show `#screen-victory` with level name, final score, rank, elapsed time, "NEW BEST!" if applicable. "Next Level" button shown and enabled only if next level exists. "Retry" and "Main Menu" buttons present.
**Expected result:** All elements present. "NEW BEST!" appears only when score exceeds stored value. "Next Level" absent on Level 3.

---

## Group M — Persistence and Audio

### T-33 — localStorage module (js/storage.js)
**Requirements:** REQ-28
**Description:** Implement all six functions from design §17 wrapped in try/catch. Level 1 always unlocked (index 0). Keys: `mch_score_0`, `mch_score_1`, `mch_score_2`, `mch_unlock_1`, `mch_unlock_2`, `mch_mute`.
**Expected result:** Scores and unlock states survive page reload. Exception when localStorage unavailable does not crash game.

### T-34 — Audio system
**Requirements:** REQ-29
**Description:** Implement `playTone(freq, duration, type)` in `game.js` using Web Audio API oscillator. Wrap everything in try/catch. Wire five game events to tones (detection, hack complete, data collected, alert state change, game over). Implement mute toggle that stops all audio output. Persist mute state.
**Expected result:** Distinct tones play for each event when unmuted. Mute silences immediately. No error if Web Audio unavailable.

---

## Group N — Testing and Verification

### T-35 — Static validation
**Requirements:** All
**Description:** Read all JS files for syntax issues. Verify all `import` paths resolve to existing files. Verify no TODO comments or placeholder functions remain. Check all button IDs referenced in JS match IDs in HTML. Check all canvas draw calls use valid ctx methods.
**Expected result:** Zero broken references. Zero TODO comments. Zero uncaught errors in browser console during normal play.

### T-36 — Gameplay path verification
**Requirements:** All gameplay requirements
**Description:** Manually trace the full Level 1 path: start → move → avoid camera → hack camera → collect 3 nodes → reach extraction → victory screen → score saved. Trace Level 2 path including guard avoidance and door hack. Trace Level 3 path. Test Game Over via lockdown and guard contact. Test pause/resume. Test restart. Test mute toggle.
**Expected result:** All paths complete without errors, soft-locks, or incorrect state transitions.

---

*End of Tasks artifact. Implementation begins with T-01.*
