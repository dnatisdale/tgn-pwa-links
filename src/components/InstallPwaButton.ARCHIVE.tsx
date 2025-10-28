
import React from "react";
import { useAppLogic } from "../hooks/useAppLogic";

export default function InstallPwaButton() {
  const { showInstallPrompt } = useAppLogic();

  return (
    <button className="btn btn-red install-pwa" onClick={showInstallPrompt}>
      Install App
    </button>
  );
}
