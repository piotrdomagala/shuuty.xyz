import Image from 'next/image';
import type { ProductMediaPlacement } from '@/lib/productMedia';
import s from '@/app/page.module.css';

type ProductDeviceFrameProps = Readonly<{
  media: ProductMediaPlacement;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}>;

const frameClasses = {
  'ios-phone': s.deviceFrameIosPhone,
  'android-phone': s.deviceFrameAndroidPhone,
  'ios-tablet': s.deviceFrameIosTablet,
} as const;

export default function ProductDeviceFrame({
  media,
  alt,
  sizes,
  priority = false,
  className = '',
}: ProductDeviceFrameProps) {
  return (
    <span
      className={`${s.deviceFrame} ${frameClasses[media.frameKind]} ${className}`.trim()}
      data-capture-theme={media.captureTheme}
    >
      <span className={s.deviceScreen}>
        <Image
          src={media.path}
          alt={alt}
          width={media.width}
          height={media.height}
          priority={priority}
          draggable={false}
          sizes={sizes}
        />
      </span>
    </span>
  );
}
