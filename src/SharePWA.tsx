import React from "react";
import { THAI_BLUE } from "./ColorTheme";

export default function SharePWA() {
  const share = async () => {
    const url = window.location.origin + "/";
    const title = "Thai Good News";
    const text = "Check out the Thai Good News PWA";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user canceled – ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("App link copied!");
      } catch {
        alert(url);
      }
    }
  };

  return (
    <button className="btn-blue" onClick={share} style={{ background: THAI_BLUE }}>
      Share PWA
    </button>
  );
}
