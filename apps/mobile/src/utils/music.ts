/**
 * Dual-track background music controller for Super Monster:
 * - 'menu': /sound/musica_fundo.mp3 (Title Screen & Draft Screen)
 * - 'battle': /sound/battle_dark_tactics.mp3 (Active Battle)
 * - 'none': paused (e.g. Game Over)
 */

export type MusicTrack = 'menu' | 'battle' | 'none';

const TRACK_URLS: Record<Exclude<MusicTrack, 'none'>, string> = {
  menu: '/sound/musica_fundo.mp3',
  battle: '/sound/battle_dark_tactics.mp3',
};

const STORAGE_KEY = 'sm_music_enabled';

const audios: Partial<Record<Exclude<MusicTrack, 'none'>, HTMLAudioElement>> = {};
let musicEnabled = (() => {
  if (typeof window === 'undefined') return true;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === 'true';
})();
let activeTrack: MusicTrack = 'none';
let unlockBound = false;

function getAudio(track: Exclude<MusicTrack, 'none'>): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audios[track]) {
    const el = new Audio(TRACK_URLS[track]);
    el.loop = true;
    el.volume = track === 'battle' ? 0.34 : 0.3;
    el.preload = 'auto';
    audios[track] = el;
  }
  return audios[track]!;
}

function pauseAll(except?: Exclude<MusicTrack, 'none'>) {
  (['menu', 'battle'] as const).forEach((key) => {
    if (key === except) return;
    const el = audios[key];
    if (el) {
      el.pause();
    }
  });
}

function tryPlayActive() {
  if (!musicEnabled || activeTrack === 'none') {
    pauseAll();
    return;
  }
  const track = activeTrack;
  pauseAll(track);
  const el = getAudio(track);
  if (!el) return;

  el.play().catch(() => {
    // Autoplay blocked before first user interaction
    if (!unlockBound && typeof window !== 'undefined') {
      unlockBound = true;
      const unlock = () => {
        unlockBound = false;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        if (musicEnabled && activeTrack !== 'none') {
          getAudio(activeTrack)?.play().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  });
}

export function setMusicTrack(track: MusicTrack): void {
  if (activeTrack === track) {
    if (musicEnabled && track !== 'none') {
      const el = getAudio(track);
      if (el && el.paused) tryPlayActive();
    }
    return;
  }
  activeTrack = track;
  // Reset battle track to start when entering a fresh battle
  if (track === 'battle' && audios.battle) {
    audios.battle.currentTime = 0;
  }
  tryPlayActive();
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  }
  if (enabled) {
    tryPlayActive();
  } else {
    pauseAll();
  }
}
