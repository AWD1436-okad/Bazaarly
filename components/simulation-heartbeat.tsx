"use client";

import { useEffect } from "react";

type SimulationHeartbeatProps = {
  intervalMs?: number;
  initialDelayMs?: number;
};

export function SimulationHeartbeat({
  intervalMs = 180000,
  initialDelayMs = 10000,
}: SimulationHeartbeatProps) {
  useEffect(() => {
    let active = true;
    let timeout: number | undefined;

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

    timeout = window.setTimeout(() => {
      void tick();
    }, initialDelayMs);
    const interval = window.setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      active = false;
      if (timeout) {
        window.clearTimeout(timeout);
      }
      window.clearInterval(interval);
    };
  }, [initialDelayMs, intervalMs]);

  return null;
}
