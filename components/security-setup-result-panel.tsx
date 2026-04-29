"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

type SecuritySetupResultPanelProps = {
  bankNumber: string;
  continueHref: Route;
};

export function SecuritySetupResultPanel({ bankNumber, continueHref }: SecuritySetupResultPanelProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="card security-result-panel">
      <h2>Your Bank Number</h2>
      <p className="muted">
        Save this number securely. You will need it for transactions.
      </p>
      <div className="security-result-card">
        <strong className="security-result-card__value">{bankNumber}</strong>
      </div>
      <div className="modal-card__actions">
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            void navigator.clipboard.writeText(bankNumber);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <Link href={continueHref} className="cta-link-button">
          Continue
        </Link>
      </div>
    </div>
  );
}
