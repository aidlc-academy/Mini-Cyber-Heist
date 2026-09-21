// ═══════════════════════════════════════════════════════════════
// constants.js — all numeric/string constants for Mini Cyber Heist
// ═══════════════════════════════════════════════════════════════

// ── Canvas ──────────────────────────────────────────────────────
export const CANVAS_W = 960;
export const CANVAS_H = 640;

// ── Tile ────────────────────────────────────────────────────────
export const TILE_SIZE   = 32;
export const TILE_FLOOR  = 0;
export const TILE_WALL   = 1;
export const TILE_DOOR   = 2;   // closed door tile (solid until hacked open)

// ── Player ──────────────────────────────────────────────────────
export const PLAYER_SPEED  = 120;   // px/s
export const PLAYER_W      = 16;
export const PLAYER_H      = 16;

// ── Camera ──────────────────────────────────────────────────────
export const CAMERA_FOV        = Math.PI / 3;   // 60° total (30° half-angle)
export const CAMERA_RANGE      = 140;            // px
export const CAMERA_HACK_TIME  = 8;              // seconds disabled after hack

// ── Guard ───────────────────────────────────────────────────────
export const GUARD_PATROL_SPEED   = 80;          // px/s
export const GUARD_PURSUIT_SPEED  = 140;         // px/s
export const GUARD_W              = 16;
export const GUARD_H              = 16;
export const GUARD_FOV            = Math.PI / 3; // 60° total (30° half-angle)
export const GUARD_RANGE          = 100;         // px
export const GUARD_WAYPOINT_PAUSE = 0.5;         // seconds
export const GUARD_LOST_TIME      = 5;           // seconds before returning to patrol

// ── Alert ───────────────────────────────────────────────────────
export const ALERT_RISE_CAMERA    = 15;   // per second per detecting camera
export const ALERT_RISE_GUARD     = 30;   // per second per detecting guard
export const ALERT_FALL_RATE      = 5;    // per second when undetected
export const ALERT_PURSUIT_THRESH = 60;   // % — guards enter pursuit above this

// ── Hacking ─────────────────────────────────────────────────────
export const HACK_DURATION = 1.5;   // seconds to complete a hack
export const HACK_RANGE    = 48;    // px — proximity required

// ── Data nodes ──────────────────────────────────────────────────
export const NODE_SIZE = 14;   // px — collision/render radius

// ── Score ───────────────────────────────────────────────────────
// Maximum achievable score per level (perfect run):
// Level 1: base=1000, dataBonus=500, alertPen=0, timeBonus=300(at 0s) => (1800)*1 = 1800
// Level 2: base=2000, dataBonus=500, alertPen=0, timeBonus=300 => (2800)*2 = 5600
// Level 3: base=3000, dataBonus=500, alertPen=0, timeBonus=300 => (3800)*3 = 11400
export const MAX_SCORES = [1800, 5600, 11400];

// ── Colours (Canvas drawing) ─────────────────────────────────────
export const COLORS = {
  bg:             '#050510',
  floor:          '#0c0c1e',
  floorAlt:       '#0e0e22',
  wall:           '#1a1a3a',
  wallEdge:       '#2a2a5a',
  doorClosed:     '#3a1010',
  doorEdge:       '#ff4400',
  doorOpen:       '#0c0c1e',
  terminal:       '#004400',
  terminalEdge:   '#00ff41',

  player:         '#00ffff',
  playerEdge:     '#ffffff',

  guardPatrol:    '#ff3333',
  guardPursuit:   '#ff0000',
  guardEdge:      '#ffffff',

  cameraBody:     '#cc4400',
  cameraHacked:   '#004466',
  coneActive:     'rgba(255, 100, 0, 0.22)',
  coneActiveEdge: 'rgba(255, 100, 0, 0.55)',
  coneHacked:     'rgba(0, 200, 255, 0.12)',
  coneHackedEdge: 'rgba(0, 200, 255, 0.35)',
  guardCone:      'rgba(255, 50, 50, 0.18)',
  guardConeEdge:  'rgba(255, 50, 50, 0.5)',

  nodeInner:      '#00ffff',
  nodeOuter:      'rgba(0, 255, 255, 0.3)',
  nodeCollected:  'transparent',

  extractInactive:'rgba(40, 40, 60, 0.6)',
  extractActive:  'rgba(0, 255, 65, 0.35)',
  extractEdge:    '#00ff41',

  hackBar:        '#00ffff',
  hackBarBg:      '#1a1a2e',

  hudBg:          'rgba(5, 5, 18, 0.88)',
};

// ── Level meta (names / themes) ──────────────────────────────────
export const LEVEL_NAMES = [
  'ENTRY POINT',
  'SECURITY WING',
  'CORE VAULT',
];
export const LEVEL_THEMES = [
  'Server room — learn the basics',
  'Multiple rooms — guards & locked doors',
  'Dense vault — all mechanics combined',
];
