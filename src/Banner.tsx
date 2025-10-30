// src/Banner.tsx
import React from 'react';

export default function Banner() {
  return (
    <div className="w-full">
      <picture>
        {/* Desktop large */}
        <source media="(min-width: 1280px)" srcSet="/banners/tgn-banner-2400x600.png" />
        {/* Tablet medium */}
        <source media="(min-width: 640px)" srcSet="/banners/tgn-banner-1200x300.png" />
        {/* Phone small */}
        <img
          src="/banners/tgn-banner-600x150.png"
          alt="Thai Good News Banner"
          className="w-full h-auto object-cover rounded-b-2xl shadow-md"
          loading="eager"
        />
      </picture>
    </div>
  );
}
