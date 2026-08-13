"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveRestockerPlanButton() {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function removePlan() {
    setRemoving(true);
    try {
      const formData = new FormData();
      formData.set("action", "removeFromCart");
      await fetch("/settings/auto-restock-subscription", { method: "POST", body: formData });
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <button type="button" className="ghost-button" onClick={() => void removePlan()} disabled={removing}>
      {removing ? "Removing..." : "Remove"}
    </button>
  );
}
