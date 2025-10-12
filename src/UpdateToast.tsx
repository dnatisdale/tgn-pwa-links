// src/UpdateToast.tsx
import React, { useEffect, useState } from "react";

// Let TS know this global may exist (defined in vite.config.ts -> define)
declare const __APP_VERSION__: string | undefined;

export default function UpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onUpd = () => setShow(true);
    window.addEventListener("tgn-sw-update", onUpd);
    return () => window.removeEventListener("tgn-sw-update", onUpd);
  }, []);

  if (!show) return null;

  const refresh = () => {
    // set by main.tsx when registering the SW
    (window as any).__tgnUpdateSW?.(true); // update SW + reload page
  };

  return (
    <div className="toast">
      <div className="toast-row">
        <span>
          New version available — refresh
          {typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__
            ? ` (${__APP_VERSION__})`
            : ""}
        </span>
        <button className="toast-btn" onClick={refresh}>Refresh</button>
        <button className="toast-btn ghost" onClick={() => setShow(false)}>Later</button>
      </div>
    </div>
  );
}
