import React, { useState } from 'react';

/**
 * LazyImage — drop-in replacement for <img> with:
 *  - Skeleton shimmer while loading
 *  - loading="lazy" + decoding="async" for browser-level optimisation
 *  - Automatic Unsplash URL downsizing for card thumbnails
 */

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Target display width in px. Used to resize Unsplash URLs. Defaults to 800. */
  displayWidth?: number;
  /** Extra className for the wrapper div */
  wrapperClassName?: string;
}

function optimizeSrc(src: string, width: number): string {
  if (!src) return src;
  try {
    // Unsplash CDN — rewrite w= param
    if (src.includes('images.unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('w', String(width));
      url.searchParams.set('fm', 'webp');
      url.searchParams.set('q', '75');
      url.searchParams.set('auto', 'format');
      return url.toString();
    }
    // Firebase Storage / other — return as-is
    return src;
  } catch {
    return src;
  }
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  displayWidth = 800,
  className = '',
  wrapperClassName = '',
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = optimizeSrc(src, displayWidth);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {/* Shimmer skeleton — visible until image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  );
};

export default LazyImage;
