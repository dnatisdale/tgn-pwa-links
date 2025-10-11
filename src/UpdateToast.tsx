import React, { useEffect, useState } from "react";

export default function UpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onUpd = () => setShow(true);
    window.addEventListener("tgn-sw-update", onUpd);
    return () => window.removeEventListener("tgn-sw-update", onUpd);
  }, []);

  if (!show) return null;

  const refresh = () => {
    // @ts-ignore
    const fn = window.__tgnUpdateSW as undefined | ((reload?: boolean) => void);
    fn?.(true); // update SW + reload page
  };

  return (
    <div className="toast">
      <div className="toast-row">
        <span>New version available</span>
        <button className="toast-btn" onClick={refresh}>Refresh</button>
        <button className="toast-btn ghost" onClick={() => setShow(false)}>Later</button>
      </div>
    </div>
  );
}
