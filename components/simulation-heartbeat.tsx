"use client";

import { useEffect } from "react";

type SimulationHeartbeatProps = {
  intervalMs?: number;
  initialDelayMs?: number;
};

export function SimulationHeartbeat({
  intervalMs = 70000,
  initialDelayMs = 12000,
}: SimulationHeartbeatProps) {
  useEffect(() => {
    let active = true;
    let timeout: number | undefined;
    const cooldownKey = "bazaarly:last-simulation-heartbeat";
    const jitterKey = "bazaarly:simulation-heartbeat-jitter";

    const getJitterMs = () => {
      const existing = Number(window.localStorage.getItem(jitterKey) ?? "0");

      if (existing > 0) {
        return existing;
      }

      const next = Math.floor(Math.random() * 18000);
      window.localStorage.setItem(jitterKey, String(next));
      return next;
    };

    const tick = async () => {
      if (!active) return;
      if (document.visibilityState !== "visible") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      const now = Date.now();
      const lastRun = Number(window.localStorage.getItem(cooldownKey) ?? "0");
      const jitterMs = getJitterMs();

      if (now - lastRun < intervalMs + jitterMs - 5000) {
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
    }, initialDelayMs + Math.floor(Math.random() * 6000));
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
