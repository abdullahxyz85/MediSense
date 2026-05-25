import { useState } from "react";
import {
  DISCLAIMER_TEXT,
  EMERGENCY_MSG,
  SAFETY_TITLE,
} from "../config/clinicalConfig";

export function SafetyBanner() {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div className="safety-banner" role="note" aria-live="polite">
      <div className="safety-content">
        <strong className="safety-title">{SAFETY_TITLE}</strong>
        <p className="safety-text">{DISCLAIMER_TEXT}</p>
        <p className="safety-urgent">{EMERGENCY_MSG}</p>
      </div>
      <button
        className="safety-close"
        aria-label="dismiss safety banner"
        onClick={() => setClosed(true)}
      >
        ×
      </button>
    </div>
  );
}

export default SafetyBanner;
