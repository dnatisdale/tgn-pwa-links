import React, { useEffect, useState } from "react";

function isStandalone() {
  return (
    // iOS Safari
    (window.navigator as any).standalone === true ||
    // all modern browsers
    window.matchMedia?.("(display-mode: standalone)").matches
  );
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function IOSInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("tgn-hide-ios-hint") === "1";
    if (!seen && isIOS() && !isStandalone()) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem("tgn-hide-ios-hint", "1");
    setShow(false);
  };

  return (
    <div className="toast ios-hint">
      <div className="toast-row">
        <span>
          iOS: Open <b>Share</b> (□↑) → <b>Add to Home Screen</b> to install
        </span>
        <button className="toast-btn" onClick={dismiss}>Got it</button>
      </div>
    </div>
  );
}
