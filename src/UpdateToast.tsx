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
    <div className="toast" role="status" aria-live="polite" style={{ position: "fixed", right: 12, bottom: 12, background: "#111", color: "#fff", padding: 12, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span>New Version Available</span>
        <button className="btn-blue" onClick={refresh}>Refresh</button>
        <button className="btn-red" onClick={() => setShow(false)}>Skip</button>
      </div>
    </div>
  );
}
