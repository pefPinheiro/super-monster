/**
 * File-based Sound Effects (SFX) manager for Super Monster.
 * Exclusively plays real .wav files from /Assets/sound/sfx/ (served at /sound/sfx/...).
 */

const STORAGE_KEY = 'sm_sfx_enabled';

let sfxEnabled = (() => {
  if (typeof window === 'undefined') return true;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === 'true';
})();

const SFX_PATHS = {
  click: '/sound/sfx/sfx_click.wav',
  swipe: '/sound/sfx/sfx_swipe.wav',
  cardPlace: '/sound/sfx/sfx_card_place.wav',
  cardRemove: '/sound/sfx/sfx_card_remove.wav',
  attack: '/sound/sfx/sfx_attack.wav',
  attackAdvantage: '/sound/sfx/sfx_attack_advantage.wav',
  skill: '/sound/sfx/sfx_skill.wav',
  heal: '/sound/sfx/sfx_heal.wav',
  victory: '/sound/sfx/sfx_victory.wav',
  defeat: '/sound/sfx/sfx_defeat.wav',
} as const;

type SfxKey = keyof typeof SFX_PATHS;

const audioCache: Partial<Record<SfxKey, HTMLAudioElement>> = {};
const missingKeys = new Set<SfxKey>();

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  }
}

function playFile(key: SfxKey, volume = 0.65): void {
  if (!sfxEnabled || typeof window === 'undefined' || missingKeys.has(key)) {
    return;
  }

  let base = audioCache[key];
  if (!base) {
    base = new Audio(SFX_PATHS[key]);
    base.preload = 'auto';
    base.addEventListener('error', () => {
      missingKeys.add(key);
    });
    audioCache[key] = base;
  }

  const instance = base.cloneNode() as HTMLAudioElement;
  instance.volume = volume;
  instance.play().catch(() => {
    // Ignore autoplay or missing-file rejections
  });
}

export const sfx = {
  click() {
    playFile('click', 0.55);
  },

  swipe() {
    playFile('swipe', 0.5);
  },

  cardPlace() {
    playFile('cardPlace', 0.7);
  },

  cardRemove() {
    playFile('cardRemove', 0.55);
  },

  attack(isAdvantage = false) {
    playFile(isAdvantage ? 'attackAdvantage' : 'attack', 0.75);
  },

  skill() {
    playFile('skill', 0.72);
  },

  heal() {
    playFile('heal', 0.7);
  },

  victory() {
    playFile('victory', 0.8);
  },

  defeat() {
    playFile('defeat', 0.75);
  },
};
