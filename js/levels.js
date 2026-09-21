// ═══════════════════════════════════════════════════════════════
// levels.js — Level data definitions
// Tile IDs: 0=floor, 1=wall, 2=door (solid until hacked open)
// All positions in pixels (centre of sprite).
// Tile positions: col * TILE_SIZE + 16, row * TILE_SIZE + 16
// ═══════════════════════════════════════════════════════════════
import { TILE_FLOOR as F, TILE_WALL as W, TILE_DOOR as D } from './constants.js';

// Helper: build a rectangle of wall in a flat tile array
// (used only during level definition, not at runtime)

// ── LEVEL 1 — Entry Point ────────────────────────────────────────
// 30 cols × 20 rows = 960×640 (fills canvas exactly)
// Simple server room with a few corridors, 3 cameras, no guards.
//
// Legend:  W=wall, F=floor
//  Row 0–19, Col 0–29
const L1_COLS = 30;
const L1_ROWS = 20;

// prettier-ignore
const L1_TILES = [
  W,W,W,W,W,W,W,W,W,W, W,W,W,W,W,W,W,W,W,W, W,W,W,W,W,W,W,W,W,W, // row 0
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,W,W,F,F,F,F, F,F,F,F,F,F,F,F,F,W, // row 1
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,W,W,F,F,F,F, F,F,F,F,F,F,F,F,F,W, // row 2
  W,F,F,W,W,W,W,W,F,F, F,F,F,F,W,W,F,F,F,F, W,W,W,W,W,W,F,F,F,W, // row 3
  W,F,F,W,F,F,F,W,F,F, F,F,F,F,F,F,F,F,F,F, W,F,F,F,F,W,F,F,F,W, // row 4
  W,F,F,W,F,F,F,W,F,F, W,W,W,W,W,W,W,W,F,F, W,F,F,F,F,W,F,F,F,W, // row 5
  W,F,F,W,F,F,F,W,F,F, W,F,F,F,F,F,F,W,F,F, W,F,F,F,F,W,F,F,F,W, // row 6
  W,F,F,D,F,F,F,W,F,F, W,F,F,F,F,F,F,W,F,F, W,F,F,F,F,D,F,F,F,W, // row 7  (D tiles cleaned to floor by L1_TILES_CLEAN)
  W,F,F,W,F,F,F,W,F,F, W,F,F,F,F,F,F,W,F,F, W,F,F,F,F,W,F,F,F,W, // row 8
  W,F,F,W,F,F,F,W,F,F, W,W,W,F,W,W,W,W,F,F, W,W,W,D,W,W,F,F,F,W, // row 9
  W,F,F,W,F,F,F,F,F,F, F,F,W,F,W,F,F,F,F,F, F,F,W,F,W,W,F,F,F,W, // row10
  W,F,F,W,W,W,F,W,W,W, W,F,W,F,W,F,F,F,F,F, F,F,W,F,F,F,F,F,F,W, // row11
  W,F,F,F,F,W,F,F,F,F, W,F,W,F,W,F,F,W,W,W, W,F,W,F,F,F,F,F,F,W, // row12
  W,F,F,F,F,W,F,F,F,F, W,F,F,F,W,F,F,W,F,F, W,F,W,W,W,W,W,W,F,W, // row13
  W,W,W,W,F,W,W,W,W,W, W,W,W,W,W,F,F,W,F,F, W,F,F,F,F,F,F,W,F,W, // row14
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,W,F,F, W,W,W,W,F,W,W,W,F,W, // row15
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,W, // row16
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,W, // row17
  W,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,F, F,F,F,F,F,F,F,F,F,W, // row18
  W,W,W,W,W,W,W,W,W,W, W,W,W,W,W,W,W,W,W,W, W,W,W,W,W,W,W,W,W,W, // row19
];

// Level 1 has no locked doors — replace any stray D tiles with floor
const L1_TILES_CLEAN = L1_TILES.map(t => t === D ? F : t);

export const LEVELS = [

  // ────────────────────────────────────────────────────────────
  // LEVEL 1 — Entry Point
  // ────────────────────────────────────────────────────────────
  {
    index: 0,
    name: 'ENTRY POINT',
    theme: 'Server room — learn the basics',
    cols: L1_COLS,
    rows: L1_ROWS,
    tiles: L1_TILES_CLEAN,
    requiredNodes: 3,
    totalNodes: 3,

    playerStart: { x: 48, y: 560 },   // near bottom-left

    cameras: [
      {
        x: 112, y: 96,          // top-left area
        angle: Math.PI / 2,     // facing down initially
        rotSpeed: 0,
        arcMin: Math.PI * 0.2,
        arcMax: Math.PI * 0.8,
        sweepDir: 1,
        range: 140,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 496, y: 208,         // centre room
        angle: Math.PI,
        rotSpeed: 0,
        arcMin: Math.PI * 0.7,
        arcMax: Math.PI * 1.3,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 832, y: 368,         // right corridor
        angle: -Math.PI / 2,
        rotSpeed: 0,
        arcMin: -Math.PI * 0.9,
        arcMax: -Math.PI * 0.1,
        sweepDir: 1,
        range: 120,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
    ],

    guards: [],   // no guards in level 1

    nodes: [
      { x: 208, y: 160, collected: false },  // top-left room
      { x: 496, y: 336, collected: false },  // centre
      { x: 848, y: 160, collected: false },  // top-right area
    ],

    doors: [],   // no locked doors in level 1

    extraction: { x: 880, y: 560, width: 64, height: 48 },
  },

  // ────────────────────────────────────────────────────────────
  // LEVEL 2 — Security Wing
  // ────────────────────────────────────────────────────────────
  // 30 cols × 20 rows
  {
    index: 1,
    name: 'SECURITY WING',
    theme: 'Multiple rooms — guards & locked doors',
    cols: 30,
    rows: 20,
    tiles: buildLevel2Tiles(),
    requiredNodes: 4,
    totalNodes: 5,

    playerStart: { x: 48, y: 560 },

    cameras: [
      {
        x: 160, y: 96,
        angle: Math.PI * 0.6,
        rotSpeed: 0,
        arcMin: Math.PI * 0.3,
        arcMax: Math.PI * 0.9,
        sweepDir: 1,
        range: 140,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 480, y: 96,
        angle: Math.PI,
        rotSpeed: 0,
        arcMin: Math.PI * 0.6,
        arcMax: Math.PI * 1.4,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 800, y: 208,
        angle: -Math.PI / 2,
        rotSpeed: 0,
        arcMin: -Math.PI,
        arcMax: 0,
        sweepDir: 1,
        range: 140,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 480, y: 400,
        angle: Math.PI / 4,
        rotSpeed: 0,
        arcMin: -Math.PI * 0.25,
        arcMax: Math.PI * 0.75,
        sweepDir: 1,
        range: 120,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
      {
        x: 160, y: 480,
        angle: 0,
        rotSpeed: 0,
        arcMin: -Math.PI * 0.4,
        arcMax: Math.PI * 0.4,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false,
        hackTimer: 0,
      },
    ],

    guards: [
      {
        x: 304, y: 192,
        width: 16, height: 16,
        waypoints: [
          { x: 304, y: 192 },
          { x: 304, y: 480 },
          { x: 624, y: 480 },
          { x: 624, y: 192 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: Math.PI / 2,
      },
      {
        x: 752, y: 320,
        width: 16, height: 16,
        waypoints: [
          { x: 752, y: 320 },
          { x: 880, y: 320 },
          { x: 880, y: 480 },
          { x: 752, y: 480 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: 0,
      },
    ],

    nodes: [
      { x: 96,  y: 160, collected: false },
      { x: 480, y: 160, collected: false },
      { x: 848, y: 96,  collected: false },
      { x: 304, y: 352, collected: false },
      { x: 752, y: 544, collected: false },
    ],

    doors: [
      {
        // Door at mid corridor col=13, row=10 (matches builder t[10*30+13]=D)
        tileCol: 13, tileRow: 10,
        open: false,
        terminal: { x: 400, y: 304 },
      },
      {
        // Door at bottom-right col=22, row=14 (matches builder t[14*30+22]=D)
        tileCol: 22, tileRow: 14,
        open: false,
        terminal: { x: 672, y: 464 },
      },
    ],

    extraction: { x: 880, y: 560, width: 64, height: 48 },
  },

  // ────────────────────────────────────────────────────────────
  // LEVEL 3 — Core Vault
  // ────────────────────────────────────────────────────────────
  {
    index: 2,
    name: 'CORE VAULT',
    theme: 'Dense vault — all mechanics combined',
    cols: 30,
    rows: 20,
    tiles: buildLevel3Tiles(),
    requiredNodes: 6,
    totalNodes: 7,

    playerStart: { x: 48, y: 560 },

    cameras: [
      {
        x: 112, y: 96,
        angle: Math.PI * 0.5,
        rotSpeed: 0.8,   // slowly rotating full 360
        arcMin: null, arcMax: null,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
      {
        x: 400, y: 96,
        angle: Math.PI,
        rotSpeed: 0,
        arcMin: Math.PI * 0.5,
        arcMax: Math.PI * 1.5,
        sweepDir: 1,
        range: 140,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
      {
        x: 752, y: 96,
        angle: Math.PI * 1.2,
        rotSpeed: 0,
        arcMin: Math.PI * 0.7,
        arcMax: Math.PI * 1.7,
        sweepDir: 1,
        range: 140,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
      {
        x: 160, y: 336,
        angle: 0,
        rotSpeed: 0,
        arcMin: -Math.PI * 0.5,
        arcMax: Math.PI * 0.5,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
      {
        x: 560, y: 288,
        angle: -Math.PI / 2,
        rotSpeed: 1.2,
        arcMin: null, arcMax: null,
        sweepDir: 1,
        range: 120,
        fov: Math.PI * 0.4,
        hacked: false, hackTimer: 0,
      },
      {
        x: 848, y: 352,
        angle: Math.PI,
        rotSpeed: 0,
        arcMin: Math.PI * 0.5,
        arcMax: Math.PI * 1.5,
        sweepDir: 1,
        range: 130,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
      {
        x: 480, y: 512,
        angle: Math.PI * 0.5,
        rotSpeed: 0,
        arcMin: Math.PI * 0.1,
        arcMax: Math.PI * 0.9,
        sweepDir: 1,
        range: 110,
        fov: Math.PI / 3,
        hacked: false, hackTimer: 0,
      },
    ],

    guards: [
      {
        x: 240, y: 160,
        width: 16, height: 16,
        waypoints: [
          { x: 240, y: 160 },
          { x: 240, y: 480 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: Math.PI / 2,
      },
      {
        x: 480, y: 160,
        width: 16, height: 16,
        waypoints: [
          { x: 480, y: 160 },
          { x: 720, y: 160 },
          { x: 720, y: 480 },
          { x: 480, y: 480 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: 0,
      },
      {
        x: 800, y: 240,
        width: 16, height: 16,
        waypoints: [
          { x: 800, y: 240 },
          { x: 880, y: 240 },
          { x: 880, y: 400 },
          { x: 800, y: 400 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: 0,
      },
      {
        x: 160, y: 480,
        width: 16, height: 16,
        waypoints: [
          { x: 160, y: 480 },
          { x: 400, y: 480 },
          { x: 400, y: 560 },
          { x: 160, y: 560 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: 0,
      },
      {
        x: 624, y: 528,
        width: 16, height: 16,
        waypoints: [
          { x: 624, y: 528 },
          { x: 848, y: 528 },
        ],
        waypointIndex: 0,
        pauseTimer: 0,
        mode: 'patrol',
        lostTimer: 0,
        angle: 0,
      },
    ],

    nodes: [
      { x: 96,  y: 160, collected: false },
      { x: 368, y: 96,  collected: false },
      { x: 720, y: 96,  collected: false },
      { x: 160, y: 432, collected: false },
      { x: 560, y: 400, collected: false },
      { x: 848, y: 160, collected: false },
      { x: 752, y: 528, collected: false },
    ],

    doors: [
      {
        // tileRow=7, tileCol=10 → matches builder t[7*30+10]=D
        tileCol: 10, tileRow: 7,
        open: false,
        terminal: { x: 288, y: 192 },
      },
      {
        // tileRow=7, tileCol=18 → matches builder t[7*30+18]=D
        tileCol: 18, tileRow: 7,
        open: false,
        terminal: { x: 576, y: 192 },
      },
      {
        // tileRow=13, tileCol=14 → matches builder t[13*30+14]=D
        tileCol: 14, tileRow: 13,
        open: false,
        terminal: { x: 432, y: 400 },
      },
    ],

    extraction: { x: 880, y: 560, width: 64, height: 48 },
  },
];

// ═══════════════════════════════════════════════════════════════
// Level tile map builders
// ═══════════════════════════════════════════════════════════════

function buildLevel2Tiles() {
  const COLS = 30, ROWS = 20;
  // Start with all walls, carve out rooms
  const t = Array(COLS * ROWS).fill(W);

  function fill(c1, r1, c2, r2, val) {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        t[r * COLS + c] = val;
  }

  // Main open areas
  fill(1, 1, 12, 8, F);   // top-left wing
  fill(14, 1, 28, 8, F);  // top-right wing
  fill(1, 10, 12, 18, F); // bottom-left wing
  fill(14, 10, 28, 18, F);// bottom-right wing

  // Corridors connecting wings
  fill(13, 3, 13, 6, F);  // vertical connector top
  fill(13, 12, 13, 16, F);// vertical connector bottom
  fill(6, 9, 22, 9, F);   // horizontal mid corridor

  // Internal walls for interest
  fill(3, 3, 3, 6, W);
  fill(8, 1, 8, 5, W);
  fill(17, 2, 17, 6, W);
  fill(24, 1, 24, 5, W);
  fill(4, 12, 4, 16, W);
  fill(9, 11, 9, 14, W);
  fill(19, 11, 19, 15, W);
  fill(25, 12, 25, 17, W);

  // Doors at connector chokepoints
  t[10 * COLS + 13] = D;  // horizontal mid, col 13
  t[14 * COLS + 22] = D;  // bottom-right wing

  return t;
}

function buildLevel3Tiles() {
  const COLS = 30, ROWS = 20;
  const t = Array(COLS * ROWS).fill(W);

  function fill(c1, r1, c2, r2, val) {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        t[r * COLS + c] = val;
  }

  // Large central vault
  fill(1,  1, 28, 18, F);

  // Outer ring walls
  fill(7,  1, 7,  8,  W);
  fill(14, 1, 14, 5,  W);
  fill(21, 1, 21, 8,  W);
  fill(7,  11, 7, 18, W);
  fill(14, 13, 14,18, W);
  fill(21, 11, 21,18, W);
  fill(1,  9, 6,  9,  W);
  fill(9,  9, 13, 9,  W);
  fill(15, 9, 20, 9,  W);
  fill(22, 9, 28, 9,  W);

  // Rooms within vault
  fill(2,  2, 6,  7,  F);
  fill(9,  2, 13, 7,  F);
  fill(15, 2, 20, 7,  F);
  fill(22, 2, 28, 7,  F);
  fill(2,  10, 6, 17, F);
  fill(9,  10, 13,17, F);
  fill(15, 10, 20,17, F);
  fill(22, 10, 28,17, F);

  // Door tiles at chokepoints
  t[7  * COLS + 10] = D;
  t[7  * COLS + 18] = D;
  t[13 * COLS + 14] = D;

  return t;
}
