import type { ReactNode } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface RunicButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Primary sculpted clawed bronze/iron CTA button powered by `dialog_btn_confirm_draft.png`.
 * Uses width-driven natural aspect ratio (`w-full h-auto`) so claws and runes are never stretched or shrunk.
 */
export function RunicButton({
  children,
  onClick,
  disabled = false,
  className = '',
  size = 'md',
}: RunicButtonProps) {
  const sizeClass =
    size === 'lg'
      ? 'w-[280px] h-[98px] text-sm'
      : size === 'sm'
        ? 'w-[205px] h-[72px] text-xs'
        : 'w-[248px] h-[86px] text-[13px]';

  const handleClick = () => {
    if (disabled) return;
    sfx.click();
    onClick?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={[
        'group relative mx-auto max-w-full flex items-center justify-center transition-all duration-150 select-none',
        sizeClass,
        disabled
          ? 'opacity-65 saturate-50 cursor-not-allowed'
          : 'hover:brightness-115 active:scale-[0.96] cursor-pointer',
        className,
      ].join(' ')}
    >
      <AssetImg
        src={UI_ASSETS.dialogBtnConfirmDraft}
        alt=""
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.92)]"
        fallback={
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-2 border-amber-200" />
        }
      />

      <span className="relative z-10 px-10 flex items-center justify-center gap-1.5 font-display tracking-[0.07em] text-amber-100 text-outline whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}
