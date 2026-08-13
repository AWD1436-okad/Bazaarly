"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type ConfirmActionDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  confirmTone?: "default" | "danger";
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  title,
  message,
  confirmLabel,
  confirmTone = "default",
  submitting = false,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onCancel();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel, submitting]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && onCancel()}>
      <section
        className={confirmTone === "danger" ? "modal-card modal-card--danger" : "modal-card"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-card__close" onClick={onCancel} disabled={submitting} aria-label="Close confirmation">
          <X size={18} aria-hidden="true" />
        </button>
        <div className="modal-card__copy">
          <h2 id="confirm-action-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-card__actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className={confirmTone === "danger" ? "danger-button" : undefined} onClick={onConfirm} disabled={submitting} autoFocus>
            {submitting ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
