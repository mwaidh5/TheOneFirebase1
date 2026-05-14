import React, { useState, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Target display width in px. Used to pick the closest resized variant. Defaults to 800. */
  displayWidth?: number;
  /** Extra className for the wrapper div */
  wrapperClassName?: string;
}

// Must match the SIZES configured in the Firebase storage-resize-images extension.
const FIREBASE_RESIZE_SIZES: number[] = [400, 800, 1600];

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

function pickFirebaseSize(targetWidth: number): number {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const needed = targetWidth * dpr;
  return FIREBASE_RESIZE_SIZES.find(s => s >= needed) ?? FIREBASE_RESIZE_SIZES[FIREBASE_RESIZE_SIZES.length - 1];
}

function rewriteFirebaseUrl(url: string, targetWidth: number): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('firebasestorage') && !u.hostname.includes('storage.googleapis.com')) {
      return null;
    }
    const pathMatch = u.pathname.match(/^(\/v0\/b\/[^/]+\/o\/)(.+)$/);
    if (!pathMatch) return null;

    const encodedFilePath = pathMatch[2];
    const filePath = decodeURIComponent(encodedFilePath);

    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1) return null;
    const ext = filePath.slice(lastDot + 1).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) return null;

    // Don't double-rewrite — extension output already matches _NNNxNNN.webp
    if (/_\d+x\d+\.webp$/i.test(filePath)) return null;

    const size = pickFirebaseSize(targetWidth);
    const base = filePath.slice(0, lastDot);
    const newPath = `${base}_${size}x${size}.webp`;
    u.pathname = pathMatch[1] + encodeURIComponent(newPath);
    return u.toString();
  } catch {
    return null;
  }
}

function optimizeSrc(src: string, width: number): string {
  if (!src) return src;
  try {
    if (src.includes('images.unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('w', String(width));
      url.searchParams.set('fm', 'webp');
      url.searchParams.set('q', '75');
      url.searchParams.set('auto', 'format');
      return url.toString();
    }
    const fb = rewriteFirebaseUrl(src, width);
    if (fb) return fb;
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
  const optimizedSrc = optimizeSrc(src, displayWidth);
  const [currentSrc, setCurrentSrc] = useState<string>(optimizedSrc);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const next = optimizeSrc(src, displayWidth);
    setCurrentSrc(next);
    setLoaded(false);
  }, [src, displayWidth]);

  const handleError = () => {
    // Fallback to the original (unrewritten) URL if the resized variant 404s
    // — e.g. an old upload that predates the resize extension.
    if (currentSrc !== src) {
      setCurrentSrc(src);
    }
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  );
};

export default LazyImage;
