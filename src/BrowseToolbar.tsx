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

  const isOpen = expanded || !!q;

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
      </div>
    </div>
  );
}
