import { useRef, type CSSProperties, type MouseEvent } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

import { useLazyLoad } from '@/hooks/useLazyLoad';

export type CoverImgProps = {
  src?: string;
  alt?: string;
  cover?: boolean;
  aspectRatio?: string | number;
  /** Load immediately instead of waiting for viewport intersection. Prefer false. */
  eager?: boolean;
  /** Show a simple spinner while audio caches. */
  downloading?: boolean;
  className?: string;
};

export function CoverImg({
  src,
  alt,
  cover = true,
  aspectRatio,
  eager = false,
  downloading = false,
  className,
}: CoverImgProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visible = useLazyLoad(rootRef, eager);

  const rootStyle: CSSProperties | undefined =
    aspectRatio != null ? { aspectRatio: String(aspectRatio) } : undefined;

  const showImage = Boolean(visible && src && !downloading);

  function preventContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  return (
    <div
      ref={rootRef}
      className={`cover-img no-touch-callout${downloading ? ' cover-img--busy' : ''}${className ? ` ${className}` : ''}`}
      style={rootStyle}
      aria-busy={downloading ? true : undefined}
      aria-label={downloading ? t('player.downloading') : undefined}
      onContextMenu={preventContextMenu}
    >
      {showImage ? (
        <img
          className={`cover-img__media${cover ? ' cover-img__media--cover' : ''}`}
          src={src}
          alt={alt ?? ''}
          draggable={false}
        />
      ) : null}
      {downloading ? (
        <div className="cover-img__busy" data-testid="cover-downloading" aria-hidden="true">
          <CircularProgress color="secondary" size={24} thickness={2} />
        </div>
      ) : null}
    </div>
  );
}
