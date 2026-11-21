import { useState, type ReactNode } from 'react';

interface AssetImgProps {
  src?: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}

/**
 * Tenta carregar o asset da pasta /Assets.
 * Se o arquivo ainda não existir, exibe o fallback estilizado sem quebrar a UI.
 */
export function AssetImg({ src, alt, className, fallback }: AssetImgProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
