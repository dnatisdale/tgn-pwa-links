import React from "react";

type Props = {
  show: boolean;
  onRefresh: () => void;
  onSkip: () => void;
};

export default function UpdateToastMini({ show, onRefresh, onSkip }: Props) {
  if (!show) return null;

  return (
    <div className="upd-mini" role="status" aria-live="polite">
      <div className="upd-square">
        <span className="upd-bolt" aria-hidden="true">↻</span>
      </div>

      <div className="upd-text">
        <div className="upd-title">New version</div>
        <div className="upd-buttons">
          <button className="btn btn-blue btn-sm" onClick={onRefresh}>
            Refresh
          </button>
          <button className="btn btn-gray btn-sm" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
