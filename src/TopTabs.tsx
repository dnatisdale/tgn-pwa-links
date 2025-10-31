// src/TopTabs.tsx
// Simple, hash-link top tabs. No external state required.

import * as React from 'react';

export default function TopTabs() {
  // Edit labels/links as needed
  const tabs = [
    { href: '#/', label: 'Home' },
    { href: '#/add', label: 'Add Link' },
    { href: '#/import-export', label: 'Import/Export' },
    { href: '#/qr', label: 'QR' },
    { href: '#/contact', label: 'Contact' },
  ];

  // Determine active tab by current hash
  const [hash, setHash] = React.useState<string>(window.location.hash || '#/');
  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <nav className="w-full">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => {
          const isActive = hash === t.href;
          return (
            <a
              key={t.href}
              href={t.href}
              className={[
                'px-3 py-1 rounded-lg text-sm transition',
                isActive ? 'bg-[#2D2A4A] text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
                'border border-gray-200',
              ].join(' ')}
            >
              {t.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
