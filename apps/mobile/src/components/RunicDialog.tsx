import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface RunicDialogProps {
  title?: string;
  variant?: 'main' | 'popup';
  onClose?: () => void;
  hideCloseButton?: boolean;
  hideHeaderPlate?: boolean;
  children: ReactNode;
  maxWidthClass?: string;
}

/**
 * Reusable sculpted stone & bronze runic dialog powered by
 * `dialog_frame_main.png` (3:4), `dialog_frame_popup.png` (1:1),
 * and `dialog_header_plate.png` (16:9).
 */
export function RunicDialog({
  title,
  variant = 'popup',
  onClose,
  hideCloseButton = false,
  hideHeaderPlate = false,
  children,
  maxWidthClass,
}: RunicDialogProps) {
  const isMain = variant === 'main';

  const handleClose = () => {
    sfx.click();
    onClose?.();
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/86 backdrop-blur-[3px] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose ? handleClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          'relative w-full animate-dialog-pop select-none flex flex-col',
          maxWidthClass ??
            (isMain ? 'max-w-[380px] max-h-[86%]' : 'max-w-[335px]'),
        ].join(' ')}
      >
        {/* Top Floating Header Title Plate (dialog_header_plate.png scaled by width) */}
        {!hideHeaderPlate && title && (
          <div className="relative z-30 -mb-6 mx-auto w-[96%] h-[62px] flex items-center justify-center pointer-events-none">
            <AssetImg
              src={UI_ASSETS.dialogHeaderPlate}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]"
              fallback={
                <div className="w-full h-10 rounded-xl hud-stone-bar border-2 border-amber-400/80" />
              }
            />
            <h3 className="relative z-10 px-14 font-display text-xs sm:text-[13px] tracking-[0.07em] uppercase text-amber-200 text-outline truncate text-center max-w-full">
              {title}
            </h3>
          </div>
        )}

        {/* Sculpted Frame Container */}
        <div
          className={[
            'relative w-full flex flex-col overflow-hidden',
            isMain
              ? 'min-h-[430px] max-h-[76dvh]'
              : 'aspect-square min-h-[310px]',
          ].join(' ')}
        >
          {/* Stone & Bronze Frame Artwork */}
          <AssetImg
            src={isMain ? UI_ASSETS.dialogFrameMain : UI_ASSETS.dialogFramePopup}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full object-fill drop-shadow-[0_20px_44px_rgba(0,0,0,0.98)]"
            fallback={
              <div className="pointer-events-none absolute inset-0 rounded-2xl runic-dialog-panel" />
            }
          />

          {/* Close Button on Top-Right Corner (omitted when hideCloseButton is true) */}
          {onClose && !hideCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-40 w-8 h-8 rounded-full hud-stone-bar border-2 border-amber-400/85 text-amber-200 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.95)] hover:brightness-125 active:scale-90 transition cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.8]" />
            </button>
          )}

          {/* Strictly Centered Safe Inner Content Area inside the dark stone recess */}
          <div
            className={[
              'relative z-20 flex-1 flex flex-col overflow-y-auto',
              isMain
                ? 'px-[20%] pt-[18%] pb-[13%]'
                : 'px-[18%] pt-[17%] pb-[15%] justify-center',
            ].join(' ')}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
