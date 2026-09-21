// ═══════════════════════════════════════════════════════════════
// game.js — Game state machine, loop, rendering, alert, score
// ═══════════════════════════════════════════════════════════════
import {
  CANVAS_W, CANVAS_H, TILE_SIZE,
  TILE_FLOOR, TILE_WALL, TILE_DOOR,
  ALERT_RISE_CAMERA, ALERT_RISE_GUARD, ALERT_FALL_RATE,
  NODE_SIZE, COLORS, MAX_SCORES,
} from './constants.js';
import { LEVELS } from './levels.js';
import { player, resetPlayer, updatePlayer, aabbOverlap } from './player.js';
import { updateCameras, getDetectingCameras, updateGuards, getDetectingGuards } from './security.js';
import { hackState, updateHacking } from './hacking.js';
import { saveScore, unlockLevel } from './storage.js';
import {
  showScreen, hideAllScreens,
  showHUD, hideHUD,
  updateHUD, showGameOver, showVictory,
} from './ui.js';

// ── Canvas ───────────────────────────────────────────────────────
let canvas, ctx;

export function setCanvas(c) {
  canvas = c;
  ctx = c.getContext('2d');
}

// ── Game state ───────────────────────────────────────────────────
export let gameState = 'MENU';   // MENU | LEVEL_SELECT | INSTRUCTIONS | HIGH_SCORES | PLAYING | PAUSED | GAME_OVER | VICTORY

/** Read-only accessor so external modules always get the live value. */
export function getGameState() { return gameState; }

// ── Active level runtime state ────────────────────────────────────
export let currentLevelIndex = 0;
let levelData         = null;   // deep-cloned from LEVELS[n]

let alertLevel  = 0;
let peakAlert   = 0;
let prevAlertState = 'CLEAR';
let levelTime   = 0;            // seconds elapsed
let collectedCount = 0;
let extractionActive = false;

// ── Loop timing ──────────────────────────────────────────────────
let lastTimestamp = 0;
let animFrameId   = null;

// ── Held keys (set by main.js) ───────────────────────────────────
export const keys = new Set();

// ── Mute state (set by main.js) ──────────────────────────────────
export let muted = false;
export function setMuted(val) { muted = val; }

// ── Audio ─────────────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  } catch (_) {
    return null;
  }
}

function playTone(freq, duration, type = 'sine', volume = 0.18) {
  if (muted) return;
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (_) {
    // silent — Web Audio not available
  }
}

// ── Initialise ───────────────────────────────────────────────────
export function init() {
  gameState = 'MENU';
  showScreen('menu');
  hideHUD();
  startLoop();
}

// ── Game loop ────────────────────────────────────────────────────
function startLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  lastTimestamp = 0;
  animFrameId = requestAnimationFrame(loop);
}

function loop(timestamp) {
  animFrameId = requestAnimationFrame(loop);

  const rawDt = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const dt = Math.min(rawDt, 0.05); // cap at 50ms

  update(dt, timestamp);
  render(timestamp);
}

// ── Update ────────────────────────────────────────────────────────
function update(dt, timestamp) {
  if (gameState !== 'PLAYING') return;

  levelTime += dt;

  // ── Player movement ──────────────────────────────────────────
  updatePlayer(dt, keys, levelData);

  // ── Cameras ─────────────────────────────────────────────────
  updateCameras(levelData.cameras, dt);

  // ── Guards ──────────────────────────────────────────────────
  const guardContact = updateGuards(levelData.guards, player, alertLevel, dt);
  if (guardContact) {
    triggerGameOver('CAPTURED BY GUARD');
    return;
  }

  // ── Hacking ─────────────────────────────────────────────────
  const eHeld = keys.has('e') || keys.has('E');
  const hackResult = updateHacking(dt, eHeld, player, levelData.cameras, levelData.doors);
  if (hackResult.completed) {
    playTone(880, 0.3, 'sine');
  }

  // ── Alert system ────────────────────────────────────────────
  const detectingCameras = getDetectingCameras(player, levelData.cameras);
  const detectingGuards  = getDetectingGuards(player, levelData.guards);

  const wasDetected = detectingCameras.length > 0 || detectingGuards.length > 0;

  if (wasDetected) {
    let rate = detectingCameras.length * ALERT_RISE_CAMERA
             + detectingGuards.length  * ALERT_RISE_GUARD;
    alertLevel += rate * dt;
  } else {
    alertLevel -= ALERT_FALL_RATE * dt;
  }

  alertLevel = Math.max(0, Math.min(100, alertLevel));
  peakAlert  = Math.max(peakAlert, alertLevel);

  // Alert state changes
  const currentAlertState = getAlertState(alertLevel);
  if (currentAlertState !== prevAlertState) {
    if (currentAlertState === 'LOCKDOWN') {
      playTone(220, 0.8, 'sawtooth');
    } else {
      playTone(330, 0.4, 'sawtooth');
    }
    prevAlertState = currentAlertState;
  }

  // Detection start tone (only first frame of detection)
  if (wasDetected && alertLevel > 0 && prevAlertState === 'CLEAR' &&
      currentAlertState !== 'CLEAR') {
    playTone(440, 0.2, 'square');
  }

  if (alertLevel >= 100) {
    triggerGameOver('SECURITY LOCKDOWN');
    return;
  }

  // ── Data node collection ─────────────────────────────────────
  for (const node of levelData.nodes) {
    if (node.collected) continue;
    if (aabbOverlap(player.x, player.y, player.width, player.height,
                    node.x, node.y, NODE_SIZE, NODE_SIZE)) {
      node.collected = true;
      collectedCount++;
      playTone(660, 0.15, 'sine');
      if (collectedCount >= levelData.requiredNodes) {
        extractionActive = true;
      }
    }
  }

  // ── Extraction check ─────────────────────────────────────────
  if (extractionActive) {
    const ez = levelData.extraction;
    if (aabbOverlap(player.x, player.y, player.width, player.height,
                    ez.x + ez.width / 2, ez.y + ez.height / 2, ez.width, ez.height)) {
      triggerVictory();
    }
  }
}

// ── State transitions ─────────────────────────────────────────────

export function startLevel(index) {
  currentLevelIndex = index;
  levelData         = deepCloneLevel(LEVELS[index]);
  alertLevel        = 0;
  peakAlert         = 0;
  prevAlertState    = 'CLEAR';
  levelTime         = 0;
  collectedCount    = 0;
  extractionActive  = false;

  resetPlayer(levelData);

  gameState = 'PLAYING';
  hideAllScreens();
  showHUD();
}

export function pauseGame() {
  if (gameState !== 'PLAYING') return;
  gameState = 'PAUSED';
  showScreen('pause');
}

export function resumeGame() {
  if (gameState !== 'PAUSED') return;
  gameState = 'PLAYING';
  hideAllScreens();
  lastTimestamp = 0; // reset dt to avoid jump
}

export function restartLevel() {
  startLevel(currentLevelIndex);
}

export function goToMenu() {
  gameState = 'MENU';
  hideHUD();
  showScreen('menu');
}

export function goToLevelSelect() {
  gameState = 'LEVEL_SELECT';
  hideHUD();
  showScreen('levelselect');
}

function triggerGameOver(reason) {
  gameState = 'GAME_OVER';
  playTone(220, 0.8, 'sawtooth');
  showGameOver(levelData.name, reason, levelTime, alertLevel);
}

function triggerVictory() {
  gameState = 'VICTORY';

  const score     = calcScore(currentLevelIndex + 1, collectedCount,
                              levelData.totalNodes, peakAlert, levelTime);
  const rank      = calcRank(score, currentLevelIndex);
  const isNewBest = saveScore(currentLevelIndex, score);

  // Unlock next level
  if (currentLevelIndex + 1 < LEVELS.length) {
    unlockLevel(currentLevelIndex + 1);
  }

  playTone(880, 0.4, 'sine');
  showVictory(currentLevelIndex, levelData.name, score, rank, levelTime, isNewBest);
}

// ── Score / Rank ──────────────────────────────────────────────────

function calcScore(levelNum, nodesCollected, totalNodes, peakAlertPct, elapsed) {
  const base      = 1000 * levelNum;
  const dataBonus = Math.floor((nodesCollected / totalNodes) * 500);
  const alertPen  = Math.floor((peakAlertPct / 100) * 400);
  const timeBonus = Math.max(0, 300 - Math.floor(elapsed));
  const raw       = base + dataBonus - alertPen + timeBonus;
  return Math.max(0, Math.floor(raw)) * levelNum;
}

function calcRank(score, levelIndex) {
  const max = MAX_SCORES[levelIndex] || 1;
  const pct = score / max;
  if (pct >= 0.90) return 'S';
  if (pct >= 0.75) return 'A';
  if (pct >= 0.55) return 'B';
  if (pct >= 0.35) return 'C';
  return 'D';
}

// ── Alert state helper ────────────────────────────────────────────

function getAlertState(a) {
  if (a < 40)  return 'CLEAR';
  if (a < 60)  return 'CAUTION';
  if (a < 100) return 'ALERT';
  return 'LOCKDOWN';
}

// ── Render ────────────────────────────────────────────────────────

function render(timestamp) {
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (gameState === 'PLAYING' || gameState === 'PAUSED') {
    renderLevel(timestamp);
    updateHUD({
      alertLevel:   alertLevel,
      alertState:   getAlertState(alertLevel),
      collected:    collectedCount,
      required:     levelData.requiredNodes,
      elapsed:      levelTime,
      levelName:    levelData.name,
    });
  }
}

function renderLevel(timestamp) {
  if (!levelData) return;
  const t = timestamp / 1000;

  renderTiles();
  renderDoors();
  renderExtraction(t);
  renderNodes(t);
  renderCameraCones();
  renderCameras();
  renderGuards();
  renderPlayer();
  renderHackProgress();
}

// ── Tile rendering ────────────────────────────────────────────────

function renderTiles() {
  const { cols, rows, tiles } = levelData;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = tiles[row * cols + col];
      const px   = col * TILE_SIZE;
      const py   = row * TILE_SIZE;

      if (tile === TILE_WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Subtle edge highlight
        ctx.fillStyle = COLORS.wallEdge;
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillRect(px, py, 1, TILE_SIZE);
      } else if (tile === TILE_FLOOR) {
        // Checkerboard-style floor for depth
        const shade = (row + col) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillStyle = shade;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (tile === TILE_DOOR) {
        // Floor base — actual door visuals drawn in renderDoors()
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// ── Door rendering ────────────────────────────────────────────────

function renderDoors() {
  for (const door of levelData.doors) {
    const px = door.tileCol * TILE_SIZE;
    const py = door.tileRow * TILE_SIZE;

    if (!door.open) {
      // Closed door — solid red/orange block
      ctx.fillStyle = COLORS.doorClosed;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = COLORS.doorEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      // Crosshatch lines
      ctx.strokeStyle = COLORS.doorEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
      ctx.moveTo(px + TILE_SIZE, py); ctx.lineTo(px, py + TILE_SIZE);
      ctx.stroke();
    } else {
      // Open door — show as floor
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    // Terminal (only for closed doors) — small green square
    if (!door.open) {
      const tx = door.terminal.x - 6;
      const ty = door.terminal.y - 6;
      ctx.fillStyle = COLORS.terminal;
      ctx.fillRect(tx, ty, 12, 12);
      ctx.strokeStyle = COLORS.terminalEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, 12, 12);
      // Terminal dot
      ctx.fillStyle = COLORS.terminalEdge;
      ctx.fillRect(tx + 4, ty + 4, 4, 4);
    }
  }
}

// ── Extraction zone ───────────────────────────────────────────────

function renderExtraction(t) {
  const ez = levelData.extraction;
  const pulse = 0.3 + 0.2 * Math.sin(t * 3);

  if (extractionActive) {
    ctx.fillStyle = `rgba(0, 255, 65, ${pulse})`;
    ctx.fillRect(ez.x, ez.y, ez.width, ez.height);
    ctx.strokeStyle = COLORS.extractEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(ez.x, ez.y, ez.width, ez.height);

    // Label
    ctx.fillStyle = COLORS.extractEdge;
    ctx.font = 'bold 8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACT', ez.x + ez.width / 2, ez.y + ez.height / 2 + 3);
  } else {
    ctx.fillStyle = COLORS.extractInactive;
    ctx.fillRect(ez.x, ez.y, ez.width, ez.height);
    ctx.strokeStyle = '#334';
    ctx.lineWidth = 1;
    ctx.strokeRect(ez.x, ez.y, ez.width, ez.height);

    ctx.fillStyle = '#334';
    ctx.font = '7px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', ez.x + ez.width / 2, ez.y + ez.height / 2 + 3);
  }
  ctx.textAlign = 'left';
}

// ── Data nodes ────────────────────────────────────────────────────

function renderNodes(t) {
  for (const node of levelData.nodes) {
    if (node.collected) continue;

    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + node.x);
    const r     = NODE_SIZE / 2;

    // Glow halo
    ctx.fillStyle = `rgba(0, 255, 255, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
    ctx.fill();

    // Hexagon
    ctx.fillStyle   = COLORS.nodeInner;
    ctx.strokeStyle = `rgba(0,255,255,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a  = (Math.PI / 3) * i - Math.PI / 6;
      const hx = node.x + r * Math.cos(a);
      const hy = node.y + r * Math.sin(a);
      i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// ── Camera cones ──────────────────────────────────────────────────

function renderCameraCones() {
  for (const cam of levelData.cameras) {
    if (cam.hacked) {
      drawCone(cam.x, cam.y, cam.angle, cam.fov, cam.range,
               COLORS.coneHacked, COLORS.coneHackedEdge);
    } else {
      drawCone(cam.x, cam.y, cam.angle, cam.fov, cam.range,
               COLORS.coneActive, COLORS.coneActiveEdge);
    }
  }
}

function drawCone(cx, cy, angle, fov, range, fillColor, strokeColor) {
  const startAngle = angle - fov / 2;
  const endAngle   = angle + fov / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, range, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle   = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ── Cameras ───────────────────────────────────────────────────────

function renderCameras() {
  for (const cam of levelData.cameras) {
    const bodyColor = cam.hacked ? COLORS.cameraHacked : COLORS.cameraBody;

    // Body square
    ctx.fillStyle = bodyColor;
    ctx.fillRect(cam.x - 7, cam.y - 7, 14, 14);

    // Border
    ctx.strokeStyle = cam.hacked ? '#00aacc' : '#ff6600';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(cam.x - 7, cam.y - 7, 14, 14);

    // Direction dot
    ctx.fillStyle = cam.hacked ? '#00ffff' : '#ffaa00';
    ctx.beginPath();
    ctx.arc(
      cam.x + Math.cos(cam.angle) * 5,
      cam.y + Math.sin(cam.angle) * 5,
      2.5, 0, Math.PI * 2
    );
    ctx.fill();

    // Hack timer bar (small below camera when active hack remaining)
    if (cam.hacked && cam.hackTimer > 0) {
      const frac = cam.hackTimer / 8;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cam.x - 7, cam.y + 9, 14, 3);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(cam.x - 7, cam.y + 9, 14 * frac, 3);
    }
  }
}

// ── Guards ────────────────────────────────────────────────────────

function renderGuards() {
  for (const guard of levelData.guards) {
    const isPursuing = guard.mode === 'pursue';
    const bodyColor  = isPursuing ? COLORS.guardPursuit : COLORS.guardPatrol;

    // Pursuit glow
    if (isPursuing) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Guard vision cone (smaller, forward-facing)
    drawCone(guard.x, guard.y, guard.angle,
             Math.PI / 3, 100,
             COLORS.guardCone, COLORS.guardConeEdge);

    // Body rectangle
    const hw = guard.width  / 2;
    const hh = guard.height / 2;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(guard.x - hw, guard.y - hh, guard.width, guard.height);

    ctx.strokeStyle = COLORS.guardEdge;
    ctx.lineWidth   = 1;
    ctx.strokeRect(guard.x - hw, guard.y - hh, guard.width, guard.height);

    // Direction arrow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(
      guard.x + Math.cos(guard.angle) * 10,
      guard.y + Math.sin(guard.angle) * 10
    );
    ctx.stroke();
  }
}

// ── Player ────────────────────────────────────────────────────────

function renderPlayer() {
  const hw = player.width  / 2;
  const hh = player.height / 2;

  // Glow halo
  ctx.fillStyle = 'rgba(0, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle   = COLORS.player;
  ctx.fillRect(player.x - hw, player.y - hh, player.width, player.height);

  ctx.strokeStyle = COLORS.playerEdge;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(player.x - hw, player.y - hh, player.width, player.height);

  // Direction indicator
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(
    player.x + Math.cos(player.angle) * 10,
    player.y + Math.sin(player.angle) * 10
  );
  ctx.stroke();
}

// ── Hacking progress bar ──────────────────────────────────────────

function renderHackProgress() {
  if (!hackState.active || !hackState.target) return;

  const target = hackState.target;
  // Determine draw position (above target)
  let tx, ty;
  if (hackState.type === 'camera') {
    tx = target.x;
    ty = target.y - 20;
  } else {
    // door terminal
    tx = target.terminal.x;
    ty = target.terminal.y - 20;
  }

  const barW = 50;
  const barH = 6;
  const x0   = tx - barW / 2;
  const y0   = ty - barH / 2;

  // Background
  ctx.fillStyle = COLORS.hackBarBg;
  ctx.fillRect(x0, y0, barW, barH);

  // Fill
  ctx.fillStyle = COLORS.hackBar;
  ctx.fillRect(x0, y0, barW * hackState.progress, barH);

  // Border
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth   = 1;
  ctx.strokeRect(x0, y0, barW, barH);

  // Label
  ctx.fillStyle  = '#00ffff';
  ctx.font       = '7px Courier New';
  ctx.textAlign  = 'center';
  ctx.fillText('HACKING', tx, y0 - 3);
  ctx.textAlign  = 'left';
}

// ── Level deep-clone ──────────────────────────────────────────────
// Clone level so runtime mutations (node.collected, door.open, etc.) don't
// pollute the source data.

function deepCloneLevel(src) {
  return {
    ...src,
    tiles:   [...src.tiles],
    cameras: src.cameras.map(c => ({ ...c })),
    guards:  src.guards.map(g => ({
      ...g,
      waypoints: g.waypoints.map(w => ({ ...w })),
    })),
    nodes:   src.nodes.map(n => ({ ...n })),
    doors:   src.doors.map(d => ({
      ...d,
      terminal: { ...d.terminal },
    })),
    extraction: { ...src.extraction },
  };
}
