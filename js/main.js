// ═══════════════════════════════════════════════════════════════
// main.js — Entry point: bootstrap, event listeners, button wiring
// ═══════════════════════════════════════════════════════════════
import {
  init, setCanvas, keys,
  startLevel, pauseGame, resumeGame, restartLevel,
  goToMenu, getGameState, setMuted, currentLevelIndex,
} from './game.js';
import {
  showScreen, populateLevelSelect, populateHighScores, updateMuteButtons,
} from './ui.js';
import { loadMute, saveMute } from './storage.js';

// ── Canvas setup ─────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
setCanvas(canvas);

// ── Mute: restore saved preference ──────────────────────────────
let _muted = loadMute();
setMuted(_muted);
updateMuteButtons(_muted);

// ── Keyboard input ────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  keys.add(e.key);

  // Pause / resume — use the live gameState getter
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    const state = getGameState();
    if (state === 'PLAYING') {
      pauseGame();
    } else if (state === 'PAUSED') {
      resumeGame();
    }
  }

  // Prevent arrow key and space scrolling the page
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys.delete(e.key);
});

// ── Helper: wire a button click safely ───────────────────────────
function btn(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}

// ── Mute toggle (shared between menu and pause) ───────────────────
function toggleMute() {
  _muted = !_muted;
  setMuted(_muted);
  saveMute(_muted);
  updateMuteButtons(_muted);
}

// ── Main menu ─────────────────────────────────────────────────────
btn('btn-play', () => {
  populateLevelSelect(idx => startLevel(idx));
  showScreen('levelselect');
});

btn('btn-howtoplay', () => showScreen('instructions'));

btn('btn-highscores', () => {
  populateHighScores();
  showScreen('highscores');
});

btn('btn-mute-menu', toggleMute);

// ── Level select ──────────────────────────────────────────────────
btn('btn-levelselect-back', () => showScreen('menu'));

// ── Instructions ──────────────────────────────────────────────────
btn('btn-instructions-close', () => showScreen('menu'));

// ── High scores ───────────────────────────────────────────────────
btn('btn-highscores-close', () => showScreen('menu'));

// ── Pause screen ──────────────────────────────────────────────────
btn('btn-resume',        resumeGame);
btn('btn-pause-restart', restartLevel);
btn('btn-pause-menu',    goToMenu);
btn('btn-mute-pause',    toggleMute);

// ── Game over screen ──────────────────────────────────────────────
btn('btn-go-retry', restartLevel);
btn('btn-go-menu',  goToMenu);

// ── Victory screen ────────────────────────────────────────────────
btn('btn-vic-retry', restartLevel);
btn('btn-vic-menu',  goToMenu);

btn('btn-vic-next', () => {
  // currentLevelIndex is a live export — next level is index + 1
  // Re-populate level select so unlock state is fresh, then auto-advance
  const nextIdx = currentLevelIndex + 1;
  populateLevelSelect(idx => startLevel(idx));
  // Directly start the next level if it exists
  startLevel(nextIdx);
});

// ── Bootstrap ─────────────────────────────────────────────────────
init();
