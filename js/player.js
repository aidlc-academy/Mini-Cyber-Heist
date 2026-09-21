// ═══════════════════════════════════════════════════════════════
// player.js — Player state and movement
// ═══════════════════════════════════════════════════════════════
import { PLAYER_SPEED, PLAYER_W, PLAYER_H, TILE_SIZE, TILE_WALL, TILE_DOOR } from './constants.js';

export const player = {
  x: 48,
  y: 560,
  width:  PLAYER_W,
  height: PLAYER_H,
  speed:  PLAYER_SPEED,
  // Facing angle in radians (used for a direction indicator)
  angle: 0,
};

/** Reset player to a level's start position. */
export function resetPlayer(levelData) {
  player.x = levelData.playerStart.x;
  player.y = levelData.playerStart.y;
  player.angle = 0;
}

/**
 * Update player position each frame.
 * @param {number} dt        - delta time in seconds
 * @param {Set}    keys      - Set of currently held key strings
 * @param {object} levelData - current level (for collision)
 */
export function updatePlayer(dt, keys, levelData) {
  // ── Build raw velocity ──────────────────────────────────────
  let vx = 0, vy = 0;

  if (keys.has('ArrowLeft')  || keys.has('a') || keys.has('A'))  vx -= 1;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D'))  vx += 1;
  if (keys.has('ArrowUp')    || keys.has('w') || keys.has('W'))  vy -= 1;
  if (keys.has('ArrowDown')  || keys.has('s') || keys.has('S'))  vy += 1;

  // ── Normalise diagonal movement ─────────────────────────────
  if (vx !== 0 && vy !== 0) {
    const inv = 1 / Math.SQRT2;
    vx *= inv;
    vy *= inv;
  }

  // ── Update facing angle ─────────────────────────────────────
  if (vx !== 0 || vy !== 0) {
    player.angle = Math.atan2(vy, vx);
  }

  // ── Axis-separated collision ────────────────────────────────
  const dx = vx * player.speed * dt;
  const dy = vy * player.speed * dt;

  // Try X
  player.x += dx;
  if (collidesWithLevel(player, levelData)) {
    player.x -= dx;
  }

  // Try Y
  player.y += dy;
  if (collidesWithLevel(player, levelData)) {
    player.y -= dy;
  }
}

// ── Collision helpers ────────────────────────────────────────────

/**
 * Returns true if the player's AABB overlaps any solid tile in the level.
 */
function collidesWithLevel(p, levelData) {
  const hw = p.width  / 2;
  const hh = p.height / 2;
  const left   = p.x - hw;
  const right  = p.x + hw - 0.1;
  const top    = p.y - hh;
  const bottom = p.y + hh - 0.1;

  const tileLeft   = Math.floor(left   / TILE_SIZE);
  const tileRight  = Math.floor(right  / TILE_SIZE);
  const tileTop    = Math.floor(top    / TILE_SIZE);
  const tileBottom = Math.floor(bottom / TILE_SIZE);

  for (let row = tileTop; row <= tileBottom; row++) {
    for (let col = tileLeft; col <= tileRight; col++) {
      if (isSolid(col, row, levelData)) return true;
    }
  }
  return false;
}

/**
 * Returns true if the tile at (col, row) is solid.
 * TILE_DOOR is solid unless the matching door entry has open=true.
 */
export function isSolid(col, row, levelData) {
  if (col < 0 || row < 0 || col >= levelData.cols || row >= levelData.rows) return true;
  const tileId = levelData.tiles[row * levelData.cols + col];
  if (tileId === TILE_WALL) return true;
  if (tileId === TILE_DOOR) {
    // Check if any door covers this tile and is open
    for (const door of levelData.doors) {
      if (door.tileCol === col && door.tileRow === row) {
        return !door.open;
      }
    }
    return true; // no matching door entry → treat as wall
  }
  return false;
}

/** AABB overlap test between two rectangles (centred coordinates). */
export function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) / 2 &&
         Math.abs(ay - by) < (ah + bh) / 2;
}
