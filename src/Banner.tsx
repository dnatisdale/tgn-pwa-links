/**
 * Usage:
 *   <Banner className="w-full rounded-2xl shadow" alt="Thai Good News" />
 */
export default function Banner({ alt = 'Thai Good News', className = '' }) {
  return (
    <picture className={className}>
      <source media="(min-width:1280px)" srcSet="/banners/tgn-banner-2400x600.png" />
      <source media="(min-width:700px)" srcSet="/banners/tgn-banner-1200x300.png" />
      <img
        src="/banners/tgn-banner-600x150.png"
        alt={alt}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </picture>
  );
}
