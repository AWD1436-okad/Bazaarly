"use client";

import { useEffect } from "react";

export function SimulationHeartbeat() {
  useEffect(() => {
    let active = true;

    const tick = async () => {
      if (!active) return;

      try {
        await fetch("/api/simulation", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // Ignore transient dev-server failures.
      }
    };

    void tick();
    const interval = window.setInterval(tick, 45000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
