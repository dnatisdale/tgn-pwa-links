import React from "react";
import { t, Lang } from "./i18n";

type Props = {
  lang: Lang;
  show: boolean;
  onRefresh: () => void;
  onSkip:    () => void;
};

export default function UpdateToast({ lang, show, onRefresh, onSkip }: Props) {
  if (!show) return null;
  const L = t(lang);

  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast-row">
        <span className="label">{L.newVersion}</span>
        <button className="btn btn-blue" onClick={onRefresh}>{L.refresh}</button>
        <button className="btn btn-red"  onClick={onSkip}>{L.skip}</button>
      </div>
    </div>
  );
}
