// src/BrowseToolbar.tsx
import React from 'react';

type Props = {
  q: string;
  setQ: (v: string) => void;
  filterThai: boolean;
  setFilterThai: (v: boolean) => void;
};

export default function BrowseToolbar({ q, setQ, filterThai, setFilterThai }: Props) {
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const closeSearch = () => {
    setExpanded(false);
    if (!q) setQ('');
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-2 mb-4">
      {/* Left: language filter */}
      <div className="text-sm not-italic">
        <button
          onClick={() => setFilterThai(false)}
          className={!filterThai ? 'underline underline-offset-2' : 'underline-offset-2'}
          style={{ marginRight: 8 }}
          title="Show all languages"
        >
          All
        </button>
        <span className="mx-1 text-gray-400">|</span>
        <button
          onClick={() => setFilterThai(true)}
          className={filterThai ? 'underline underline-offset-2' : 'underline-offset-2'}
          title="Thai only"
        >
          Thai only
        </button>
      </div>

      {/* Right: expanding search */}
      <div className="flex items-center gap-2">
        <div
          className={[
            'relative flex items-center transition-all duration-200',
            expanded || q ? 'w-64' : 'w-10',
          ].join(' ')}
        >
          {/* Circle button */}
          <button
            onClick={expanded ? closeSearch : openSearch}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50"
            title={expanded ? 'Close search' : 'Search'}
            aria-label="Search"
            type="button"
          >
            {/* magnifying glass */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"></line>
            </svg>
          </button>

          {/* Input that slides open */}
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all languages..."
            className={[
              'absolute right-0 h-10 pl-3 pr-3 rounded-full border border-gray-300 bg-white',
              'outline-none text-sm not-italic',
              'transition-all duration-200',
              expanded || q
                ? 'opacity-100 pointer-events-auto w-52 ml-2'
                : 'opacity-0 pointer-events-none w-0',
            ].join(' ')}
            onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
          />
        </div>
      </div>
    </div>
  );
}
