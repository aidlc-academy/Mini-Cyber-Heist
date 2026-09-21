# Mini Cyber Heist — Intent

**AI-DLC Artifact: Intent**
**Version:** 1.0
**Date:** 2026-09-20
**Status:** Approved

---

## 1. Project Overview

Mini Cyber Heist is a browser-based cyberpunk stealth game. The player is a digital infiltrator breaking into a futuristic corporate facility to steal encrypted data. Success requires careful movement, smart use of hacking abilities, evasion of guards and security cameras, and reaching the extraction point before the alert level triggers a lockdown.

The game is deliberately small in scope but high in finish quality. Every feature that ships should feel complete, polished, and intentional.

---

## 2. Vision Statement

> A tight, replayable stealth experience that runs entirely in the browser — no installs, no accounts, no friction. Play it, feel the tension, beat the level, beat your score.

---

## 3. Goals

### Primary Goals
- Deliver a complete, self-contained stealth game playable in any modern browser.
- Provide 3 distinct levels that escalate in difficulty and layout complexity.
- Make the core stealth loop (move → avoid → hack → collect → escape) feel satisfying and readable at a glance.
- Persist high scores and level progress between sessions using localStorage.

### Secondary Goals
- Keep the visual style coherent with the cyberpunk theme using CSS and Canvas rendering.
- Ensure controls are responsive and learnable within the first 30 seconds of play.
- Allow a player to complete a single level in 3–8 minutes.

---

## 4. Target Audience

- Casual to mid-core browser game players.
- Players who enjoy stealth, puzzle-light gameplay, and short-session games.
- Developers and portfolio reviewers evaluating polished browser game craft.

---

## 5. Scope

### In Scope
| Feature | Description |
|---|---|
| 3 playable levels | Tile-based or canvas-drawn maps, each with a unique layout |
| Player character | Keyboard-controlled movement (WASD / arrow keys) |
| Security cameras | Rotating cone-of-vision; trigger alert if player enters cone |
| Guards | Patrol routes; pursue player when alert is raised |
| Hacking mechanic | Player can hack cameras and doors via proximity interaction |
| Alert system | 0–100% alert meter; escalates on detection events; de-escalates over time |
| Data collection | Collectible encrypted data nodes scattered across each level |
| Extraction objective | Reach the exit point after collecting required data to win |
| Score system | Score based on time, alert level, data collected, and difficulty |
| Game Over screen | Triggered on full alert lockdown or guard capture |
| Victory screen | Displays score, time, grade, and high score comparison |
| High score persistence | localStorage; per-level best scores |
| Main menu | Start game, select level (unlocked progressively), view scores |

### Out of Scope
- Multiplayer or network play
- Server-side storage or any backend
- Mobile / touch controls (keyboard only)
- In-game purchases or monetisation
- Procedurally generated levels
- Dialogue, story cutscenes, or voiced audio
- Complex AI pathfinding (guards use fixed patrol routes with simple line-of-sight)
- Level editor or modding support

---

## 6. Technical Constraints

| Constraint | Decision |
|---|---|
| Platform | Browser-only; no install, no backend |
| Language | JavaScript (vanilla, no framework) |
| Rendering | HTML5 Canvas for the gameplay viewport |
| UI / Menus | HTML + CSS layered over the canvas |
| Persistence | localStorage only |
| Audio | Optional; simple Web Audio API beeps/tones if included |
| Dependencies | Zero external libraries (no npm, no bundler required to play) |
| Browser targets | Latest stable Chrome, Firefox, Edge, Safari |
| File structure | Single repository; game loads from `index.html` |

---

## 7. Core Gameplay Loop

```
Start Level
    │
    ▼
Observe layout → Plan route
    │
    ▼
Move player (WASD / arrows)
    │
    ├─ Avoid camera cones ──► Alert rises → Guard pursues → Game Over
    ├─ Avoid guard patrols ──► Alert rises → ...
    │
    ▼
Hack device (E key near camera/door)
    │
    ▼
Collect data nodes (walk over)
    │
    ▼
All required data collected?
    ├─ No → Continue exploring
    └─ Yes → Extraction point unlocked
                │
                ▼
            Reach exit → Victory Screen → Score saved
```

---

## 8. Level Design Intent

| Level | Theme | Key Mechanic Introduced |
|---|---|---|
| 1 — Entry Point | Simple server room; few cameras, no guards | Movement, hacking, data collection, extraction |
| 2 — Security Wing | More cameras, first guards, locked doors | Guard avoidance, alert escalation, hacking doors |
| 3 — Core Vault | Dense layout, multiple guards, time pressure | Full system; all mechanics combined; score pressure |

Each level must be completable in a single sitting and feel meaningfully different from the previous one.

---

## 9. Alert System Intent

The alert meter is the central tension mechanic:

- Starts at 0% per level.
- Rises when the player is spotted by a camera or guard.
- Falls slowly when the player is out of detection range and undetected.
- At 100%, lockdown triggers — guards rush the player, doors lock, Game Over is imminent.
- The player can reduce camera contributions by hacking cameras (disables them temporarily).
- Guards cannot be hacked; they must be avoided entirely.

---

## 10. Score System Intent

Score is calculated at level completion:

```
Base Score
  + (Data nodes collected / total) × data bonus
  - (Alert level reached as %) × alert penalty
  + Time bonus (faster = more points)
  × Difficulty multiplier (level number)
```

High scores are stored per level in localStorage. A global leaderboard is not in scope.

---

## 11. Success Criteria

The project is considered complete and successful when:

1. All 3 levels are playable from start to finish without bugs or soft-locks.
2. The full gameplay loop (move → hack → collect → extract) works correctly in all levels.
3. Security cameras detect the player via cone-of-vision logic.
4. Guards patrol and pursue the player when the alert threshold is crossed.
5. Hacking disables cameras and unlocks hackable doors with clear visual feedback.
6. The alert meter rises, falls, and triggers Game Over at 100% as specified.
7. Score is calculated correctly and persisted to localStorage on level completion.
8. Victory and Game Over screens display with correct information.
9. Level progression is unlocked correctly (level 2 unlocks after level 1 is complete, etc.).
10. The game runs correctly in Chrome, Firefox, and Edge without any external dependencies.
11. The entire game loads from a single `index.html` file with no server required.
12. The visual style is visually coherent and communicates the cyberpunk theme clearly.

---

## 12. Non-Goals (Explicit)

- This project does not aim to be a commercial product.
- This project does not need an accessibility audit or WCAG compliance.
- This project does not need multiplayer, authentication, or any network feature.
- This project does not need to run on mobile or support touch input.
- This project does not need a level editor or any user-generated content tools.

---

## 13. Open Questions (To Resolve in Design Phase)

1. Tile-based grid movement or free pixel movement? Grid is simpler; free movement is more fluid.
2. Should hacking be instant or require a brief mini-interaction (progress bar)?
3. Should the player have a limited number of "hack charges" per level, or unlimited?
4. Should guards return to patrol after a fixed time if they lose the player, or permanently pursue?
5. What is the visual language for "camera is hacked" vs "camera is active"?
6. Should there be a stealth kill / takedown mechanic, or pure avoidance only?

These questions are deferred to the Requirements and Design artifacts.

---

*End of Intent artifact. Next artifact: Requirements.*
