// ═══════════════════════════════════════════════════════════════
// security.js — Cameras, guards, vision cone geometry, FSM
// ═══════════════════════════════════════════════════════════════
import {
  GUARD_PATROL_SPEED, GUARD_PURSUIT_SPEED,
  GUARD_WAYPOINT_PAUSE, GUARD_LOST_TIME,
  GUARD_FOV, GUARD_RANGE,
  ALERT_PURSUIT_THRESH,
} from './constants.js';
import { aabbOverlap } from './player.js';

// ── Camera update ────────────────────────────────────────────────

/**
 * Update all cameras for one frame.
 * Advances rotation angle; handles oscillation and hack timers.
 */
export function updateCameras(cameras, dt) {
  for (const cam of cameras) {
    if (cam.hacked) {
      cam.hackTimer -= dt;
      if (cam.hackTimer <= 0) {
        cam.hacked = false;
        cam.hackTimer = 0;
      }
      continue; // don't rotate while hacked
    }

    if (cam.arcMin !== null && cam.arcMax !== null) {
      // Oscillating sweep — default to 0.8 rad/s if rotSpeed is 0
      const speed = cam.rotSpeed || 0.8;
      cam.angle += speed * cam.sweepDir * dt;
      if (cam.sweepDir > 0 && cam.angle >= cam.arcMax) {
        cam.angle = cam.arcMax;
        cam.sweepDir = -1;
      } else if (cam.sweepDir < 0 && cam.angle <= cam.arcMin) {
        cam.angle = cam.arcMin;
        cam.sweepDir = 1;
      }
    } else {
      // Full 360° rotation
      cam.angle += cam.rotSpeed * dt;
    }
  }
}

// ── Vision cone math ─────────────────────────────────────────────

/**
 * Returns true if point (px, py) is inside the camera's vision cone.
 * Uses distance + angle check (no line-of-sight ray casting required).
 */
export function isPointInCone(px, py, cx, cy, angle, fov, range) {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;

  const angleToPoint = Math.atan2(dy, dx);
  let diff = angleToPoint - angle;
  // Normalise diff to [-π, π]
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  return Math.abs(diff) <= fov / 2;
}

/**
 * Returns array of cameras that are currently detecting the player.
 * Checks player's centre + 4 corners against each active camera.
 */
export function getDetectingCameras(player, cameras) {
  const hw = player.width  / 2;
  const hh = player.height / 2;
  const checkPoints = [
    { x: player.x,      y: player.y      },  // centre
    { x: player.x - hw, y: player.y - hh },  // TL
    { x: player.x + hw, y: player.y - hh },  // TR
    { x: player.x - hw, y: player.y + hh },  // BL
    { x: player.x + hw, y: player.y + hh },  // BR
  ];

  return cameras.filter(cam => {
    if (cam.hacked) return false;
    return checkPoints.some(pt =>
      isPointInCone(pt.x, pt.y, cam.x, cam.y, cam.angle, cam.fov, cam.range)
    );
  });
}

// ── Guard update ─────────────────────────────────────────────────

/**
 * Update all guards for one frame.
 * @param {object[]} guards
 * @param {object}   player   - player object {x, y, width, height}
 * @param {number}   alertLevel
 * @param {number}   dt
 * @returns {boolean} true if any guard is in physical contact with the player
 */
export function updateGuards(guards, player, alertLevel, dt) {
  for (const guard of guards) {
    // ── Determine if guard's cone sees the player ─────────────
    const detecting = isPointInCone(
      player.x, player.y,
      guard.x,  guard.y,
      guard.angle, GUARD_FOV, GUARD_RANGE
    );

    // ── FSM transitions ──────────────────────────────────────
    if (guard.mode === 'patrol') {
      if (detecting && alertLevel >= ALERT_PURSUIT_THRESH) {
        guard.mode = 'pursue';
        guard.lostTimer = GUARD_LOST_TIME;
      } else {
        patrolStep(guard, dt);
      }
    } else {
      // pursue mode
      if (detecting) {
        guard.lostTimer = GUARD_LOST_TIME; // reset timer while still seeing
      } else {
        guard.lostTimer -= dt;
        if (guard.lostTimer <= 0) {
          guard.mode = 'patrol';
          // snap to nearest waypoint to resume cleanly
          guard.waypointIndex = nearestWaypointIndex(guard);
        }
      }
      if (guard.mode === 'pursue') {
        pursueStep(guard, player, dt);
      }
    }
  }

  // ── Contact check ─────────────────────────────────────────
  return guards.some(guard =>
    aabbOverlap(guard.x, guard.y, guard.width, guard.height,
                player.x, player.y, player.width, player.height)
  );
}

/**
 * Returns array of guards whose vision cone overlaps the player.
 */
export function getDetectingGuards(player, guards) {
  return guards.filter(g =>
    isPointInCone(player.x, player.y, g.x, g.y, g.angle, GUARD_FOV, GUARD_RANGE)
  );
}

// ── Internal patrol/pursue helpers ──────────────────────────────

function patrolStep(guard, dt) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }

  const wp = guard.waypoints[guard.waypointIndex];
  const dx = wp.x - guard.x;
  const dy = wp.y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 2) {
    // Arrived at waypoint
    guard.x = wp.x;
    guard.y = wp.y;
    guard.pauseTimer = GUARD_WAYPOINT_PAUSE;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  } else {
    const speed = GUARD_PATROL_SPEED * dt;
    guard.x += (dx / dist) * speed;
    guard.y += (dy / dist) * speed;
    guard.angle = Math.atan2(dy, dx);
  }
}

function pursueStep(guard, player, dt) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const speed = GUARD_PURSUIT_SPEED * dt;
  guard.x += (dx / dist) * speed;
  guard.y += (dy / dist) * speed;
  guard.angle = Math.atan2(dy, dx);
}

function nearestWaypointIndex(guard) {
  let best = 0, bestDist = Infinity;
  guard.waypoints.forEach((wp, i) => {
    const dx = wp.x - guard.x, dy = wp.y - guard.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}
