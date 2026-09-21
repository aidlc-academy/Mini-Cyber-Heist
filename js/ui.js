// ═══════════════════════════════════════════════════════════════
// ui.js — All screen renderers, HUD updates, overlay management
// ═══════════════════════════════════════════════════════════════
import { LEVELS } from './levels.js';
import { loadScore, isLevelUnlocked } from './storage.js';
import { LEVEL_NAMES, LEVEL_THEMES } from './constants.js';

// ── Screen registry ──────────────────────────────────────────────
const SCREENS = {
  menu:         document.getElementById('screen-menu'),
  levelselect:  document.getElementById('screen-levelselect'),
  instructions: document.getElementById('screen-instructions'),
  highscores:   document.getElementById('screen-highscores'),
  pause:        document.getElementById('screen-pause'),
  gameover:     document.getElementById('screen-gameover'),
  victory:      document.getElementById('screen-victory'),
};

const hud = document.getElementById('hud');

let activeScreen = 'menu';

/** Show one screen, hide all others. Pass null to hide all (during gameplay). */
export function showScreen(name) {
  activeScreen = name;
  for (const [key, el] of Object.entries(SCREENS)) {
    if (el) {
      el.classList.toggle('visible', key === name);
      el.classList.toggle('hidden',  key !== name);
    }
  }
}

/** Hide all overlay screens (used when gameplay is active). */
export function hideAllScreens() {
  activeScreen = null;
  for (const el of Object.values(SCREENS)) {
    if (el) {
      el.classList.remove('visible');
      el.classList.add('hidden');
    }
  }
}

// ── HUD ──────────────────────────────────────────────────────────

export function showHUD()  { hud.classList.remove('hidden'); }
export function hideHUD()  { hud.classList.add('hidden'); }

/**
 * Update all HUD elements every frame.
 * @param {object} state - { alertLevel, alertState, collected, required, elapsed, levelName }
 */
export function updateHUD(state) {
  const fill  = document.getElementById('alert-bar-fill');
  const label = document.getElementById('alert-label');
  const pct   = document.getElementById('alert-pct');
  const timer = document.getElementById('hud-timer');
  const data  = document.getElementById('hud-data');
  const name  = document.getElementById('hud-level-name');

  // Alert bar
  const a = Math.min(100, Math.max(0, state.alertLevel));
  if (fill)  fill.style.width = a + '%';

  const cls = state.alertState.toLowerCase();
  if (fill)  { fill.className  = cls === 'clear' ? '' : cls; }
  if (label) {
    label.textContent = state.alertState;
    label.className   = cls === 'clear' ? '' : cls;
  }
  if (pct) pct.textContent = Math.floor(a) + '%';

  // Timer
  if (timer) timer.textContent = formatTime(state.elapsed);

  // Data counter
  if (data) data.textContent = 'DATA: ' + state.collected + ' / ' + state.required;

  // Level name
  if (name) name.textContent = state.levelName;
}

// ── Level Select ─────────────────────────────────────────────────

/** Populate and show the level select screen. */
export function populateLevelSelect(onSelectCallback) {
  const list = document.getElementById('level-list');
  if (!list) return;
  list.innerHTML = '';

  LEVELS.forEach((level, i) => {
    const unlocked = isLevelUnlocked(i);
    const score    = loadScore(i);

    const entry = document.createElement('div');
    entry.className = 'level-entry ' + (unlocked ? 'unlocked' : 'locked');

    entry.innerHTML =
      '<span class="level-entry-num">' + (i + 1) + '</span>' +
      '<div class="level-entry-info">' +
        '<div class="level-entry-name">' + (LEVEL_NAMES[i] || level.name) + '</div>' +
        '<div class="level-entry-theme">' + (LEVEL_THEMES[i] || level.theme) + '</div>' +
      '</div>' +
      '<span class="level-entry-score">' + (score > 0 ? score : '—') + '</span>' +
      '<span class="level-entry-lock">' + (unlocked ? '' : '🔒') + '</span>';

    if (unlocked) {
      entry.addEventListener('click', () => onSelectCallback(i));
    }

    list.appendChild(entry);
  });
}

// ── High Scores ──────────────────────────────────────────────────

export function populateHighScores() {
  const list = document.getElementById('highscores-list');
  if (!list) return;
  list.innerHTML = '';

  LEVELS.forEach((_, i) => {
    const score = loadScore(i);
    const entry = document.createElement('div');
    entry.className = 'hs-entry';
    entry.innerHTML =
      '<span class="hs-entry-name">LEVEL ' + (i + 1) + ' — ' + LEVEL_NAMES[i] + '</span>' +
      '<span class="hs-entry-score">' + (score > 0 ? score : '—') + '</span>';
    list.appendChild(entry);
  });
}

// ── Game Over ────────────────────────────────────────────────────

export function showGameOver(levelName, reason, elapsed, alertLevel) {
  const el = id => document.getElementById(id);
  setText(el('go-level-name'), levelName);
  setText(el('go-reason'),     reason);
  setText(el('go-time'),       formatTime(elapsed));
  setText(el('go-alert'),      Math.floor(alertLevel) + '%');
  showScreen('gameover');
  hideHUD();
}

// ── Victory ──────────────────────────────────────────────────────

export function showVictory(levelIndex, levelName, score, rank, elapsed, isNewBest) {
  const el = id => document.getElementById(id);
  setText(el('vic-level-name'), levelName);
  setText(el('vic-score'),      String(score));
  setText(el('vic-rank'),       rank);
  setText(el('vic-time'),       formatTime(elapsed));

  const newBest = el('vic-newbest');
  if (newBest) {
    newBest.classList.toggle('hidden', !isNewBest);
  }

  // Next level button — show only if there's a next level
  const nextBtn = el('btn-vic-next');
  if (nextBtn) {
    const hasNext = levelIndex < LEVELS.length - 1;
    nextBtn.classList.toggle('hidden', !hasNext);
  }

  showScreen('victory');
  hideHUD();
}

// ── Mute button labels ───────────────────────────────────────────

export function updateMuteButtons(muted) {
  const label = muted ? '♪ AUDIO OFF' : '♪ AUDIO ON';
  const btnMenu  = document.getElementById('btn-mute-menu');
  const btnPause = document.getElementById('btn-mute-pause');
  if (btnMenu)  { btnMenu.textContent  = label; btnMenu.classList.toggle('muted',  muted); }
  if (btnPause) { btnPause.textContent = label; btnPause.classList.toggle('muted', muted); }
}

// ── Utilities ────────────────────────────────────────────────────

function setText(el, text) {
  if (el) el.textContent = text;
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}
