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
    const cooldownKey = "bazaarly:last-simulation-heartbeat";

    const tick = async () => {
      if (!active) return;
      if (document.visibilityState !== "visible") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      const now = Date.now();
      const lastRun = Number(window.localStorage.getItem(cooldownKey) ?? "0");

      if (now - lastRun < intervalMs - 5000) {
        return;
      }

      try {
        await fetch("/api/simulation", {
          method: "POST",
          cache: "no-store",
        });
        window.localStorage.setItem(cooldownKey, String(now));
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
