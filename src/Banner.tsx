// src/Banner.tsx
import React from 'react';

export default function Banner() {
  return (
    <div className="w-full">
      <div className="w-11/12 md:w-1/2 mx-auto mb-3">
        <picture>
          <source media="(min-width: 1280px)" srcSet="/banners/tgn-banner-2400x600.png" />
          <source media="(min-width: 640px)" srcSet="/banners/tgn-banner-1200x300.png" />
          <img
            src="/banners/tgn-banner-600x150.png"
            alt="Thai Good News Banner"
            className="w-full h-auto object-contain rounded-b-2xl shadow-md"
            loading="eager"
          />
        </picture>
      </div>
    </div>
  );
}
