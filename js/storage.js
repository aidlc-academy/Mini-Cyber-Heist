// ═══════════════════════════════════════════════════════════════
// storage.js — localStorage abstraction with graceful failure
// All functions are wrapped in try/catch; failures are silent.
// ═══════════════════════════════════════════════════════════════

const PFX = 'mch_';

// ── Scores ──────────────────────────────────────────────────────

/** Save a score for level index (0-based). Only saves if higher. */
export function saveScore(levelIndex, score) {
  try {
    const key = PFX + 'score_' + levelIndex;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (score > prev) {
      localStorage.setItem(key, String(score));
      return true; // new best
    }
    return false;
  } catch (_) {
    return false;
  }
}

/** Load best score for level index (0-based). Returns 0 if unavailable. */
export function loadScore(levelIndex) {
  try {
    return parseInt(localStorage.getItem(PFX + 'score_' + levelIndex) || '0', 10);
  } catch (_) {
    return 0;
  }
}

// ── Level unlock ────────────────────────────────────────────────

/** Level 0 is always unlocked. Others are unlocked explicitly. */
export function isLevelUnlocked(levelIndex) {
  if (levelIndex === 0) return true;
  try {
    return localStorage.getItem(PFX + 'unlock_' + levelIndex) === '1';
  } catch (_) {
    return false;
  }
}

/** Mark a level as unlocked (e.g. after completing the previous one). */
export function unlockLevel(levelIndex) {
  if (levelIndex === 0) return;
  try {
    localStorage.setItem(PFX + 'unlock_' + levelIndex, '1');
  } catch (_) {
    // silent
  }
}

// ── Mute preference ─────────────────────────────────────────────

export function saveMute(muted) {
  try {
    localStorage.setItem(PFX + 'mute', muted ? '1' : '0');
  } catch (_) {
    // silent
  }
}

export function loadMute() {
  try {
    return localStorage.getItem(PFX + 'mute') === '1';
  } catch (_) {
    return false;
  }
}
