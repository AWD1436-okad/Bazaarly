"use client";

import { useEffect, useState } from "react";

type CheckoutStickyActionProps = {
  formId: string;
  totalLabel: string;
  itemCount: number;
  disabledByAvailability: boolean;
};

function hasRequiredValues(form: HTMLFormElement) {
  const requiredFields = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input[required], textarea[required], select[required]",
    ),
  );

  return requiredFields.every((field) => field.value.trim().length > 0);
}

export function CheckoutStickyAction({
  formId,
  totalLabel,
  itemCount,
  disabledByAvailability,
}: CheckoutStickyActionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const updateReadiness = () => {
      const valid = form.checkValidity();
      setIsFormReady(valid && hasRequiredValues(form));
    };

    const handleSubmit = () => {
      setIsSubmitting(true);
    };

    const handlePageShow = () => {
      setIsSubmitting(false);
      updateReadiness();
    };

    updateReadiness();

    form.addEventListener("input", updateReadiness);
    form.addEventListener("change", updateReadiness);
    form.addEventListener("submit", handleSubmit);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      form.removeEventListener("input", updateReadiness);
      form.removeEventListener("change", updateReadiness);
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [formId]);

  const disabled = disabledByAvailability || !isFormReady || isSubmitting;

  return (
    <aside className="checkout-sticky-bottom" aria-label="Checkout action">
      <div>
        <span className="muted">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
        <strong>{totalLabel}</strong>
      </div>
      <button type="submit" form={formId} disabled={disabled}>
        {disabledByAvailability
          ? "Update cart"
          : isSubmitting
            ? "Confirming..."
            : "Confirm Purchase"}
      </button>
    </aside>
  );
}
