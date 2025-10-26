/**
 * Usage:
 *   <Banner className="w-full rounded-2xl shadow" alt="Thai Good News" />
 */
export default function Banner({
  className = '',
  alt = 'Thai Good News',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <picture>
      {/* Large screens first */}
      <source
        media="(min-width: 1280px)"
        srcSet="/banners/tgn-banner-2400x600.png"
        type="image/png"
      />
      {/* Medium screens */}
      <source
        media="(min-width: 640px)"
        srcSet="/banners/tgn-banner-1200x300.png"
        type="image/png"
      />
      {/* Small screens */}
      <source
        media="(max-width: 639px)"
        srcSet="/banners/tgn-banner-600x150.png"
        type="image/png"
      />
      {/* Fallback (if sources don’t match for some reason) */}
      <img
        src="/banners/tgn-banner-1200x300.png"
        alt={alt}
        className={className}
        loading="lazy"
        width={1200}
        height={300}
      />
    </picture>
  );
}
