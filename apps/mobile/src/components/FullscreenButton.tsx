import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sfx } from '../utils/sfx';

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

/**
 * Top fullscreen toggle button for mobile & desktop play.
 */
export function FullscreenButton() {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const sync = () => {
      const doc = document as FullscreenDoc;
      setIsFull(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = async () => {
    sfx.click();
    const doc = document as FullscreenDoc;
    const el = document.documentElement as FullscreenEl;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      }
    } catch {
      // Some mobile browsers (e.g. iOS Safari) restrict programmatic fullscreen
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      title={isFull ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      aria-label={isFull ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2.5 py-0.5 rounded-full hud-stone-bar border border-amber-500/60 text-[9px] font-runic tracking-wider text-amber-200 hover:border-amber-300 active:scale-95 transition cursor-pointer shadow-lg opacity-85 hover:opacity-100"
    >
      {isFull ? (
        <>
          <Minimize2 className="w-3 h-3 text-amber-300" />
          <span>SAIR</span>
        </>
      ) : (
        <>
          <Maximize2 className="w-3 h-3 text-amber-300" />
          <span>FULL</span>
        </>
      )}
    </button>
  );
}
