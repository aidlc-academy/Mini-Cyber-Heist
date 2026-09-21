// ═══════════════════════════════════════════════════════════════
// hacking.js — Hacking state machine and progress tracking
// ═══════════════════════════════════════════════════════════════
import { HACK_DURATION, HACK_RANGE, CAMERA_HACK_TIME } from './constants.js';

export const hackState = {
  active:   false,
  target:   null,    // reference to camera or door object
  type:     null,    // 'camera' | 'door'
  progress: 0,       // 0.0 – 1.0
  completed: false,  // true for one frame when hack finishes
};

/**
 * Update the hacking state machine each frame.
 *
 * @param {number}   dt        - delta time seconds
 * @param {boolean}  eHeld     - is E key currently held
 * @param {object}   player    - player object {x, y}
 * @param {object[]} cameras   - camera array from level
 * @param {object[]} doors     - door array from level
 * @returns {{ completed: boolean, target: object|null, type: string|null }}
 *   completed=true for the one frame a hack finishes
 */
export function updateHacking(dt, eHeld, player, cameras, doors) {
  hackState.completed = false;

  if (!eHeld) {
    // Key released — cancel any in-progress hack
    resetHack();
    return hackState;
  }

  if (!hackState.active) {
    // Try to find a target within range
    const target = findHackTarget(player, cameras, doors);
    if (target) {
      hackState.active   = true;
      hackState.target   = target.obj;
      hackState.type     = target.type;
      hackState.progress = 0;
    }
    return hackState;
  }

  // Already hacking — advance progress
  hackState.progress += dt / HACK_DURATION;

  if (hackState.progress >= 1) {
    hackState.progress = 1;
    applyHack(hackState.target, hackState.type);
    hackState.completed = true;
    resetHack();
  }

  return hackState;
}

function resetHack() {
  hackState.active   = false;
  hackState.target   = null;
  hackState.type     = null;
  hackState.progress = 0;
}

function applyHack(target, type) {
  if (type === 'camera') {
    target.hacked    = true;
    target.hackTimer = CAMERA_HACK_TIME;
  } else if (type === 'door') {
    target.open = true;
  }
}

/**
 * Find the nearest hackable target within HACK_RANGE of the player.
 * Returns { obj, type } or null.
 */
function findHackTarget(player, cameras, doors) {
  let nearest = null;
  let nearestDist = HACK_RANGE;

  // Check cameras (only non-hacked ones)
  for (const cam of cameras) {
    if (cam.hacked) continue;
    const dist = distance(player.x, player.y, cam.x, cam.y);
    if (dist <= nearestDist) {
      nearestDist = dist;
      nearest = { obj: cam, type: 'camera' };
    }
  }

  // Check door terminals
  for (const door of doors) {
    if (door.open) continue;
    const tx = door.terminal.x;
    const ty = door.terminal.y;
    const dist = distance(player.x, player.y, tx, ty);
    if (dist <= nearestDist) {
      nearestDist = dist;
      nearest = { obj: door, type: 'door' };
    }
  }

  return nearest;
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2, dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}
