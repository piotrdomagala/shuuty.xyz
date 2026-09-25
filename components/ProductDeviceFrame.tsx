import { getImageProps } from 'next/image';
import type { ProductMediaPlacement } from '@/lib/productMedia';
import s from '@/app/page.module.css';

type ProductDeviceFrameProps = Readonly<{
  media: ProductMediaPlacement;
  alt: string;
  sizes: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
}>;

const frameClasses = {
  'ios-phone': s.deviceFrameIosPhone,
  'android-phone': s.deviceFrameAndroidPhone,
  'ios-tablet': s.deviceFrameIosTablet,
} as const;

// The static export serves unoptimized images, so next/image emits no srcset.
// Both deterministic derivatives are listed here instead: the browser takes the
// compact third-size file only where it is sharp enough for the frame width
// (from `sizes`) and the screen density, and the half-size file everywhere else.
export function productImageSrcSet(media: ProductMediaPlacement) {
  return `${media.compact.path} ${media.compact.width}w, ${media.path} ${media.width}w`;
}

export default function ProductDeviceFrame({
  media,
  alt,
  sizes,
  loading = 'lazy',
  fetchPriority,
  className = '',
}: ProductDeviceFrameProps) {
  const { props } = getImageProps({
    src: media.path,
    alt,
    width: media.width,
    height: media.height,
    loading,
    fetchPriority,
    sizes,
  });

  return (
    <span
      className={`${s.deviceFrame} ${frameClasses[media.frameKind]} ${className}`.trim()}
      data-capture-theme={media.captureTheme}
    >
      <span className={s.deviceScreen}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image cannot take our own srcset in a static export */}
        <img {...props} alt={alt} srcSet={productImageSrcSet(media)} sizes={sizes} draggable={false} />
      </span>
    </span>
  );
}
